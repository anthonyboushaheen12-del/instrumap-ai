import * as XLSX from 'xlsx';
import { getComponentIO, normalizeKey } from './instrumentLibrary';

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
  // Use provided equipment if available
  if (providedEquipment && providedEquipment.trim()) {
    return providedEquipment.trim();
  }

  // Try to match using library
  const normalizedTag = normalizeKey(tag);
  const componentMatch = getComponentIO(normalizedTag);
  
  if (componentMatch) {
    return componentMatch.equipment;
  }

  // Try matching by prefix (for multi-point equipment)
  const tagParts = tag.split('-');
  if (tagParts.length > 1) {
    const prefixMatch = getComponentIO(tagParts[0]);
    if (prefixMatch) {
      return prefixMatch.equipment;
    }
  }

  // Fallback to heuristics for common patterns
  const tagUpper = tag.toUpperCase();

  // Level instruments
  if (tagUpper.match(/^LIT|^LT/)) return 'LEVEL TRANSMITTER';
  if (tagUpper.match(/^LS[HL]{0,2}/)) return 'LEVEL SWITCH';
  if (tagUpper.match(/^LA[HL]{0,2}/)) return 'LEVEL SWITCH';

  // Pumps
  if (tagUpper.includes('SPS') || (tagUpper.includes('PUMP') && tagUpper.includes('SUMP'))) {
    return 'SUMP PIT PUMP';
  }
  if (tagUpper.includes('PUMP')) return 'PUMP';

  // OCU
  if (tagUpper.includes('OCU')) return 'ODOR CONTROL UNIT';

  // Gas monitoring
  if (tagUpper.includes('H2S') || tagUpper.match(/^AIT/)) {
    if (description && description.toUpperCase().includes('H2S')) {
      return 'H2S ANALYZER';
    }
    return 'CONDUCTIVITY ANALYZER';
  }

  // UPS
  if (tagUpper.includes('UPS')) return 'UPS';

  // Pressure
  if (tagUpper.match(/^PIT|^PT/)) return 'PRESSURE TRANSMITTER';
  if (tagUpper.match(/^PS[HL]/)) return 'PRESSURE SWITCH';

  // Flow
  if (tagUpper.match(/^FIT|^FT/)) return 'FLOW TRANSMITTER';
  if (tagUpper.match(/^FS/)) return 'FLOW SWITCH';

  // Temperature
  if (tagUpper.match(/^TIT|^TT/)) return 'TEMPERATURE TRANSMITTER';

  // Valves
  if (tagUpper.match(/^ZS/)) return 'VALVE POSITION SWITCH';
  if (tagUpper.match(/^XV|^SOV/)) return 'SOLENOID VALVE';
  if (tagUpper.match(/^FV|^FCV/)) return 'FLOW CONTROL VALVE';
  if (tagUpper.match(/^MV/)) return 'MOTORIZED VALVE';

  // Motors/Fans
  if (tagUpper.match(/^M-/)) return 'MOTOR';
  if (tagUpper.includes('EF') || tagUpper.includes('EXHAUST')) return 'EXHAUST FAN';
  if (tagUpper.includes('SF') || tagUpper.includes('SUPPLY')) return 'SUPPLY FAN';

  // Status/Alarms
  if (tagUpper.match(/^YI/)) return 'STATUS INDICATOR';
  if (tagUpper.match(/^YA/)) return 'ALARM INDICATOR';

  return 'INSTRUMENT';
}

/**
 * Exports instrument data to Excel file
 * @param {Array} instruments - Array of instrument objects
 * @param {string} filename - Original P&ID filename
 */
export function exportToExcel(instruments, filename) {
  // Prepare data for Excel
  const worksheetData = [
    // Header row
    ['#', 'Tag', 'Signal Type', 'Description'],
    // Data rows
    ...instruments.map((instrument, index) => [
      index + 1,
      instrument.tag,
      instrument.signalType,
      instrument.description,
    ]),
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // # column
    { wch: 15 }, // Tag column
    { wch: 12 }, // Signal Type column
    { wch: 40 }, // Description column
  ];

  // Style the header row (bold)
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: '4F46E5' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  // Apply header styles (A1:D1)
  ['A1', 'B1', 'C1', 'D1'].forEach(cell => {
    if (worksheet[cell]) {
      worksheet[cell].s = headerStyle;
    }
  });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IO List');

  // Generate filename
  const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const exportFilename = `${baseFilename}_IOList.xlsx`;

  // Write and download file using blob method for better browser compatibility
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  return exportFilename;
}

