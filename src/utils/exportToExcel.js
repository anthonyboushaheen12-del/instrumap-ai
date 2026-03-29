import XLSX from 'xlsx-js-style';
import { lookupComponent } from './ioLibrary';

/**
 * Extract location from instrument tag using library when possible
 */
function extractLocation(tag, providedLocation, equipmentType) {
  // Use provided location if available
  if (providedLocation && providedLocation.trim()) {
    return providedLocation.trim();
  }

  // Try to infer from equipment type if available
  if (equipmentType) {
    const equipmentUpper = equipmentType.toUpperCase();
    if (equipmentUpper.includes('SUMP') || equipmentUpper.includes('DRAINAGE')) {
      return 'SUMP PIT';
    }
    if (equipmentUpper.includes('PUMP STATION') || equipmentUpper.includes('OCU') || equipmentUpper.includes('UPS')) {
      return 'PUMP STATION';
    }
  }

  // Fallback to tag-based heuristics
  const tagUpper = tag.toUpperCase();
  if (tagUpper.includes('SPS') || tagUpper.includes('SUMP') || tagUpper.includes('LS') || tagUpper.includes('LIT')) {
    return 'SUMP PIT';
  }
  if (tagUpper.includes('OCU') || tagUpper.includes('UPS') || tagUpper.includes('H2S') || tagUpper.includes('AIT')) {
    return 'PUMP STATION';
  }
  if (tagUpper.includes('WP') || tagUpper.includes('PUMP')) {
    return 'PUMP STATION';
  }
  return 'FIELD';
}

/**
 * Extract equipment type from instrument tag using library
 */
function extractEquipment(tag, providedEquipment, description) {
  // Use provided equipment if available, unless it's a generic label
  if (providedEquipment && providedEquipment.trim()) {
    const upper = providedEquipment.trim().toUpperCase();
    // If the AI returned a generic label, try to resolve to the actual instrument tag
    if (upper !== 'INSTRUMENTATION' && upper !== 'INSTRUMENT' && upper !== 'UNKNOWN') {
      return providedEquipment.trim();
    }
  }

  // Try to match using library
  const componentMatch = lookupComponent(tag);

  if (componentMatch) {
    return componentMatch.componentTag;
  }

  // Try matching by prefix (for multi-point equipment)
  const tagParts = tag.split('-');
  if (tagParts.length > 1) {
    const prefixMatch = lookupComponent(tagParts[0]);
    if (prefixMatch) {
      return prefixMatch.componentTag;
    }
    // For single-loop instruments, use the tag prefix as equipment name
    const prefix = tagParts[0].toUpperCase();
    const singleLoopTags = ['LIT', 'PIT', 'FIT', 'TIT', 'AIT', 'LSL', 'LSLL', 'LSH', 'LSHH', 'PSL', 'PSH', 'FS', 'SOV'];
    if (singleLoopTags.includes(prefix)) {
      return prefix;
    }
  }

  // Fallback to heuristics for common patterns
  const tagUpper = tag.toUpperCase();

  // Level instruments - return component tag prefix
  if (tagUpper.match(/^LIT/)) return 'LIT';
  if (tagUpper.match(/^LT/)) return 'LT';
  if (tagUpper.match(/^LSLL/)) return 'LSLL';
  if (tagUpper.match(/^LSHH/)) return 'LSHH';
  if (tagUpper.match(/^LSL/)) return 'LSL';
  if (tagUpper.match(/^LSH/)) return 'LSH';
  if (tagUpper.match(/^LA/)) return tag.split('-')[0] || 'LA';

  // Pressure instruments
  if (tagUpper.match(/^PIT/)) return 'PIT';
  if (tagUpper.match(/^PT/)) return 'PT';
  if (tagUpper.match(/^PSH/)) return 'PSH';
  if (tagUpper.match(/^PSL/)) return 'PSL';

  // Flow instruments
  if (tagUpper.match(/^FIT/)) return 'FIT';
  if (tagUpper.match(/^FT/)) return 'FT';
  if (tagUpper.match(/^FS/)) return 'FS';

  // Temperature instruments
  if (tagUpper.match(/^TIT/)) return 'TIT';
  if (tagUpper.match(/^TT/)) return 'TT';

  // Analyzers
  if (tagUpper.match(/^AIT/)) return 'AIT';

  // Pumps
  if (tagUpper.includes('SPS') || (tagUpper.includes('PUMP') && tagUpper.includes('SUMP'))) {
    return 'SUMP PIT PUMP';
  }
  if (tagUpper.includes('PUMP')) return 'PUMP';

  // OCU
  if (tagUpper.includes('OCU')) return 'ODOR CONTROL UNIT';

  // UPS
  if (tagUpper.includes('UPS')) return 'UPS';

  // Valves
  if (tagUpper.match(/^ZS/)) return 'VALVE POSITION SWITCH';
  if (tagUpper.match(/^XV|^SOV/)) return 'SOV';
  if (tagUpper.match(/^FV|^FCV/)) return 'FLOW CONTROL VALVE';
  if (tagUpper.match(/^MV/)) return 'MV';

  // Motors/Fans
  if (tagUpper.match(/^M-/)) return 'MOTOR';
  if (tagUpper.includes('EF') || tagUpper.includes('EXHAUST')) return 'EXHAUST FAN';
  if (tagUpper.includes('SF') || tagUpper.includes('SUPPLY')) return 'SUPPLY FAN';

  // Status/Alarms - use the tag itself
  if (tagUpper.match(/^YI/)) return tag.split('-')[0] || 'YI';
  if (tagUpper.match(/^YA/)) return tag.split('-')[0] || 'YA';

  return tag.split('-')[0] || 'INSTRUMENT';
}

