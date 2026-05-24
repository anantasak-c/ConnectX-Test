import { google } from "googleapis";
import { buildDashboardData, type BonusRow, type TitleRow, type WorkerRow } from "../src/lib/analytics";

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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing Google service account email, private key, or sheet ID.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const workerSheet = process.env.GOOGLE_WORKER_SHEET_NAME ?? process.env.GOOGLE_SHEET_NAME ?? "worker";
  const titleSheet = process.env.GOOGLE_TITLE_SHEET_NAME ?? "title";
  const bonusSheet = process.env.GOOGLE_BONUS_SHEET_NAME ?? "bonus";

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
