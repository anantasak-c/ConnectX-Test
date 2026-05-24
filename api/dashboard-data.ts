import { google } from "googleapis";

type WorkerRow = {
  WORKER_ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  SALARY: string | number;
  JOINING_DATE: string;
  DEPARTMENT: string;
};

type TitleRow = {
  WORKER_REF_ID: string;
  WORKER_TITLE: string;
  AFFECTED_FROM: string;
};

type BonusRow = {
  WORKER_REF_ID: string;
  BONUS_AMOUNT: string | number;
  BONUS_DATE: string;
};

type EmployeeRecord = {
  workerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  title: string;
  salary: number;
  totalBonus: number;
  totalIncome: number;
  joiningDate: string;
  salaryBand: string;
  hasBonus: boolean;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(_request: unknown, response: VercelResponse) {
  try {
    const sheetsData = await readGoogleSheetsData();
    response.json(buildDashboardData({ ...sheetsData, source: "google-sheets" }));
  } catch (googleError) {
    try {
      response.json({
        ...buildDashboardData({ ...fallbackData, source: "csv-fallback" }),
        warning: getErrorMessage(googleError),
      });
    } catch (fallbackError) {
      response.status(500).json({
        error: "Unable to load dashboard data from Google Sheets or fallback data.",
        googleError: getErrorMessage(googleError),
        fallbackError: getErrorMessage(fallbackError),
      });
    }
  }
}

async function readGoogleSheetsData() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = normalizeSpreadsheetId(process.env.GOOGLE_SHEET_ID);

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing Google service account email, private key, or sheet ID.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const workerSheet = process.env.GOOGLE_WORKER_SHEET_NAME ?? "Worker";
  const titleSheet = process.env.GOOGLE_TITLE_SHEET_NAME ?? "Title";
  const bonusSheet = process.env.GOOGLE_BONUS_SHEET_NAME ?? "Bonus";

  const [workers, titles, bonuses] = await Promise.all([
    readSheet<WorkerRow>(sheets, spreadsheetId, workerSheet),
    readSheet<TitleRow>(sheets, spreadsheetId, titleSheet),
    readSheet<BonusRow>(sheets, spreadsheetId, bonusSheet),
  ]);

  return { workers, titles, bonuses };
}

