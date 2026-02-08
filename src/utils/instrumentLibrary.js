// CSV library data embedded directly in code (not imported at runtime)
// This is the reference library that defines equipment types and their I/O points
const libraryCsv = `"COMPONENT 
TAG NUMBER",I/O TAG NUMBER,INSTRUMENT/EQUIPMENT TYPE,IO TYPE,
,,,,
LSL,LAL,LEVEL SWITCH LOW,DI,
LSLL,LALL,LEVEL SWITCH LOW LOW,DI,
LSH,LAH,LEVEL SWITCH HIGH ,DI,
LSHH,LAHH,LEVEL SWITCH HIGH HIGH,DI,
MV,HSC,CLOSE-MAIN INLET ,DO,
,HSO,OPEN- MAIN INLET ,DO,
,ZIC,CLOSED- MAIN INLET ,DI,
,ZIO,OPENED- MAIN INLET ,DI,
,HI,LOCAL/OFF/REMOTE INDICATION-,DI,
,YA,GENERAL ALARM,DI,
LIT,LI,WATER LEVEL,AI,
PIT,PI,PRESSURE,AI,
PSL,PAL,LOW PRESSURE SWITCH,DI,
PSH,PAH,HIGH PRESSURE SWITCH,DI,
HS-DETAIL P1(VFD PUMP),HSO,OPEN MOTOR STARTER,COMMUNICATION INTERFACE,
,HSC,CLOSE MOTOR STARTER ,,
,XI,OVERLOAD OF MOTOR STARTEROVERLOAD OF MOTOR STARTER ,,
,EI,UNDERVOLTAGE OF MOTOR STARTER ,,
,HI,SELECTOR SWITCH AUTO POSITION,,
,HI,SELECTOR SWITCH MANUAL POSITION,,
,YI,ON STATUS OF MOTOR STARTER,,
,YI,OFF STATUS OF MOTOR STARTER,,
,YA,GENERAL ALARM ,,
,YA,POWER FAILURE,,
,SI,FREQUENCY OF MOTOR STARTER,,
,HSR,START ,DO,
,HSS,STOP,DO,
,HS,DRIVE ON/OFF ,DO,
,SC,SPEED CONTROL,AO,
,TAHH,HIGH HGH TEMPRATURE INDICATION ,COMMUNICATION INTERFACE,
,VAHH,HIGH HGH VIBRATION NDICATION ,,
,TI,TEMPERATURE SENSOR READING,AI,
,VI,VIBRATION SENSOR READING,AI,
"HS-DETAIL SP
(SUMP PIT PUMP)",HI,AUTO/MANUAL INDICATION ,DI,
,LAHH,HIGH HIGH LEVEL ALARM ,DI,
,LALL,LOW LOW  LEVEL ALARM ,DI,
,YA,POWER FAILURE ,DI,
,YI,PUMP 1 RUNNING STATUS,DI,
,YA,PUMP 1 FAULT ,DI,
,YI,PUMP 2 RUNNING STATUS ,DI,
,YA,PUMP 2 FAULT ,DI,
,II,PUMP 1 CURRENT INDICATION ,AI,
,II,PUMP 2 CURRENT INDICATION ,AI,
"HS-DETAIL EF
(EXHAUST FAN)",HI,LOR SELECTOR SWITCH OFF INDICATION 1,DI,
,HI,LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION 1,DI,
,HSS,STOP,DO,
,HSR,START ,DO,
,YA,FAULT ,DI,
,YI,STATUS ,DI,
ROOF TOP UNIT ,HA,MANUAL MODE-ROOF TOP UNIT ,MODBUS RTU,
,HA,OFF MODE-ROOF TOP UNIT,,
,TC,RETURN AIR TEMPERATURE SETPOINT-ROOF TOP UNIT ,,
,TI,RETURN AIR TEMPERATURE-ROOF TOP UNIT ,,
,YA,CONDENSER FAN FAULT-ROOF TOP UNIT ,,
,YI,CONDENSER FAN STATUS-ROOF TOP UNIT ,,
,YA,COMPRESSOR FAULT-ROOF TOP UNIT,,
,YI,COMPRESSOR STATUS-ROOF TOP UNIT ,,
,YA,SUPPLY FAN FAULT-ROOF TOP UNIT ,,
,YI,SUPPLY FAN STATUS-ROOF TOP UNIT ,,
,YA,ALARM-ROOF TOP UNIT ,,
,YI,FILTER STATUS-ROOF TOP UNIT,,
,HS,ENABLE-ROOF TOP UNIT ,,
,HS,DISABLE-ROOF TOP UNIT,,
,ZI,MOTORIZED DAMPER STATUS-ROOF TOP UNIT ,,
TIT,TI,ROOM TEMPERATURE,AI,
"DUTY STANDBY SPLIT UNIT CONTROL PANEL
SRAC/SRCU",YA,SPLIT UNIT'S TRIP,DI,
,YI,SPLIT AC UNIT  RUNNING STATUS ,DI,
,HS,SPLIT AC UNIT ENABLE / DISABLE,DO,
FIT,FI,FLOW,AI,
ODOR CONTROL UNIT LCP,HS,ENABLE/DISABLE,DO,
,YA,FAULT ,DI,
,YI,STATUS ,DI,
"HS-DETAIL CP
(Constant Speed Pump)",HI,LOR SELECTOR SWITCH OFF INDICATION ,DI,
,HI,LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION,DI,
,HS,REMOTE AUTO / REMOTE MANUAL,DI,
,HSS,STOP,DO,
,HSR,START ,DO,
,YA,FAULT ,DI,
,YI,STATUS ,DI,
SOV,HS,OVERFLOW & DRAIN OF SUB BASE TANKS TO BULK TANK 01,DO,
FS,FI,FLOW SWITCH ,DI,
DUPLEX FUEL OIL PUMPS,YA,PUMP 1 FAULT,DI,
,YI,PUMP 1 STATUS,DI,
,DPAH,DIFFERENTIAL PRESSEURE SWITCH HIGH-PUMP 1 INLET SUCTION STRAINER,DI,
,PAH,PRESSURE SWITCH HIGH-PUMP 1 OULET,DI,
,YA,PUMP 2 FAULT,DI,
,YI,PUMP 2 STATUS,DI,
,DPAH,DIFFERENTIAL PRESSEURE SWITCH HIGH-PUMP 2 INLET SUCTION STRAINER,DI,
,PAH,PRESSURE SWITCH HIGH-PUMP 2 OULET,DI,
,LAHH,SUB BASE TANK HIGH HIGH LEVEL ALARM,DI,
,LIL,SUB BASE TANK LOW LEVEL INDICATION,DI,
,LIH,SUB BASE TANK HIGH LEVEL INDICATION,DI,
DETAIL-FCV,NI,TORQUE  INDICATION,AI,
,ZC,POSITION COMMAND,AO,
,ZI,POSITION FEEDBACK,AI,
,HI,LOR SELECTOR SWITCH OFF INDICATION,DI,
,HI,LOCAL/REMOTE INDICATION,DI,
,YA,ACTUATOR FAULT,DI,
"HS DETAIL FIP
FERTILIZER PUMP",HS,REMOTE AUTO/REMOTE MANUAL,DI,
,HI ,LOCAL/OFF/REMOTE INDICATION,DI,
,HSS ,STOP ,DO,
,HSR ,START,DO,
,YA  ,FAULT ,DI,
,YI ,STATUS ,DI,
HS-DETAIL ABF,YI,BACKWASH MODE,DI,
,YA,FAULT,DI,
,YI,NORMAL MODE,DI,
"FM
FERTILIZER MIXER",HS,REMOTE AUTO/REMOTE MANUAL ,DI,
,HI,LOCAL/OFF/REMOTE INDICATION ,DI,
,HSS ,STOP ,DO,
,HSR ,START ,DO,
,YA  ,FAULT,DI,
,YI ,STATUS ,DI,
"HS-DETAIL MP
MOTORIZED PENSTOCK ",HSC,CLOSE COMMAND,DO,
,HSO,OPEN COMMAND,DO,
,ZI,CLOSED POSITION,DI,
,ZI,OPENED POSITION,DI,
,HS,AUTO/MANUAL Mode,DI,
,YA,FAULT,DI,
HS-DETAIL SF1,HI,LOR SELECTOR SWITCH OFF INDICATION ,DI,
,HI,LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION ,DI,
,HS,STOP ,DO,
,HS,START ,DO,
,YA,FAULT ,DI,
,YI,STATUS ,DI,
MCC,,INCOMING STATUS (ON/OFF),DI,
,,INCOMING STATUS ( NORM/FAULT),DI,
,,INCOMING CURRENT READING PER PHASE,AI,
,,INCOMING GENERAL ALARM,DI,
,,INCOMING POWER FAIL (TRIP),DI,
,,OUTGOING STATUS (ON/OFF),DI,
,,OUTGOING STATUS ( NORM/FAULT),DI,
GENERATOR,,ON/OFF,DI,
,,NORM/FAULT,DI,
,,CURRENT READING PER PHASE,AI,
,,KWhr READING,AI,
,,KW READING,AI,
,,POWER FAIL (TRIP),DI,
,,GENERAL ALARM,DI,
AUTOMATIC TRANSFER SWITCH (ATS),,ON/OFF,DI,
,,NORM/FAULT,DI,
,,MANUAL/AUTO SELECTOR,DI,
,,POWER FAIL (TRIP),DI,
,,GENERAL ALARM,DI,
POWER FACTOR CORRECTION CAPACITOR,,ON/OFF,DI,
,,POWER FACTOR CAPACITOR BANK STEPS,DI,
AIT,CONDUCTIVITY ANALYZER,CONDUCTIVITY READING,AI,
AIT,H2S ANALYZER,H2S READING,AI,
NOVEC CLEAN AGENT SYSTEM,,FIRE SUPPRESSION GAS CONTROL PANEL ALARM,COM,
,,FIRE SUPPRESSION GAS CONTROL PANEL ALARM,,
,,FIRE SUPPRESSION GAS CONTROL PANEL POWER STATUS,,
,,FIRE SMOKE DAMPER STATUS,,
FACP,, ON/OFF ,DI,
,, NORM/FAULT,DI,
,, GENERAL ALARM,DI,
,, POWER FAIL (OR TRIP),DI,
,,FIRE ALARM SYSTEM GENERAL ALARM,DI,
UPS,,ON/OFF ,DI,
,,NORM/FAULT,DI,
,,MANUAL/AUTO SELECTOR,DI,
,,CURRENT PER PHASE,AI,
,,GENERAL ALARM,DI,
,,POWER FAIL (OR TRIP),DI,`;

