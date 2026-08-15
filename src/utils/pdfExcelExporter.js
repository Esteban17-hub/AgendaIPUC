
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

export function exportToExcel(reportTitle, columns, data, totals) {
  let csvContent = "";
  
  // Headers
  const headers = columns.map(c => `"${c.header}"`).join(",");
  csvContent += headers + "\n";

  // Rows
  const rows = data.map((item) => {
    return columns.map((col) => {
      let val = item[col.key];
      if (col.isCurrency) {
        val = formatCurrency(val);
      }
      return `"${(val ?? '').toString().replace(/"/g, '""')}"`;
    }).join(",");
  });

  csvContent += rows.join("\n") + "\n";

  // Totals
  if (totals) {
    const totalsRow = columns.map((col, index) => {
      if (index === 0) return '"TOTAL GENERAL"';
      if (col.isCurrency && totals[col.key] !== undefined) {
        return `"${formatCurrency(totals[col.key])}"`;
      }
      return '"-"';
    }).join(",");
    csvContent += totalsRow + "\n";
  }

  // Trigger download (BOM for UTF-8 Excel compatibility)
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(reportTitle, congregationName, columns, data, totals) {
  const doc = new jsPDF('portrait', 'pt', 'a4');

  // Encabezado Formal de Congregación
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(congregationName || 'Deborita Gestión Local', 40, 40);

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Informe Financiero: ${reportTitle}`, 40, 58);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')}`, 40, 72);

  doc.setLineWidth(1);
  doc.setDrawColor(226, 232, 240);
  doc.line(40, 82, 555, 82);

  // Mapear headers y datos para autoTable
  const headers = columns.map(c => c.header);
  const tableRows = data.map((item) => {
    return columns.map((col) => {
      const val = item[col.key];
      return col.isCurrency ? formatCurrency(val) : (val ?? '-');
    });
  });

  // Fila de Sumatoria Total Obligatoria
  if (totals) {
    const totalRow = columns.map((col, index) => {
      if (index === 0) return 'TOTAL GENERAL';
      if (col.isCurrency && totals[col.key] !== undefined) {
        return formatCurrency(totals[col.key]);
      }
      return '-';
    });
    tableRows.push(totalRow);
  }

  autoTable(doc, {
    startY: 95,
    head: [headers],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Vibrant Blue
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (dataCell) => {
      // Resaltar la fila final de Totales
      if (totals && dataCell.section === 'body' && dataCell.rowIndex === tableRows.length - 1) {
        dataCell.cell.styles.fontStyle = 'bold';
        dataCell.cell.styles.fillColor = [224, 231, 255]; // Soft Indigo highlight
        dataCell.cell.styles.textColor = [30, 27, 75];
      }
    }
  });

  const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
