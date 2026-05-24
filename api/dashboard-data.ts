import { google } from "googleapis";
import { buildDashboardData, type BonusRow, type TitleRow, type WorkerRow } from "../src/lib/analytics";
import { fallbackData } from "../src/lib/fallbackData";

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