// --- Styling constants ---

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '1A1A2E' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};

const ROW_STYLES = {
  AI: { fgColor: { rgb: 'E8F4FD' } },
  DI: { fgColor: { rgb: 'E8F9E8' } },
  DO: { fgColor: { rgb: 'FFF3E0' } },
  AO: { fgColor: { rgb: 'F3E8FF' } },
  COM: { fgColor: { rgb: 'F5F5F5' } },
};

const CELL_BORDER = {
  top: { style: 'thin', color: { rgb: 'CCCCCC' } },
  bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
  left: { style: 'thin', color: { rgb: 'CCCCCC' } },
  right: { style: 'thin', color: { rgb: 'CCCCCC' } },
};

function getRowStyle(signalType) {
  const fill = ROW_STYLES[signalType] || { fgColor: { rgb: 'FFFFFF' } };
  return {
    font: { sz: 10 },
    fill,
    alignment: { vertical: 'center' },
    border: CELL_BORDER,
  };
}

/**
 * Auto-fit column widths based on cell content
 */
function autoFitColumns(sheetData, minWidths = []) {
  const colWidths = [];
  for (const row of sheetData) {
    row.forEach((cell, i) => {
      const len = cell != null ? String(cell).length : 0;
      if (!colWidths[i] || len > colWidths[i]) {
        colWidths[i] = len;
      }
    });
  }
  return colWidths.map((w, i) => ({
    wch: Math.max(w + 2, minWidths[i] || 8),
  }));
}

/**
 * Apply header styles to the first row and freeze it
 */
function styleSheet(ws, headerCount, dataRows, signalTypeColIndex) {
  // Style header cells
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let c = 0; c < headerCount; c++) {
    const ref = `${colLetters[c]}1`;
    if (ws[ref]) {
      ws[ref].s = HEADER_STYLE;
    }
  }

  // Style data rows
  for (let r = 0; r < dataRows.length; r++) {
    const signalType = dataRows[r][signalTypeColIndex];
    const style = getRowStyle(signalType);
    for (let c = 0; c < headerCount; c++) {
      const ref = `${colLetters[c]}${r + 2}`;
      if (ws[ref]) {
        ws[ref].s = style;
      }
    }
  }

  // Freeze top row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
}

