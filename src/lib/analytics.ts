export type WorkerRow = {
  WORKER_ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  SALARY: string | number;
  JOINING_DATE: string;
  DEPARTMENT: string;
};

export type TitleRow = {
  WORKER_REF_ID: string;
  WORKER_TITLE: string;
  AFFECTED_FROM: string;
};

export type BonusRow = {
  WORKER_REF_ID: string;
  BONUS_AMOUNT: string | number;
  BONUS_DATE: string;
};

export type EmployeeRecord = {
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

export type DashboardData = {
  source: string;
  generatedAt: string;
  kpis: {
    totalEmployees: number;
    totalSalary: number;
    averageSalary: number;
    medianSalary: number;
    minSalary: number;
    maxSalary: number;
    totalBonus: number;
    totalIncome: number;
    employeesWithBonus: number;
    bonusCoverage: number;
  };
  departmentContribution: Array<{
    department: string;
    employees: number;
    headcountShare: number;
    totalSalary: number;
    totalBonus: number;
    totalIncome: number;
    incomeShare: number;
    averageSalary: number;
    costPerHead: number;
  }>;
  bonusDistribution: Array<{
    department: string;
    totalBonus: number;
    employees: number;
    employeesWithBonus: number;
    bonusCoverage: number;
    bonusShare: number;
  }>;
  salaryBands: Array<{ band: string; employees: number }>;
  titleDistribution: Array<{ title: string; employees: number }>;
  topCompensation: EmployeeRecord[];
  employees: EmployeeRecord[];
  insights: string[];
};

type BuildInput = {
  workers: WorkerRow[];
  titles: TitleRow[];
  bonuses: BonusRow[];
  source: string;
};

const salaryBandOrder = ["Below 100K", "100K-199K", "200K-399K", "400K+"];

export function buildDashboardData(input: BuildInput): DashboardData {
  const bonusesByWorker = sumBonusesByWorker(input.bonuses);
  const titlesByWorker = latestTitlesByWorker(input.titles);

  const employees = input.workers.map((worker) => {
    const salary = toNumber(worker.SALARY);
    const totalBonus = bonusesByWorker.get(worker.WORKER_ID) ?? 0;
    const fullName = `${worker.FIRST_NAME} ${worker.LAST_NAME}`.trim();

    return {
      workerId: worker.WORKER_ID,
      firstName: worker.FIRST_NAME,
      lastName: worker.LAST_NAME,
      fullName,
      department: worker.DEPARTMENT || "Unassigned",
      title: titlesByWorker.get(worker.WORKER_ID) ?? "Unassigned",
      salary,
      totalBonus,
      totalIncome: salary + totalBonus,
      joiningDate: worker.JOINING_DATE,
      salaryBand: getSalaryBand(salary),
      hasBonus: totalBonus > 0,
    };
  });

  const salaries = employees.map((employee) => employee.salary);
  const totalEmployees = employees.length;
  const totalSalary = sum(employees.map((employee) => employee.salary));
  const totalBonus = sum(employees.map((employee) => employee.totalBonus));
  const totalIncome = totalSalary + totalBonus;
  const employeesWithBonus = employees.filter((employee) => employee.hasBonus).length;

  return {
    source: input.source,
    generatedAt: new Date().toISOString(),
    kpis: {
      totalEmployees,
      totalSalary,
      averageSalary: roundWhole(totalSalary / totalEmployees),
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
    salaryBands: buildSalaryBands(employees),
    titleDistribution: buildTitleDistribution(employees),
    topCompensation: [...employees]
      .sort((a, b) => b.totalIncome - a.totalIncome || Number(a.workerId) - Number(b.workerId))
      .slice(0, 8),
    employees: [...employees].sort(
      (a, b) => b.totalIncome - a.totalIncome || Number(a.workerId) - Number(b.workerId),
    ),
    insights: buildInsights(totalIncome, totalBonus, employeesWithBonus, totalEmployees),
  };
}

function sumBonusesByWorker(bonuses: BonusRow[]) {
  const result = new Map<string, number>();
  for (const bonus of bonuses) {
    result.set(
      bonus.WORKER_REF_ID,
      (result.get(bonus.WORKER_REF_ID) ?? 0) + toNumber(bonus.BONUS_AMOUNT),
    );
  }
  return result;
}

function latestTitlesByWorker(titles: TitleRow[]) {
  const result = new Map<string, TitleRow>();
  for (const title of titles) {
    const current = result.get(title.WORKER_REF_ID);
    if (!current || title.AFFECTED_FROM > current.AFFECTED_FROM) {
      result.set(title.WORKER_REF_ID, title);
    }
  }
  return new Map([...result].map(([workerId, title]) => [workerId, title.WORKER_TITLE]));
}

function buildDepartmentContribution(
  employees: EmployeeRecord[],
  totalEmployees: number,
  totalIncome: number,
) {
  const groups = groupByDepartment(employees);
  return [...groups]
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
        averageSalary: roundWhole(totalSalary / members.length),
        costPerHead: roundWhole(departmentIncome / members.length),
      };
    })
    .sort((a, b) => b.totalIncome - a.totalIncome);
}

function buildBonusDistribution(employees: EmployeeRecord[], totalBonus: number) {
  const groups = groupByDepartment(employees);
  return [...groups]
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

function buildSalaryBands(employees: EmployeeRecord[]) {
  return salaryBandOrder.map((band) => ({
    band,
    employees: employees.filter((employee) => employee.salaryBand === band).length,
  }));
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

function buildInsights(
  totalIncome: number,
  totalBonus: number,
  employeesWithBonus: number,
  totalEmployees: number,
) {
  return [
    `Compensation cost is ${compactMoney(totalIncome)}, with salary as the dominant component.`,
    `Bonus is ${percent(totalBonus, totalIncome)}% of total income, so incentives are a small part of overall compensation.`,
    `${employeesWithBonus} of ${totalEmployees} employees receive bonus coverage (${percent(
      employeesWithBonus,
      totalEmployees,
    )}%).`,
  ];
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
  return roundWhole((sorted[middle - 1] + sorted[middle]) / 2);
}

function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function roundWhole(value: number) {
  return Math.round(value);
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
