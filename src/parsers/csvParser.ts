/**
 * Checks that every row of the CSV text has the same number of fields.
 * @param text The decoded CSV text to check.
 * @returns True if all rows have matching field counts and quotes are balanced.
 */
function checkCsvIntegrity(text: string): boolean {
  const fieldCounts: number[] = [];
  let fields = 1;
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char == '"') {
      // Handles escaped quotes, checks if next character is also a quote
      if (inQuotes && text[i + 1] == '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char == ',') {
      fields++;
    } else if (!inQuotes && (char == '\n' || char == '\r')) {
      if (char == '\r' && text[i + 1] == '\n') i++;
      fieldCounts.push(fields);
      fields = 1;
    }
  }

  if (inQuotes) return false;

  // Handles case of last line not ending with a newline character
  if (!/[\r\n]$/.test(text)) fieldCounts.push(fields);

  return fieldCounts.every((count) => count == fieldCounts[0]);
}

/**
 * Parses a CSV file from a Uint8Array.
 * @param bytes The CSV file bytes to parse.
 * @returns The decoded CSV text.
 */
export function parseCsvBytes(bytes: Uint8Array) {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Not a valid CSV file');
  }

  if (!text.trim()) {
    throw new Error('Not a valid CSV file');
  }

  if (!checkCsvIntegrity(text)) {
    throw new Error('CSV file failed integrity check');
  }

  return text;
}

/**
 * Splits CSV text into rows of fields. Quotes around fields are removed.
 * @param text The decoded CSV text.
 * @returns A list of rows, each row being a list of field strings. Blank lines are skipped.
 */
export function csvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char == '"') {
      // Two quotes in a row inside a quoted field means one literal quote
      if (inQuotes && text[i + 1] == '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char == ',') {
      row.push(field);
      field = '';
    } else if (!inQuotes && (char == '\n' || char == '\r')) {
      if (char == '\r' && text[i + 1] == '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Last line might not end with a newline
  if (field != '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop blank lines (a row with one empty field)
  const nonEmptyRows: string[][] = [];
  for (const r of rows) {
    if (r.length == 1 && r[0].trim() == '') {
      continue;
    }
    nonEmptyRows.push(r);
  }
  return nonEmptyRows;
}

/**
 * Converts a CSV file to a Uint8Array for parsing.
 * @param file The CSV file to parse.
 * @returns A promise that resolves to the parsed CSV data.
 */
export async function parseCsvFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return parseCsvBytes(new Uint8Array(arrayBuffer));
}
