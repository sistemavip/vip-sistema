import * as XLSX from 'xlsx';

export type CSVRow = Record<string, any>;

/**
 * Exports data as a well-formatted .xlsx Excel file.
 * Columns are auto-sized and headers are included.
 */
export function exportToExcel(
  filename: string,
  rows: CSVRow[],
  columns?: { key: string; header: string }[]
) {
  if (!rows || rows.length === 0) return;

  const headers = columns ?? Object.keys(rows[0]).map((k) => ({ key: k, header: k }));

  // Prepare data for XLSX
  // We want to pass objects to json_to_sheet for best type detection
  const exportRows = rows.map(row => {
    const newRow: any = {};
    headers.forEach(h => {
      newRow[h.header] = row[h.key];
    });
    return newRow;
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);

  // Auto-size columns based on content width
  const colWidths = headers.map((h) => {
    let maxLen = h.header.length;
    for (const row of rows) {
      const val = row[h.key];
      const cellLen = val ? String(val).length : 0;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 4, 60) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  const cleanName = filename.replace(/\.csv$/i, '').replace(/\.xlsx$/i, '');
  XLSX.writeFile(wb, `${cleanName}.xlsx`);
}

/**
 * @deprecated Use exportToExcel instead. Kept for backward compat.
 */
export function exportToCSV(
  filename: string,
  rows: CSVRow[],
  columns?: { key: string; header: string }[]
) {
  return exportToExcel(filename, rows, columns);
}