function parseCsv(text) {
  if (!text || typeof text !== 'string') {
    console.error('parseCsv received invalid input:', typeof text);
    return [];
  }
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function normalizeKey(value) {
  return value
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
}

function splitComponentName(raw) {
  const match = raw.match(/\(([^)]+)\)/);
  if (match) {
    const equipmentName = match[1].trim();
    const baseName = raw.replace(match[0], '').trim();
    return { baseName, equipmentName };
  }
  return { baseName: raw.trim(), equipmentName: '' };
}

function normalizeIoType(value) {
  const normalized = value.trim().toUpperCase();
  if (['AI', 'DI', 'DO', 'AO', 'COM'].includes(normalized)) {
    return normalized;
  }
  if (normalized.includes('MODBUS') || normalized.includes('COMMUNICATION')) {
    return 'COM';
  }
  return normalized || 'COM';
}

function isAlarmSignal(description, ioTag) {
  const desc = (description || '').toUpperCase();
  const tag = (ioTag || '').toUpperCase();
  return desc.includes('ALARM') || desc.includes('FAULT') || tag.startsWith('LA') || tag.startsWith('PA') || tag.startsWith('TA') || tag.startsWith('YA');
}

function buildLibraryFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const library = {};
  let lastComponent = '';

  rows.forEach((row, index) => {
    if (index === 0) {
      return;
    }

    const componentRaw = (row[0] || '').trim();
    if (componentRaw) {
      lastComponent = componentRaw;
    }

    const activeComponent = componentRaw || lastComponent;
    if (!activeComponent) {
      return;
    }

    const ioTag = (row[1] || '').trim();
    const description = (row[2] || '').trim();
    const ioType = normalizeIoType(row[3] || '');

    if (!ioTag && !description) {
      return;
    }

    const { baseName, equipmentName } = splitComponentName(activeComponent);
    const primaryKey = normalizeKey(baseName || activeComponent);
    const equipmentKey = equipmentName ? normalizeKey(equipmentName) : '';

    if (!library[primaryKey]) {
      library[primaryKey] = {
        category: 'LIBRARY',
        equipment: equipmentName || baseName || activeComponent,
        ioPoints: [],
        sourceId: primaryKey,
      };
    }

    if (equipmentKey && equipmentKey !== primaryKey && !library[equipmentKey]) {
      library[equipmentKey] = library[primaryKey];
    }

    library[primaryKey].ioPoints.push({
      ioTag,
      signal: description || ioTag,
      ioType,
      isAlarm: isAlarmSignal(description, ioTag),
    });
  });

  return library;
}

