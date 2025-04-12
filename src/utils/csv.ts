import Papa from "papaparse";

export function parseCSV<O = string>(
  content: string,
): { headers?: string[]; rows: O[] } {
  const parsed = Papa.parse<O>(content, { header: true, skipEmptyLines: true });
  return { headers: parsed.meta.fields, rows: parsed.data };
}
