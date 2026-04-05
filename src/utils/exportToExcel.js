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

// Maps tag prefixes to human-readable equipment/instrument names
const EQUIPMENT_NAME_MAP = {
  // Level
  LIT:   'Level Transmitter',
  LT:    'Level Transmitter',
  LSH:   'Level Switch High',
  LAH:   'Level Switch High',
  LSHH:  'Level Switch High High',
  LAHH:  'Level Switch High High',
  LSL:   'Level Switch Low',
  LAL:   'Level Switch Low',
  LSLL:  'Level Switch Low Low',
  LALL:  'Level Switch Low Low',
  LI:    'Level Indicator',
  // Pressure
  PIT:   'Pressure Transmitter',
  PT:    'Pressure Transmitter',
  PSH:   'Pressure Switch High',
  PAH:   'Pressure Switch High',
  PAHH:  'Pressure Switch High High',
  PSL:   'Pressure Switch Low',
  PAL:   'Pressure Switch Low',
  PI:    'Pressure Indicator',
  DPAH:  'Differential Pressure Switch',
  // Flow
  FIT:   'Flow Transmitter',
  FT:    'Flow Transmitter',
  FS:    'Flow Switch',
  FAH:   'Flow Switch High',
  FAL:   'Flow Switch Low',
  FI:    'Flow Indicator',
  // Temperature
  TIT:   'Temperature Transmitter',
  TT:    'Temperature Transmitter',
  TI:    'Temperature Indicator',
  TAH:   'Temperature Switch High',
  TAL:   'Temperature Switch Low',
  TAHH:  'Temperature Switch High High',
  // Analyzers
  AIT:   'Analyzer Transmitter',
  AI:    'Analyzer Indicator',
  // Valves
  MV:    'Motorized Valve',
  SOV:   'Solenoid Valve',
  XV:    'Solenoid Valve',
  FCV:   'Flow Control Valve',
  FV:    'Flow Control Valve',
  ZS:    'Limit Switch',
  ZI:    'Position Indicator',
  ZIO:   'Position Indicator (Open)',
  ZIC:   'Position Indicator (Closed)',
  ZC:    'Position Controller',
  // Hand switches / controls
  HS:    'Hand Switch',
  HSO:   'Hand Switch (Open)',
  HSC:   'Hand Switch (Close)',
  HSR:   'Hand Switch (Start)',
  HSS:   'Hand Switch (Stop)',
  HI:    'Selector Switch',
  HA:    'Hand Switch',
  // Status / alarms
  YI:    'Status Indicator',
  YA:    'Alarm Annunciator',
  // Speed / current
  SI:    'Speed Indicator',
  SC:    'Speed Controller',
  II:    'Current Indicator',
  NI:    'Torque Indicator',
  VI:    'Vibration Indicator',
  // Other
  OCU:   'Odor Control Unit',
  UPS:   'UPS',
  MCC:   'Motor Control Center',
  ATS:   'Automatic Transfer Switch',
  FACP:  'Fire Alarm Control Panel',
  EF:    'Exhaust Fan',
  SF:    'Supply Fan',
};

/**
 * Determine the signal category (Alarm / Indication / Command) for a tag.
 */
function extractSignalCategory(tag, description, signalType) {
  // DO and AO are always commands
  if (signalType === 'DO' || signalType === 'AO') return 'Command';

  const prefix = tag.toUpperCase().split('-')[0];

  const ALARM_PREFIXES = new Set([
    'YA',
    'LAH', 'LAHH', 'LAL', 'LALL',
    'PAH', 'PAHH', 'PAL', 'PALL',
    'TAH', 'TAHH', 'TAL', 'TALL',
    'FAH', 'FAL',
    'DPAH', 'DPAHH',
    'XI',
  ]);
  const SWITCH_PREFIXES = new Set([
    'LSH', 'LSHH', 'LSL', 'LSLL',
    'PSH', 'PSL',
    'FS', 'ZS',
  ]);

  if (ALARM_PREFIXES.has(prefix)) return 'Alarm';
  if (SWITCH_PREFIXES.has(prefix)) return 'Alarm';

  // Fall back to description keywords
  const descUpper = (description || '').toUpperCase();
  if (descUpper.includes('ALARM') || descUpper.includes('FAULT') ||
      descUpper.includes('FAIL') || descUpper.includes('TRIP')) {
    return 'Alarm';
  }

  return 'Indication';
}

/**
 * Extract equipment type from instrument tag using library
 */
function extractEquipment(tag, providedEquipment) {
  const prefix = tag.toUpperCase().split('-')[0];

  // Resolve from the human-readable map first
  if (EQUIPMENT_NAME_MAP[prefix]) {
    return EQUIPMENT_NAME_MAP[prefix];
  }

  // Use provided equipment if it's a meaningful value (not generic)
  if (providedEquipment && providedEquipment.trim()) {
    const upper = providedEquipment.trim().toUpperCase();
    if (upper !== 'INSTRUMENTATION' && upper !== 'INSTRUMENT' && upper !== 'UNKNOWN') {
      // Check if the provided value is itself an abbreviation we can expand
      if (EQUIPMENT_NAME_MAP[upper]) return EQUIPMENT_NAME_MAP[upper];
      return providedEquipment.trim();
    }
  }

  // Fallback: try the library
  const componentMatch = lookupComponent(tag);
  if (componentMatch) {
    const libPrefix = componentMatch.componentTag.toUpperCase().split(/[\s\n(]/)[0];
    if (EQUIPMENT_NAME_MAP[libPrefix]) return EQUIPMENT_NAME_MAP[libPrefix];
    return componentMatch.componentTag;
  }

  // Final heuristics
  const tagUpper = tag.toUpperCase();
  if (tagUpper.includes('PUMP')) return 'Pump';
  if (tagUpper.includes('OCU')) return 'Odor Control Unit';
  if (tagUpper.includes('UPS')) return 'UPS';
  if (tagUpper.includes('EF') || tagUpper.includes('EXHAUST')) return 'Exhaust Fan';
  if (tagUpper.includes('SF') || tagUpper.includes('SUPPLY FAN')) return 'Supply Fan';

  return prefix || 'Instrument';
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
    extractEquipment(instrument.tag, instrument.equipment),
    extractSignalCategory(instrument.tag, instrument.description, instrument.signalType),
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