// Build library from CSV - wrapped in IIFE to isolate errors
let instrumentLibrary = {};

try {
  if (libraryCsv && typeof libraryCsv === 'string' && libraryCsv.trim().length > 0) {
    instrumentLibrary = buildLibraryFromCsv(libraryCsv);
    console.log('✓ Library loaded:', Object.keys(instrumentLibrary).length, 'components');
  } else {
    console.warn('⚠ CSV empty or invalid, using empty library');
  }
} catch (error) {
  console.error('✗ Library build failed:', error.message);
  instrumentLibrary = {}; // Empty library - app will still work
}

function getPrimaryEntries() {
  return Object.entries(instrumentLibrary).filter(([key, value]) => value.sourceId === key);
}

/**
 * Check if a component is a single-loop instrument (has only one I/O point)
 */
export function isSingleLoopInstrument(componentKey) {
  const component = instrumentLibrary[componentKey];
  if (!component) return false;
  
  // Single-loop instruments typically have 1 I/O point and are simple tags like LIT, PIT, FIT, TIT, etc.
  const singleLoopPatterns = ['LIT', 'PIT', 'FIT', 'TIT', 'AIT', 'PSL', 'PSH', 'LSL', 'LSH', 'LSLL', 'LSHH', 'FS'];
  const normalizedKey = componentKey.toUpperCase();
  
  return component.ioPoints.length === 1 || singleLoopPatterns.some(pattern => normalizedKey.startsWith(pattern));
}

