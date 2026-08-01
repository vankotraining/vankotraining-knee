export type TindeqErrorCode =
  | "NO_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_ZIP"
  | "MISSING_INFO_CSV"
  | "MISSING_DATA_CSV"
  | "INVALID_CSV"
  | "UNAUTHORIZED"
  | "IMPORT_FAILED";

const USER_MESSAGES: Record<TindeqErrorCode, string> = {
  NO_FILE: "Vyber Tindeq ZIP soubor.",
  FILE_TOO_LARGE: "Soubor je příliš velký.",
  INVALID_ZIP: "Soubor není platný ZIP export z Tindeq.",
  MISSING_INFO_CSV: "Soubor neobsahuje info.csv.",
  MISSING_DATA_CSV: "Soubor neobsahuje data_set_1.csv.",
  INVALID_CSV: "CSV data v exportu nelze přečíst.",
  UNAUTHORIZED: "Pro import se nejprve přihlas.",
  IMPORT_FAILED: "Import se nepodařilo dokončit.",
};

export class TindeqImportError extends Error {
  constructor(
    public readonly code: TindeqErrorCode,
    message = USER_MESSAGES[code],
    public readonly status = 400,
  ) {
    super(message);
    this.name = "TindeqImportError";
  }
}
