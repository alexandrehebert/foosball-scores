export function parseCSV<T = string[]>(
  content: string,
  rowProcessor?: (row: string[]) => T
) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(";");
  const rows = lines.slice(1).map((line) => {
    const row = line.split(";");
    return rowProcessor ? rowProcessor(row) : row;
  });
  return { headers, rows };
}