/**
 * Get equipment aliases for better matching
 */
export function getEquipmentAliases() {
  const aliases = {};
  
  try {
    const entries = getPrimaryEntries();
    if (!entries || entries.length === 0) {
      return aliases; // Return empty object if library not loaded
    }
    
    for (const [key, component] of entries) {
    const equipmentName = component.equipment.toUpperCase();
    
    // Extract common prefixes from component key
    const keyUpper = key.toUpperCase();
    
    // Map common prefixes to equipment types
    if (keyUpper.includes('VFD') || keyUpper.includes('P1') || keyUpper.match(/^P-/)) {
      aliases['VFD PUMP'] = key;
      aliases['PUMP'] = key;
    }
    if (keyUpper.includes('MV') || keyUpper.match(/^MV-/)) {
      aliases['MOTORIZED VALVE'] = key;
      aliases['MOV'] = key;
    }
    if (keyUpper.includes('EXHAUST') || keyUpper.includes('EF')) {
      aliases['EXHAUST FAN'] = key;
    }
    if (keyUpper.includes('SUPPLY') || keyUpper.includes('SF')) {
      aliases['SUPPLY FAN'] = key;
    }
    if (keyUpper.includes('SUMP') || keyUpper.includes('SP')) {
      aliases['SUMP PIT PUMP'] = key;
      aliases['SUMP PUMP'] = key;
    }
    if (keyUpper.includes('CONSTANT') || keyUpper.includes('CP')) {
      aliases['CONSTANT SPEED PUMP'] = key;
      aliases['CS PUMP'] = key;
    }
    if (keyUpper.includes('FCV') || keyUpper.includes('FLOW CONTROL')) {
      aliases['FLOW CONTROL VALVE'] = key;
    }
    if (keyUpper.includes('PENSTOCK') || keyUpper.includes('MP')) {
      aliases['MOTORIZED PENSTOCK'] = key;
    }
    if (keyUpper.includes('SOV') || keyUpper.includes('SOLENOID')) {
      aliases['SOLENOID VALVE'] = key;
    }
    if (keyUpper.includes('OCU') || keyUpper.includes('ODOR')) {
      aliases['ODOR CONTROL UNIT'] = key;
    }
    if (keyUpper.includes('SPLIT') || keyUpper.includes('SRAC')) {
      aliases['SPLIT AC UNIT'] = key;
    }
    if (keyUpper.includes('RTU') || keyUpper.includes('ROOF')) {
      aliases['ROOF TOP UNIT'] = key;
    }
    if (keyUpper.includes('MCC')) {
      aliases['MOTOR CONTROL CENTER'] = key;
    }
    if (keyUpper.includes('GEN') || keyUpper.includes('GENERATOR')) {
      aliases['GENERATOR'] = key;
    }
    if (keyUpper.includes('ATS')) {
      aliases['AUTOMATIC TRANSFER SWITCH'] = key;
    }
    if (keyUpper.includes('UPS')) {
      aliases['UPS'] = key;
    }
    if (keyUpper.includes('FACP') || keyUpper.includes('FIRE')) {
      aliases['FIRE ALARM CONTROL PANEL'] = key;
    }
    
        // Direct equipment name mapping
      aliases[equipmentName] = key;
    }
  } catch (error) {
    console.warn('getEquipmentAliases failed:', error);
  }
  
  return aliases;
}

