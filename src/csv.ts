export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) throw new Error("The CSV is empty.");
  return rows;
}
export function validImportRow(r: {
  campaign: string;
  spend: string;
  date: string;
}) {
  return (
    !!r.campaign.trim() &&
    Number.isFinite(Number(r.spend)) &&
    Number(r.spend) > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    !Number.isNaN(Date.parse(r.date)) &&
    new Date(r.date).toISOString().slice(0, 10) === r.date
  );
}