async function readSheet<T>(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string,
) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName.replace(/'/g, "''")}'!A:Z`,
  });
  const values = result.data.values;
  if (!values || values.length < 2) {
    throw new Error(`Google Sheet tab "${sheetName}" has no data rows.`);
  }
  const [headers, ...rows] = values;
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [String(header), row[index] ?? ""])),
  ) as T[];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function normalizeSpreadsheetId(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  const urlMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed.split(/[/?#]/)[0];
}

function buildDashboardData(input: {
  workers: WorkerRow[];
  titles: TitleRow[];
  bonuses: BonusRow[];
  source: string;
}) {
  const bonusesByWorker = new Map<string, number>();
  for (const bonus of input.bonuses) {
    bonusesByWorker.set(
      bonus.WORKER_REF_ID,
      (bonusesByWorker.get(bonus.WORKER_REF_ID) ?? 0) + toNumber(bonus.BONUS_AMOUNT),
    );
  }

  const titlesByWorker = new Map<string, TitleRow>();
  for (const title of input.titles) {
    const current = titlesByWorker.get(title.WORKER_REF_ID);
    if (!current || title.AFFECTED_FROM > current.AFFECTED_FROM) {
      titlesByWorker.set(title.WORKER_REF_ID, title);
    }
  }

  const employees: EmployeeRecord[] = input.workers.map((worker) => {
    const salary = toNumber(worker.SALARY);
    const totalBonus = bonusesByWorker.get(worker.WORKER_ID) ?? 0;
    return {
      workerId: worker.WORKER_ID,
      firstName: worker.FIRST_NAME,
      lastName: worker.LAST_NAME,
      fullName: `${worker.FIRST_NAME} ${worker.LAST_NAME}`.trim(),
      department: worker.DEPARTMENT || "Unassigned",
      title: titlesByWorker.get(worker.WORKER_ID)?.WORKER_TITLE ?? "Unassigned",
      salary,
      totalBonus,
      totalIncome: salary + totalBonus,
      joiningDate: worker.JOINING_DATE,
      salaryBand: getSalaryBand(salary),
      hasBonus: totalBonus > 0,
    };
  });

  const totalEmployees = employees.length;
  const totalSalary = sum(employees.map((employee) => employee.salary));
  const totalBonus = sum(employees.map((employee) => employee.totalBonus));
  const totalIncome = totalSalary + totalBonus;
  const salaries = employees.map((employee) => employee.salary);
  const employeesWithBonus = employees.filter((employee) => employee.hasBonus).length;

  return {
    source: input.source,
    generatedAt: new Date().toISOString(),
    kpis: {
      totalEmployees,
      totalSalary,
      averageSalary: Math.round(totalSalary / totalEmployees),
      medianSalary: median(salaries),
      minSalary: Math.min(...salaries),
      maxSalary: Math.max(...salaries),
      totalBonus,
      totalIncome,
      employeesWithBonus,
      bonusCoverage: percent(employeesWithBonus, totalEmployees),
    },
    departmentContribution: buildDepartmentContribution(employees, totalEmployees, totalIncome),
    bonusDistribution: buildBonusDistribution(employees, totalBonus),
    salaryBands: ["Below 100K", "100K-199K", "200K-399K", "400K+"].map((band) => ({
      band,
      employees: employees.filter((employee) => employee.salaryBand === band).length,
    })),
    titleDistribution: buildTitleDistribution(employees),
    topCompensation: [...employees]
      .sort((a, b) => b.totalIncome - a.totalIncome || Number(a.workerId) - Number(b.workerId))
      .slice(0, 8),
    employees: [...employees].sort(
      (a, b) => b.totalIncome - a.totalIncome || Number(a.workerId) - Number(b.workerId),
    ),
    insights: [
      `Compensation cost is ${compactMoney(totalIncome)}, with salary as the dominant component.`,
      `Bonus is ${percent(totalBonus, totalIncome)}% of total income, so incentives are a small part of overall compensation.`,
      `${employeesWithBonus} of ${totalEmployees} employees receive bonus coverage (${percent(
        employeesWithBonus,
        totalEmployees,
      )}%).`,
    ],
  };
}

function buildDepartmentContribution(
  employees: EmployeeRecord[],
  totalEmployees: number,
  totalIncome: number,
) {
  return [...groupByDepartment(employees)]
    .map(([department, members]) => {
      const totalSalary = sum(members.map((employee) => employee.salary));
      const totalBonus = sum(members.map((employee) => employee.totalBonus));
      const departmentIncome = totalSalary + totalBonus;
      return {
        department,
        employees: members.length,
        headcountShare: percent(members.length, totalEmployees),
        totalSalary,
        totalBonus,
        totalIncome: departmentIncome,
        incomeShare: percent(departmentIncome, totalIncome),
        averageSalary: Math.round(totalSalary / members.length),
        costPerHead: Math.round(departmentIncome / members.length),
      };
    })
    .sort((a, b) => b.totalIncome - a.totalIncome);
}

function buildBonusDistribution(employees: EmployeeRecord[], totalBonus: number) {
  return [...groupByDepartment(employees)]
    .map(([department, members]) => {
      const departmentBonus = sum(members.map((employee) => employee.totalBonus));
      const employeesWithBonus = members.filter((employee) => employee.hasBonus).length;
      return {
        department,
        totalBonus: departmentBonus,
        employees: members.length,
        employeesWithBonus,
        bonusCoverage: percent(employeesWithBonus, members.length),
        bonusShare: percent(departmentBonus, totalBonus),
      };
    })
    .sort((a, b) => b.totalBonus - a.totalBonus);
}

function buildTitleDistribution(employees: EmployeeRecord[]) {
  const counts = new Map<string, number>();
  for (const employee of employees) {
    counts.set(employee.title, (counts.get(employee.title) ?? 0) + 1);
  }
  return [...counts]
    .map(([title, employees]) => ({ title, employees }))
    .sort((a, b) => b.employees - a.employees || a.title.localeCompare(b.title));
}

function groupByDepartment(employees: EmployeeRecord[]) {
  const groups = new Map<string, EmployeeRecord[]>();
  for (const employee of employees) {
    const members = groups.get(employee.department) ?? [];
    members.push(employee);
    groups.set(employee.department, members);
  }
  return groups;
}

function getSalaryBand(salary: number) {
  if (salary < 100000) return "Below 100K";
  if (salary < 200000) return "100K-199K";
  if (salary < 400000) return "200K-399K";
  return "400K+";
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function toNumber(value: string | number) {
  if (typeof value === "number") return value;
  return Number(value.replace(/,/g, "")) || 0;
}

function compactMoney(value: number) {
  if (value >= 1000000) return `${Math.round((value / 1000000) * 10) / 10}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

const fallbackData: { workers: WorkerRow[]; titles: TitleRow[]; bonuses: BonusRow[] } = {
  workers: [
    { WORKER_ID: "1", FIRST_NAME: "Monika", LAST_NAME: "Arora", SALARY: "100000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
    { WORKER_ID: "2", FIRST_NAME: "Niharika", LAST_NAME: "Verma", SALARY: "80000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "3", FIRST_NAME: "Vishal", LAST_NAME: "Singhal", SALARY: "300000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
    { WORKER_ID: "4", FIRST_NAME: "Amitabh", LAST_NAME: "Singh", SALARY: "500000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "5", FIRST_NAME: "Vivek", LAST_NAME: "Bhati", SALARY: "500000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "6", FIRST_NAME: "Vipul", LAST_NAME: "Diwan", SALARY: "200000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Account" },
    { WORKER_ID: "7", FIRST_NAME: "Satish", LAST_NAME: "Kumar", SALARY: "75000", JOINING_DATE: "2014-01-20 09:00:00", DEPARTMENT: "Account" },
    { WORKER_ID: "8", FIRST_NAME: "Geetika", LAST_NAME: "Chauhan", SALARY: "90000", JOINING_DATE: "2014-04-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "9", FIRST_NAME: "Mo", LAST_NAME: "Ar", SALARY: "90000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Account" },
    { WORKER_ID: "10", FIRST_NAME: "Ni", LAST_NAME: "Ver", SALARY: "80000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "11", FIRST_NAME: "Vi", LAST_NAME: "Sing", SALARY: "300000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "HR" },
    { WORKER_ID: "12", FIRST_NAME: "Ami", LAST_NAME: "Singh", SALARY: "500000", JOINING_DATE: "2014-02-20 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "13", FIRST_NAME: "Viv", LAST_NAME: "Bha", SALARY: "500000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "14", FIRST_NAME: "Vipul", LAST_NAME: "Diwan", SALARY: "200000", JOINING_DATE: "2014-06-11 09:00:00", DEPARTMENT: "Admin" },
    { WORKER_ID: "15", FIRST_NAME: "Satish", LAST_NAME: "Kumar", SALARY: "75000", JOINING_DATE: "2014-01-20 09:00:00", DEPARTMENT: "Account" },
    { WORKER_ID: "16", FIRST_NAME: "Gee", LAST_NAME: "Cha", SALARY: "85000", JOINING_DATE: "2014-04-11 09:00:00", DEPARTMENT: "Account" },
  ],
  titles: [
    { WORKER_REF_ID: "1", WORKER_TITLE: "Manager", AFFECTED_FROM: "2016-02-20 00:00:00" },
    { WORKER_REF_ID: "2", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "8", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "5", WORKER_TITLE: "Manager", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "4", WORKER_TITLE: "Asst. Manager", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "7", WORKER_TITLE: "Executive", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "6", WORKER_TITLE: "Lead", AFFECTED_FROM: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "3", WORKER_TITLE: "Lead", AFFECTED_FROM: "2016-06-11 00:00:00" },
  ],
  bonuses: [
    { WORKER_REF_ID: "1", BONUS_AMOUNT: "5000", BONUS_DATE: "2016-02-20 00:00:00" },
    { WORKER_REF_ID: "2", BONUS_AMOUNT: "3000", BONUS_DATE: "2016-06-11 00:00:00" },
    { WORKER_REF_ID: "3", BONUS_AMOUNT: "4000", BONUS_DATE: "2016-02-20 00:00:00" },
    { WORKER_REF_ID: "1", BONUS_AMOUNT: "4500", BONUS_DATE: "2016-02-20 00:00:00" },
    { WORKER_REF_ID: "2", BONUS_AMOUNT: "3500", BONUS_DATE: "2016-06-11 00:00:00" },
  ],
};