/**
 * Validate an I/O point against the library
 */
export function validateIOPoint(equipmentType, ioTag, description) {
  const normalizedEquipment = normalizeKey(equipmentType);
  const component = instrumentLibrary[normalizedEquipment];
  
  if (!component) {
    // Try aliases
    const aliases = getEquipmentAliases();
    const aliasKey = aliases[equipmentType.toUpperCase()];
    if (aliasKey) {
      return validateIOPoint(aliasKey, ioTag, description);
    }
    return { valid: false, reason: `Equipment type "${equipmentType}" not found in library` };
  }
  
  const normalizedDescription = (description || '').toUpperCase().trim();
  const normalizedIoTag = (ioTag || '').toUpperCase().trim();
  
  // Check if I/O point exists in library
  const matchingIO = component.ioPoints.find(io => {
    const ioTagMatch = io.ioTag.toUpperCase() === normalizedIoTag;
    const descMatch = io.signal.toUpperCase() === normalizedDescription;
    return ioTagMatch || descMatch;
  });
  
  if (!matchingIO) {
    return { 
      valid: false, 
      reason: `I/O point "${ioTag}" with description "${description}" not found for equipment "${equipmentType}"` 
    };
  }
  
  return { 
    valid: true, 
    ioPoint: matchingIO,
    component 
  };
}

