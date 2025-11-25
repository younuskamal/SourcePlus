import * as XLSX from 'xlsx';

interface ExcelCell {
  value: any;
  style?: any;
}

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  fileName: string,
  sheetName: string = 'Sheet1'
) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const processedData = data.map(row => {
    const processed: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        processed[key] = value.toISOString().split('T')[0];
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        processed[key] = new Date(value).toISOString().split('T')[0];
      } else if (typeof value === 'object' && value !== null) {
        processed[key] = JSON.stringify(value);
      } else {
        processed[key] = value ?? '';
      }
    }
    return processed;
  });

  const worksheet = XLSX.utils.json_to_sheet(processedData);

  const columnWidths: XLSX.ColInfo[] = [];
  const headers = Object.keys(data[0] || {});
  
  headers.forEach((header, idx) => {
    let maxLen = header.length;
    for (const row of processedData) {
      const cellValue = String(row[header] || '');
      if (cellValue.length > maxLen) {
        maxLen = cellValue.length;
      }
    }
    columnWidths[idx] = { wch: Math.min(maxLen + 2, 50) };
  });

  worksheet['!cols'] = columnWidths;

  const headerStyle = {
    fill: { fgColor: { rgb: 'FF4472C4' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = headerStyle;
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
};