/**
 * Exports instrument data with additional summary sheet
 * Matches official I/O LIST format (e.g., OM23076-0100D-DAR-TD-2-I&C-015)
 * @param {Array} instruments - Array of instrument objects
 * @param {string} filename - Original P&ID filename
 * @param {Object} summary - Summary statistics
 * @param {Object} pidDetails - Optional P&ID details
 */
export function exportToExcelWithSummary(instruments, filename, summary, pidDetails = null) {
  const workbook = XLSX.utils.book_new();

  // Create I/O List worksheet matching OFFICIAL format
  // Headers matching DAR Al-Handasah I/O list standard
  const ioListHeaders = [
    'SN',
    'LOCATION',
    'EQUIPMENT/INSTRUMENT',
    'SIGNAL',
    'IO TYPE',
    'ALARM'
  ];

  const ioListData = [
    ioListHeaders,
    ...instruments.map((instrument, index) => {
      return [
        index + 1,                                                                                    // SN
        extractLocation(instrument.tag, instrument.location, instrument.equipment),                   // LOCATION
        extractEquipment(instrument.tag, instrument.equipment, instrument.description),                // EQUIPMENT/INSTRUMENT
        instrument.description.toUpperCase(),                                                         // SIGNAL
        instrument.signalType,                                                                        // IO TYPE
        instrument.isAlarm ? 'X' : ''                                                                 // ALARM
      ];
    }),
  ];

  const ioListSheet = XLSX.utils.aoa_to_sheet(ioListData);
  ioListSheet['!cols'] = [
    { wch: 5 },   // SN
    { wch: 18 },  // LOCATION
    { wch: 35 },  // EQUIPMENT/INSTRUMENT
    { wch: 45 },  // SIGNAL
    { wch: 10 },  // IO TYPE
    { wch: 8 },   // ALARM
  ];
  XLSX.utils.book_append_sheet(workbook, ioListSheet, 'IO List');

  // Create Summary worksheet
  const summaryData = [
    ['P&ID Analysis Summary'],
    [],
  ];

  // Add P&ID Details if provided
  if (pidDetails) {
    if (pidDetails.projectName) {
      summaryData.push(['Project Name', pidDetails.projectName]);
    }
    if (pidDetails.drawingNumber) {
      summaryData.push(['Drawing Number', pidDetails.drawingNumber]);
    }
    if (pidDetails.revision) {
      summaryData.push(['Revision', pidDetails.revision]);
    }
    if (pidDetails.area) {
      summaryData.push(['Area / Unit', pidDetails.area]);
    }
    summaryData.push([]);
  }

  summaryData.push(['Drawing File', filename]);
  summaryData.push(['Export Date', new Date().toLocaleDateString()]);
  summaryData.push(['Export Time', new Date().toLocaleTimeString()]);
  summaryData.push(['Total Tags', summary.total || instruments.length]);
  summaryData.push([]);
  summaryData.push(['Signal Type Breakdown']);
  summaryData.push(['AI (Analog Input)', summary.AI || 0]);
  summaryData.push(['DI (Digital Input)', summary.DI || 0]);
  summaryData.push(['DO (Digital Output)', summary.DO || 0]);
  summaryData.push(['AO (Analog Output)', summary.AO || 0]);

  // Add Equipment List if provided
  if (pidDetails && pidDetails.equipmentList) {
    summaryData.push([]);
    summaryData.push(['Equipment List']);
    const equipmentLines = pidDetails.equipmentList.split('\n').filter(line => line.trim());
    equipmentLines.forEach(line => {
      summaryData.push([line.trim()]);
    });
  }

  // Add Notes if provided
  if (pidDetails && pidDetails.notes) {
    summaryData.push([]);
    summaryData.push(['Notes']);
    summaryData.push([pidDetails.notes]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 25 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename based on drawing number if available
  // Sanitize to remove invalid filename characters
  let exportFilename;
  if (pidDetails && pidDetails.drawingNumber) {
    const sanitizedDrawingNumber = pidDetails.drawingNumber.replace(/[:\\/?*[\]<>|"]/g, '_');
    exportFilename = `${sanitizedDrawingNumber}_IOList.xlsx`;
  } else {
    const baseFilename = filename.replace(/\.[^/.]+$/, '').replace(/[:\\/?*[\]<>|"]/g, '_');
    exportFilename = `${baseFilename}_IOList.xlsx`;
  }

  // Write and download file using blob method for better browser compatibility
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  return exportFilename;
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
  };

  instruments.forEach(instrument => {
    const type = instrument.signalType;
    if (summary.hasOwnProperty(type)) {
      summary[type]++;
    }
  });

  return summary;
}