export function buildLibraryPrompt() {
  try {
    const visibleIoTypes = new Set(['AI', 'DI', 'DO', 'AO']);
    const lines = [];

    lines.push('## MASTER I/O LIBRARY (USE EXACTLY AS WRITTEN)');
    lines.push('');
    lines.push('This library defines ALL possible I/O points for each equipment type. When you find equipment in the drawing, output EXACTLY these signals - do not modify, add, or remove any text.');
    lines.push('');

    const entries = getPrimaryEntries();
    if (!entries || entries.length === 0) {
      lines.push('*Library is empty - please check library initialization*');
      return lines.join('\n');
    }
    
    entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    // Separate single-loop instruments from multi-point equipment
    const singleLoopInstruments = [];
    const multiPointEquipment = [];

    for (const [key, component] of entries) {
      const ioPoints = component.ioPoints.filter(io => io.ioTag && visibleIoTypes.has(io.ioType));
      if (ioPoints.length === 0) continue;
      
      if (isSingleLoopInstrument(key)) {
        singleLoopInstruments.push([key, component, ioPoints]);
      } else {
        multiPointEquipment.push([key, component, ioPoints]);
      }
    }

    // Single-loop instruments section
    if (singleLoopInstruments.length > 0) {
      lines.push('### SINGLE-LOOP INSTRUMENTS (Keep original tag from drawing)');
      lines.push('| Component Tag | I/O Tag | I/O Type | Description (USE EXACTLY) |');
      lines.push('|---------------|---------|----------|---------------------------|');
      
      for (const [key, component, ioPoints] of singleLoopInstruments) {
        for (const io of ioPoints) {
          const componentTag = key.replace(/-/g, '');
          lines.push(`| ${componentTag} | ${io.ioTag} | ${io.ioType} | ${io.signal} |`);
        }
      }
      lines.push('');
    }

    // Multi-point equipment section
    if (multiPointEquipment.length > 0) {
      lines.push('### MULTI-POINT EQUIPMENT (Append equipment ID to I/O tag)');
      
      for (const [key, component, ioPoints] of multiPointEquipment) {
        const title = component.equipment ? `${component.equipment} (${key})` : key;
        lines.push(`#### ${title}`);
        lines.push('| I/O Tag | I/O Type | Description (USE EXACTLY) |');
        lines.push('|---------|----------|---------------------------|');

        for (const io of ioPoints) {
          lines.push(`| ${io.ioTag} | ${io.ioType} | ${io.signal} |`);
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  } catch (error) {
    console.error('buildLibraryPrompt failed:', error);
    return '## MASTER I/O LIBRARY\n\n*Library initialization failed. Please check console.*';
  }
}

/**
 * Get I/O points for a component tag
 * @param {string} componentTag - The component tag from P&ID
 * @returns {Object|null} - The component data with I/O points or null if not found
 */
export function getComponentIO(componentTag) {
  const normalizedTag = normalizeKey(componentTag);

  // Direct match
  if (instrumentLibrary[normalizedTag]) {
    return instrumentLibrary[normalizedTag];
  }

  // Try to match by prefix
  for (const key of Object.keys(instrumentLibrary)) {
    if (normalizedTag.startsWith(key)) {
      return instrumentLibrary[key];
    }
  }

  return null;
}

/**
 * Get all I/O types summary
 * @returns {Object} - Summary of all I/O types in library
 */
export function getIOTypeSummary() {
  const summary = { AI: 0, DI: 0, DO: 0, AO: 0, COM: 0 };

  for (const [, component] of getPrimaryEntries()) {
    for (const io of component.ioPoints) {
      if (summary[io.ioType] !== undefined) {
        summary[io.ioType]++;
      }
    }
  }

  return summary;
}

/**
 * Get all components by category
 * @param {string} category - Category to filter by
 * @returns {Object} - Components in that category
 */
export function getComponentsByCategory(category) {
  const result = {};

  for (const [key, value] of getPrimaryEntries()) {
    if (value.category === category) {
      result[key] = value;
    }
  }

  return result;
}

export default instrumentLibrary;
