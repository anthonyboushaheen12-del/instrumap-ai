/**
 * IO_LIBRARY — Master I/O library from IO_library.xlsx
 *
 * Structure:
 * - componentTag: the tag you'd see on a P&ID (e.g. "LIT", "MV", "HS-DETAIL P1(VFD PUMP)")
 * - ioPoints: all I/O signals that component generates
 *   - ioTag: the I/O tag prefix (e.g. "LAL", "HSC")
 *   - description: exact signal description
 *   - ioType: AI | DI | DO | AO | COM | COMMUNICATION INTERFACE | MODBUS RTU
 */
export const IO_LIBRARY = [
  { componentTag: "LSL", ioPoints: [{ ioTag: "LAL", description: "LEVEL SWITCH LOW", ioType: "DI" }] },
  { componentTag: "LSLL", ioPoints: [{ ioTag: "LALL", description: "LEVEL SWITCH LOW LOW", ioType: "DI" }] },
  { componentTag: "LSH", ioPoints: [{ ioTag: "LAH", description: "LEVEL SWITCH HIGH", ioType: "DI" }] },
  { componentTag: "LSHH", ioPoints: [{ ioTag: "LAHH", description: "LEVEL SWITCH HIGH HIGH", ioType: "DI" }] },
  {
    componentTag: "MV",
    ioPoints: [
      { ioTag: "HSC", description: "CLOSE-MAIN INLET", ioType: "DO" },
      { ioTag: "HSO", description: "OPEN- MAIN INLET", ioType: "DO" },
      { ioTag: "ZIC", description: "CLOSED- MAIN INLET", ioType: "DI" },
      { ioTag: "ZIO", description: "OPENED- MAIN INLET", ioType: "DI" },
      { ioTag: "HI", description: "LOCAL/OFF/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "YA", description: "GENERAL ALARM", ioType: "DI" }
    ]
  },
  { componentTag: "LIT", ioPoints: [{ ioTag: "LI", description: "WATER LEVEL", ioType: "AI" }] },
  { componentTag: "PIT", ioPoints: [{ ioTag: "PI", description: "PRESSURE", ioType: "AI" }] },
  { componentTag: "PSL", ioPoints: [{ ioTag: "PAL", description: "LOW PRESSURE SWITCH", ioType: "DI" }] },
  { componentTag: "PSH", ioPoints: [{ ioTag: "PAH", description: "HIGH PRESSURE SWITCH", ioType: "DI" }] },
  {
    componentTag: "HS-DETAIL P1(VFD PUMP)",
    ioPoints: [
      { ioTag: "HSO", description: "OPEN MOTOR STARTER", ioType: "COM" },
      { ioTag: "HSC", description: "CLOSE MOTOR STARTER", ioType: "COM" },
      { ioTag: "XI", description: "OVERLOAD OF MOTOR STARTER", ioType: "COM" },
      { ioTag: "EI", description: "UNDERVOLTAGE OF MOTOR STARTER", ioType: "COM" },
      { ioTag: "HI", description: "SELECTOR SWITCH AUTO POSITION", ioType: "COM" },
      { ioTag: "HI", description: "SELECTOR SWITCH MANUAL POSITION", ioType: "COM" },
      { ioTag: "YI", description: "ON STATUS OF MOTOR STARTER", ioType: "COM" },
      { ioTag: "YI", description: "OFF STATUS OF MOTOR STARTER", ioType: "COM" },
      { ioTag: "YA", description: "GENERAL ALARM", ioType: "COM" },
      { ioTag: "YA", description: "POWER FAILURE", ioType: "COM" },
      { ioTag: "SI", description: "FREQUENCY OF MOTOR STARTER", ioType: "COM" },
      { ioTag: "HSR", description: "START", ioType: "DO" },
      { ioTag: "HSS", description: "STOP", ioType: "DO" },
      { ioTag: "HS", description: "DRIVE ON/OFF", ioType: "DO" },
      { ioTag: "SC", description: "SPEED CONTROL", ioType: "AO" },
      { ioTag: "TAHH", description: "HIGH HIGH TEMPERATURE INDICATION", ioType: "COM" },
      { ioTag: "VAHH", description: "HIGH HIGH VIBRATION INDICATION", ioType: "COM" },
      { ioTag: "TI", description: "TEMPERATURE SENSOR READING", ioType: "AI" },
      { ioTag: "VI", description: "VIBRATION SENSOR READING", ioType: "AI" }
    ]
  },
  {
    componentTag: "HS-DETAIL SP (SUMP PIT PUMP)",
    ioPoints: [
      { ioTag: "HI", description: "AUTO/MANUAL INDICATION", ioType: "DI" },
      { ioTag: "LAHH", description: "HIGH HIGH LEVEL ALARM", ioType: "DI" },
      { ioTag: "LALL", description: "LOW LOW LEVEL ALARM", ioType: "DI" },
      { ioTag: "YA", description: "POWER FAILURE", ioType: "DI" },
      { ioTag: "YI", description: "PUMP 1 RUNNING STATUS", ioType: "DI" },
      { ioTag: "YA", description: "PUMP 1 FAULT", ioType: "DI" },
      { ioTag: "YI", description: "PUMP 2 RUNNING STATUS", ioType: "DI" },
      { ioTag: "YA", description: "PUMP 2 FAULT", ioType: "DI" },
      { ioTag: "II", description: "PUMP 1 CURRENT INDICATION", ioType: "AI" },
      { ioTag: "II", description: "PUMP 2 CURRENT INDICATION", ioType: "AI" }
    ]
  },
  {
    componentTag: "HS-DETAIL EF (EXHAUST FAN)",
    ioPoints: [
      { ioTag: "HI", description: "LOR SELECTOR SWITCH OFF INDICATION", ioType: "DI" },
      { ioTag: "HI", description: "LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "HSS", description: "STOP", ioType: "DO" },
      { ioTag: "HSR", description: "START", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  {
    componentTag: "ROOF TOP UNIT",
    ioPoints: [
      { ioTag: "HA", description: "MANUAL MODE-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "HA", description: "OFF MODE-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "TC", description: "RETURN AIR TEMPERATURE SETPOINT-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "TI", description: "RETURN AIR TEMPERATURE-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YA", description: "CONDENSER FAN FAULT-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YI", description: "CONDENSER FAN STATUS-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YA", description: "COMPRESSOR FAULT-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YI", description: "COMPRESSOR STATUS-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YA", description: "SUPPLY FAN FAULT-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YI", description: "SUPPLY FAN STATUS-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YA", description: "ALARM-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "YI", description: "FILTER STATUS-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "HS", description: "ENABLE-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "HS", description: "DISABLE-ROOF TOP UNIT", ioType: "COM" },
      { ioTag: "ZI", description: "MOTORIZED DAMPER STATUS-ROOF TOP UNIT", ioType: "COM" }
    ]
  },
  { componentTag: "TIT", ioPoints: [{ ioTag: "TI", description: "ROOM TEMPERATURE", ioType: "AI" }] },
  {
    componentTag: "DUTY STANDBY SPLIT UNIT CONTROL PANEL (SRAC/SRCU)",
    ioPoints: [
      { ioTag: "YA", description: "SPLIT UNIT'S TRIP", ioType: "DI" },
      { ioTag: "YI", description: "SPLIT AC UNIT RUNNING STATUS", ioType: "DI" },
      { ioTag: "HS", description: "SPLIT AC UNIT ENABLE / DISABLE", ioType: "DO" }
    ]
  },
  { componentTag: "FIT", ioPoints: [{ ioTag: "FI", description: "FLOW", ioType: "AI" }] },
  {
    componentTag: "ODOR CONTROL UNIT LCP",
    ioPoints: [
      { ioTag: "HS", description: "ENABLE/DISABLE", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  {
    componentTag: "HS-DETAIL CP (CONSTANT SPEED PUMP)",
    ioPoints: [
      { ioTag: "HI", description: "LOR SELECTOR SWITCH OFF INDICATION", ioType: "DI" },
      { ioTag: "HI", description: "LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "HS", description: "REMOTE AUTO / REMOTE MANUAL", ioType: "DI" },
      { ioTag: "HSS", description: "STOP", ioType: "DO" },
      { ioTag: "HSR", description: "START", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  { componentTag: "SOV", ioPoints: [{ ioTag: "HS", description: "OVERFLOW & DRAIN OF SUB BASE TANKS TO BULK TANK 01", ioType: "DO" }] },
  { componentTag: "FS", ioPoints: [{ ioTag: "FI", description: "FLOW SWITCH", ioType: "DI" }] },
  {
    componentTag: "DUPLEX FUEL OIL PUMPS",
    ioPoints: [
      { ioTag: "YA", description: "PUMP 1 FAULT", ioType: "DI" },
      { ioTag: "YI", description: "PUMP 1 STATUS", ioType: "DI" },
      { ioTag: "DPAH", description: "DIFFERENTIAL PRESSURE SWITCH HIGH-PUMP 1 INLET SUCTION STRAINER", ioType: "DI" },
      { ioTag: "PAH", description: "PRESSURE SWITCH HIGH-PUMP 1 OUTLET", ioType: "DI" },
      { ioTag: "YA", description: "PUMP 2 FAULT", ioType: "DI" },
      { ioTag: "YI", description: "PUMP 2 STATUS", ioType: "DI" },
      { ioTag: "DPAH", description: "DIFFERENTIAL PRESSURE SWITCH HIGH-PUMP 2 INLET SUCTION STRAINER", ioType: "DI" },
      { ioTag: "PAH", description: "PRESSURE SWITCH HIGH-PUMP 2 OUTLET", ioType: "DI" },
      { ioTag: "LAHH", description: "SUB BASE TANK HIGH HIGH LEVEL ALARM", ioType: "DI" },
      { ioTag: "LIL", description: "SUB BASE TANK LOW LEVEL INDICATION", ioType: "DI" },
      { ioTag: "LIH", description: "SUB BASE TANK HIGH LEVEL INDICATION", ioType: "DI" }
    ]
  },
  {
    componentTag: "DETAIL-FCV",
    ioPoints: [
      { ioTag: "NI", description: "TORQUE INDICATION", ioType: "AI" },
      { ioTag: "ZC", description: "POSITION COMMAND", ioType: "AO" },
      { ioTag: "ZI", description: "POSITION FEEDBACK", ioType: "AI" },
      { ioTag: "HI", description: "LOR SELECTOR SWITCH OFF INDICATION", ioType: "DI" },
      { ioTag: "HI", description: "LOCAL/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "YA", description: "ACTUATOR FAULT", ioType: "DI" }
    ]
  },
  {
    componentTag: "HS DETAIL FIP (FERTILIZER PUMP)",
    ioPoints: [
      { ioTag: "HS", description: "REMOTE AUTO/REMOTE MANUAL", ioType: "DI" },
      { ioTag: "HI", description: "LOCAL/OFF/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "HSS", description: "STOP", ioType: "DO" },
      { ioTag: "HSR", description: "START", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  {
    componentTag: "HS-DETAIL ABF",
    ioPoints: [
      { ioTag: "YI", description: "BACKWASH MODE", ioType: "DI" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "NORMAL MODE", ioType: "DI" }
    ]
  },
  {
    componentTag: "FM (FERTILIZER MIXER)",
    ioPoints: [
      { ioTag: "HS", description: "REMOTE AUTO/REMOTE MANUAL", ioType: "DI" },
      { ioTag: "HI", description: "LOCAL/OFF/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "HSS", description: "STOP", ioType: "DO" },
      { ioTag: "HSR", description: "START", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  {
    componentTag: "HS-DETAIL MP (MOTORIZED PENSTOCK)",
    ioPoints: [
      { ioTag: "HSC", description: "CLOSE COMMAND", ioType: "DO" },
      { ioTag: "HSO", description: "OPEN COMMAND", ioType: "DO" },
      { ioTag: "ZI", description: "CLOSED POSITION", ioType: "DI" },
      { ioTag: "ZI", description: "OPENED POSITION", ioType: "DI" },
      { ioTag: "HS", description: "AUTO/MANUAL MODE", ioType: "DI" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" }
    ]
  },
  {
    componentTag: "HS-DETAIL SF1",
    ioPoints: [
      { ioTag: "HI", description: "LOR SELECTOR SWITCH OFF INDICATION", ioType: "DI" },
      { ioTag: "HI", description: "LOR SELECTOR SWITCH LOCAL/REMOTE INDICATION", ioType: "DI" },
      { ioTag: "HS", description: "STOP", ioType: "DO" },
      { ioTag: "HS", description: "START", ioType: "DO" },
      { ioTag: "YA", description: "FAULT", ioType: "DI" },
      { ioTag: "YI", description: "STATUS", ioType: "DI" }
    ]
  },
  {
    componentTag: "MCC",
    ioPoints: [
      { ioTag: null, description: "INCOMING STATUS (ON/OFF)", ioType: "DI" },
      { ioTag: null, description: "INCOMING STATUS (NORM/FAULT)", ioType: "DI" },
      { ioTag: null, description: "INCOMING CURRENT READING PER PHASE", ioType: "AI" },
      { ioTag: null, description: "INCOMING GENERAL ALARM", ioType: "DI" },
      { ioTag: null, description: "INCOMING POWER FAIL (TRIP)", ioType: "DI" },
      { ioTag: null, description: "OUTGOING STATUS (ON/OFF)", ioType: "DI" },
      { ioTag: null, description: "OUTGOING STATUS (NORM/FAULT)", ioType: "DI" }
    ]
  },
  {
    componentTag: "GENERATOR",
    ioPoints: [
      { ioTag: null, description: "ON/OFF", ioType: "DI" },
      { ioTag: null, description: "NORM/FAULT", ioType: "DI" },
      { ioTag: null, description: "CURRENT READING PER PHASE", ioType: "AI" },
      { ioTag: null, description: "KWhr READING", ioType: "AI" },
      { ioTag: null, description: "KW READING", ioType: "AI" },
      { ioTag: null, description: "POWER FAIL (TRIP)", ioType: "DI" },
      { ioTag: null, description: "GENERAL ALARM", ioType: "DI" }
    ]
  },
  {
    componentTag: "AUTOMATIC TRANSFER SWITCH (ATS)",
    ioPoints: [
      { ioTag: null, description: "ON/OFF", ioType: "DI" },
      { ioTag: null, description: "NORM/FAULT", ioType: "DI" },
      { ioTag: null, description: "MANUAL/AUTO SELECTOR", ioType: "DI" },
      { ioTag: null, description: "POWER FAIL (TRIP)", ioType: "DI" },
      { ioTag: null, description: "GENERAL ALARM", ioType: "DI" }
    ]
  },
  {
    componentTag: "POWER FACTOR CORRECTION CAPACITOR",
    ioPoints: [
      { ioTag: null, description: "ON/OFF", ioType: "DI" },
      { ioTag: null, description: "POWER FACTOR CAPACITOR BANK STEPS", ioType: "DI" }
    ]
  },
  {
    componentTag: "AIT",
    ioPoints: [
      { ioTag: "AI", description: "CONDUCTIVITY READING", ioType: "AI" },
      { ioTag: "AI", description: "H2S READING", ioType: "AI" }
    ]
  },
  {
    componentTag: "NOVEC CLEAN AGENT SYSTEM",
    ioPoints: [
      { ioTag: null, description: "FIRE SUPPRESSION GAS CONTROL PANEL ALARM", ioType: "COM" },
      { ioTag: null, description: "FIRE SUPPRESSION GAS CONTROL PANEL POWER STATUS", ioType: "COM" },
      { ioTag: null, description: "FIRE SMOKE DAMPER STATUS", ioType: "COM" }
    ]
  },
  {
    componentTag: "FACP",
    ioPoints: [
      { ioTag: null, description: "ON/OFF", ioType: "DI" },
      { ioTag: null, description: "NORM/FAULT", ioType: "DI" },
      { ioTag: null, description: "GENERAL ALARM", ioType: "DI" },
      { ioTag: null, description: "POWER FAIL (OR TRIP)", ioType: "DI" },
      { ioTag: null, description: "FIRE ALARM SYSTEM GENERAL ALARM", ioType: "DI" }
    ]
  },
  {
    componentTag: "UPS",
    ioPoints: [
      { ioTag: null, description: "ON/OFF", ioType: "DI" },
      { ioTag: null, description: "NORM/FAULT", ioType: "DI" },
      { ioTag: null, description: "MANUAL/AUTO SELECTOR", ioType: "DI" },
      { ioTag: null, description: "CURRENT PER PHASE", ioType: "AI" },
      { ioTag: null, description: "GENERAL ALARM", ioType: "DI" },
      { ioTag: null, description: "POWER FAIL (OR TRIP)", ioType: "DI" }
    ]
  }
];

/**
 * Look up a component tag from the P&ID and return its full I/O list
 * componentTag: the raw tag from the drawing (e.g. "LIT-101", "P-WPS-01", "MV-03")
 */
export function lookupComponent(componentTag) {
  const tag = componentTag.toUpperCase().trim();

  // Extract the prefix (e.g. "LIT" from "LIT-101", "MV" from "MV-03")
  const prefix = tag.split('-')[0];

  // Direct match on prefix first
  const directMatch = IO_LIBRARY.find(c =>
    c.componentTag.toUpperCase().replace(/[\n\s]+/g, ' ').startsWith(prefix)
  );

  if (directMatch) return directMatch;

  // Fuzzy match - check if the tag contains the component keyword
  const fuzzyMatch = IO_LIBRARY.find(c => {
    const libTag = c.componentTag.toUpperCase();
    return libTag.includes(prefix) || prefix.includes(libTag.split(/[\s\n(]/)[0]);
  });

  return fuzzyMatch || null;
}

/**
 * Build a formatted library string for the Claude prompt
 */
export function buildLibraryForPrompt() {
  return IO_LIBRARY.map(comp => {
    const points = comp.ioPoints
      .map(p => `    - ${p.ioTag || 'N/A'} | ${p.description} | ${p.ioType}`)
      .join('\n');
    return `COMPONENT: ${comp.componentTag}\n${points}`;
  }).join('\n\n');
}