/**
 * Exports instrument data to Excel file
 * @param {Array} instruments - Array of instrument objects
 * @param {string} filename - Original P&ID filename
 */
export function exportToExcel(instruments, filename) {
  const headers = ['#', 'TAG', 'SIGNAL TYPE', 'DESCRIPTION'];
  const dataRows = instruments.map((instrument, index) => [
    index + 1,
    instrument.tag,
    instrument.signalType,
    instrument.description,
  ]);

  const worksheetData = [headers, ...dataRows];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = autoFitColumns(worksheetData, [5, 15, 12, 40]);
  styleSheet(worksheet, headers.length, dataRows, 2); // signalType at index 2

  XLSX.utils.book_append_sheet(workbook, worksheet, 'IO List');

  // --- Summary sheet ---
  const summary = calculateSummary(instruments);
  const summarySheetData = buildSummarySheetData(summary);
  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 12 }];
  styleSummarySheet(summarySheet, summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename
  const baseFilename = filename.replace(/\.[^/.]+$/, '');
  const exportFilename = `${baseFilename}_IOList.xlsx`;

  downloadWorkbook(workbook, exportFilename);
  return exportFilename;
}

/**
 * Exports instrument data with additional summary sheet
 * Matches official I/O LIST format
 */
export function exportToExcelWithSummary(instruments, filename, summary, pidDetails = null) {
  const workbook = XLSX.utils.book_new();

  // --- I/O List sheet ---
  const ioListHeaders = [
    'SN',
    'TAG',
    'LOCATION',
    'EQUIPMENT/INSTRUMENT',
    'SIGNAL',
    'IO TYPE',
    'ALARM',
  ];

  const dataRows = instruments.map((instrument, index) => [
    index + 1,
    instrument.tag || '',
    extractLocation(instrument.tag, instrument.location, instrument.equipment),
    extractEquipment(instrument.tag, instrument.equipment, instrument.description),
    instrument.description.toUpperCase(),
    instrument.signalType,
    instrument.isAlarm ? 'X' : '',
  ]);

  const ioListData = [ioListHeaders, ...dataRows];
  const ioListSheet = XLSX.utils.aoa_to_sheet(ioListData);
  ioListSheet['!cols'] = autoFitColumns(ioListData, [5, 20, 18, 35, 45, 10, 8]);
  styleSheet(ioListSheet, ioListHeaders.length, dataRows, 5); // IO TYPE at index 5
  XLSX.utils.book_append_sheet(workbook, ioListSheet, 'IO List');

  // --- Summary sheet ---
  const summaryData = [
    ['P&ID ANALYSIS SUMMARY', ''],
    ['', ''],
  ];

  if (pidDetails) {
    if (pidDetails.projectName) summaryData.push(['PROJECT NAME', pidDetails.projectName]);
    if (pidDetails.drawingNumber) summaryData.push(['DRAWING NUMBER', pidDetails.drawingNumber]);
    if (pidDetails.revision) summaryData.push(['REVISION', pidDetails.revision]);
    if (pidDetails.area) summaryData.push(['AREA / UNIT', pidDetails.area]);
    summaryData.push(['', '']);
  }

  summaryData.push(['DRAWING FILE', filename]);
  summaryData.push(['EXPORT DATE', new Date().toLocaleDateString()]);
  summaryData.push(['EXPORT TIME', new Date().toLocaleTimeString()]);
  summaryData.push(['TOTAL TAGS', summary.total || instruments.length]);
  summaryData.push(['', '']);
  summaryData.push(['SIGNAL TYPE BREAKDOWN', '']);
  summaryData.push(['AI (ANALOG INPUT)', summary.AI || 0]);
  summaryData.push(['DI (DIGITAL INPUT)', summary.DI || 0]);
  summaryData.push(['DO (DIGITAL OUTPUT)', summary.DO || 0]);
  summaryData.push(['AO (ANALOG OUTPUT)', summary.AO || 0]);
  summaryData.push(['COM (COMMUNICATION)', summary.COM || 0]);

  if (pidDetails && pidDetails.equipmentList) {
    summaryData.push(['', '']);
    summaryData.push(['EQUIPMENT LIST', '']);
    const equipmentLines = pidDetails.equipmentList.split('\n').filter(line => line.trim());
    equipmentLines.forEach(line => {
      summaryData.push([line.trim(), '']);
    });
  }

  if (pidDetails && pidDetails.notes) {
    summaryData.push(['', '']);
    summaryData.push(['NOTES', '']);
    summaryData.push([pidDetails.notes, '']);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 40 }];
  styleSummarySheet(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename
  let exportFilename;
  if (pidDetails && pidDetails.drawingNumber) {
    const sanitizedDrawingNumber = pidDetails.drawingNumber.replace(/[:\\/?*[\]<>|"]/g, '_');
    exportFilename = `${sanitizedDrawingNumber}_IOList.xlsx`;
  } else {
    const baseFilename = filename.replace(/\.[^/.]+$/, '').replace(/[:\\/?*[\]<>|"]/g, '_');
    exportFilename = `${baseFilename}_IOList.xlsx`;
  }

  downloadWorkbook(workbook, exportFilename);
  return exportFilename;
}

/**
 * Build summary sheet data array for the standalone summary
 */
function buildSummarySheetData(summary) {
  return [
    ['SIGNAL TYPE', 'COUNT'],
    ['AI (ANALOG INPUT)', summary.AI || 0],
    ['DI (DIGITAL INPUT)', summary.DI || 0],
    ['DO (DIGITAL OUTPUT)', summary.DO || 0],
    ['AO (ANALOG OUTPUT)', summary.AO || 0],
    ['COM (COMMUNICATION)', summary.COM || 0],
    ['', ''],
    ['TOTAL', summary.total || 0],
  ];
}

/**
 * Style the summary sheet with header + type-colored rows
 */
function styleSummarySheet(ws, data) {
  const typeColors = {
    'AI (ANALOG INPUT)': ROW_STYLES.AI,
    'DI (DIGITAL INPUT)': ROW_STYLES.DI,
    'DO (DIGITAL OUTPUT)': ROW_STYLES.DO,
    'AO (ANALOG OUTPUT)': ROW_STYLES.AO,
    'COM (COMMUNICATION)': ROW_STYLES.COM,
  };

  // Style first row as header
  ['A1', 'B1'].forEach(ref => {
    if (ws[ref]) {
      ws[ref].s = HEADER_STYLE;
    }
  });

  // Style signal-type rows with matching colors
  for (let r = 0; r < data.length; r++) {
    const label = String(data[r][0] || '');
    const fill = typeColors[label];
    if (fill) {
      ['A', 'B'].forEach(col => {
        const ref = `${col}${r + 1}`;
        if (ws[ref]) {
          ws[ref].s = {
            font: { sz: 10 },
            fill,
            border: CELL_BORDER,
            alignment: { vertical: 'center' },
          };
        }
      });
    }
    // Bold the TOTAL row
    if (label === 'TOTAL') {
      ['A', 'B'].forEach(col => {
        const ref = `${col}${r + 1}`;
        if (ws[ref]) {
          ws[ref].s = {
            font: { bold: true, sz: 11 },
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } },
            },
            alignment: { vertical: 'center' },
          };
        }
      });
    }
  }

  // Freeze top row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
}

/**
 * Write workbook to blob and trigger browser download
 */
function downloadWorkbook(workbook, exportFilename) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Calculate summary statistics from instruments
 */
export function calculateSummary(instruments) {
  const summary = {
    total: instruments.length,
    AI: 0,
    DI: 0,
    DO: 0,
    AO: 0,
    COM: 0,
  };

  instruments.forEach(instrument => {
    const type = instrument.signalType;
    if (summary.hasOwnProperty(type)) {
      summary[type]++;
    }
  });

  return summary;
}
