/**
 * Parses a CSV file from a Uint8Array.
 * @param bytes The CSV file bytes to parse.
 * @returns The decoded CSV text.
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
 * Converts a CSV file to a Uint8Array for parsing.
 * @param file The CSV file to parse.
 * @returns A promise that resolves to the parsed CSV data.
 */
export async function parseCsvFile(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return parseCsvBytes(new Uint8Array(arrayBuffer));
}
