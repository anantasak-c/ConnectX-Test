import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { google } from "googleapis";
import { buildDashboardData, type BonusRow, type TitleRow, type WorkerRow } from "./src/lib/analytics";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT ?? 4173);

const fallbackDir = "C:\\Users\\anant\\OneDrive\\เดสก์ท็อป\\Test";
const envFileNames = [".env.local", ".env.local.txt", ".env.lopcal.txt"];

app.get("/api/dashboard-data", async (_req, res) => {
  try {
    const sheetsData = await readGoogleSheetsData();
    res.json(buildDashboardData({ ...sheetsData, source: "google-sheets" }));
  } catch (googleError) {
    try {
      const csvData = await readCsvFallback();
      res.json({
        ...buildDashboardData({ ...csvData, source: "csv-fallback" }),
        warning: getErrorMessage(googleError),
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: "Unable to load dashboard data from Google Sheets or CSV fallback.",
        googleError: getErrorMessage(googleError),
        fallbackError: getErrorMessage(fallbackError),
      });
    }
  }
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Executive HR dashboard running at http://localhost:${port}`);
});

async function readGoogleSheetsData() {
  const env = await readEnvFile(envFileNames);
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing Google service account email, private key, or sheet ID.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const workerSheet = env.GOOGLE_WORKER_SHEET_NAME ?? env.GOOGLE_SHEET_NAME ?? "worker";
  const titleSheet = env.GOOGLE_TITLE_SHEET_NAME ?? "title";
  const bonusSheet = env.GOOGLE_BONUS_SHEET_NAME ?? "bonus";

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
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A:Z`,
  });

  const values = response.data.values;
  if (!values || values.length < 2) {
    throw new Error(`Google Sheet tab "${sheetName}" has no data rows.`);
  }

  const [headers, ...rows] = values;
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [String(header), row[index] ?? ""])),
  ) as T[];
}

async function readCsvFallback() {
  const [workers, titles, bonuses] = await Promise.all([
    readCsv<WorkerRow>(path.join(fallbackDir, "worker.csv")),
    readCsv<TitleRow>(path.join(fallbackDir, "title.csv")),
    readCsv<BonusRow>(path.join(fallbackDir, "bonus.csv")),
  ]);
  return { workers, titles, bonuses };
}

async function readCsv<T>(filePath: string) {
  const csv = await fs.readFile(filePath, "utf8");
  return parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

async function readEnvFile(fileNames: string[]) {
  const envText = await readFirstExistingFile(fileNames.map((fileName) => path.join(__dirname, fileName)));
  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

async function readFirstExistingFile(filePaths: string[]) {
  const errors: string[] = [];
  for (const filePath of filePaths) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      errors.push(`${filePath}: ${getErrorMessage(error)}`);
    }
  }
  throw new Error(`No local env file found. Tried: ${errors.join("; ")}`);
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
