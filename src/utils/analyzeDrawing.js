import { buildLibraryForPrompt } from './ioLibrary';

/**
 * analyzeDrawing.js
 *
 * KEY CHANGE: We no longer send PDFs directly to Claude as documents.
 * Instead we:
 *   1. Convert each PDF page -> JPEG image using PDF.js (runs in browser, free)
 *   2. Send those images to /api/analyze (our Vercel serverless function)
 *   3. The serverless function adds the API key and calls Claude vision
 */

// ─── PDF.js Setup ────────────────────────────────────────────────────────────

let pdfjsLib = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;

  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  pdfjsLib = pdfjs;

  return pdfjsLib;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function analyzeDrawing(file, template = 'isa-5.1') {
  const isPdf = file.type === 'application/pdf';
  const prompt = buildPrompt(template);

  console.log(`Starting analysis: ${file.name} (${isPdf ? 'PDF' : 'Image'})`);

  let images;
  if (isPdf) {
    images = await pdfToImages(file);
  } else {
    const base64 = await fileToBase64(file);
    images = [base64];
  }

  console.log(`Converted to ${images.length} image(s), sending to analysis...`);

  const responseText = await callAnalyzeApi(images, prompt);
  return parseClaudeResponse(responseText);
}

// ─── PDF -> Images ────────────────────────────────────────────────────────────

async function pdfToImages(pdfFile) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  console.log(`PDF has ${totalPages} page(s)`);

  const pagesToProcess = Math.min(totalPages, 5);
  const images = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    console.log(`Rendering page ${pageNum}/${pagesToProcess}...`);
    const pageImage = await renderPageToJpeg(pdf, pageNum);
    images.push(pageImage);
  }

  return images;
}

async function renderPageToJpeg(pdf, pageNum, scale = 2.0) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1];
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function callAnalyzeApi(images, prompt) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, prompt }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Analysis failed');
  }

  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error('No response from Claude');
  }

  return content;
}

// ─── File Conversion Helpers ──────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(template) {
  const libraryText = buildLibraryForPrompt();

  return `You are an expert I&C engineer analyzing a P&ID drawing to generate an I/O list.

## YOUR MASTER LIBRARY
Every component you find MUST be matched against this library. Do not invent signals.

${libraryText}

## HOW TO ANALYZE

STEP 1 — IDENTIFY every instrument and equipment tag visible in the drawing.
Examples of tags you'll find: LIT-101, MV-WPS-01, P-WPS-01, PSH-201, TIT-301, UPS-01

STEP 2 — MATCH each tag to the closest COMPONENT in the library above.
Matching rules:
- "LIT-101" → matches "LIT" → gives 1 I/O point (WATER LEVEL, AI)
- "MV-WPS-01" → matches "MV" → gives 6 I/O points (HSC, HSO, ZIC, ZIO, HI, YA)
- "P-WPS-01" (VFD pump) → matches "HS-DETAIL P1(VFD PUMP)" → gives 19 I/O points
- "P-WPS-01" (constant speed pump) → matches "HS-DETAIL CP" → gives 7 I/O points
- "EF-01" (exhaust fan) → matches "HS-DETAIL EF" → gives 6 I/O points
- If unsure between VFD pump and constant speed pump, use VFD pump

STEP 3 — OUTPUT all I/O points for each matched component.

## TAG FORMATTING RULES
- Single-loop instruments (LIT, PIT, FIT, TIT, LSL, LSLL, LSH, LSHH, PSL, PSH, AIT, TIT, FS, SOV):
  Keep the ORIGINAL tag from the drawing exactly as seen.
  Example: "LIT-101" stays "LIT-101"

- Multi-point equipment (pumps, valves, fans, panels, MCC, UPS, etc.):
  Format: [I/O TAG FROM LIBRARY]-[EQUIPMENT ID FROM DRAWING]
  Example: MV-WPS-01 → outputs "HSC-WPS-01", "HSO-WPS-01", "ZIC-WPS-01" etc.

## OUTPUT FORMAT
Return ONLY a JSON array. Each item must have:
{
  "tag": "string — formatted tag as described above",
  "signalType": "AI | DI | DO | AO | COM",
  "description": "string — EXACTLY as written in the library, do not modify",
  "location": "string — area or system from the drawing (e.g. WET PIT, PUMP STATION)",
  "equipment": "string — component name from library (e.g. VFD PUMP, MOTORIZED VALVE)",
  "equipmentId": "string — the equipment number from the drawing (e.g. WPS-01, 101)",
  "sourceFile": ""
}

## CRITICAL RULES
1. ONLY use descriptions from the library — never invent your own
2. Output ALL I/O points for every equipment found — never skip any
3. If a component is not in the library, skip it
4. Return ONLY the JSON array, no other text

${template === 'dar' ? '\nProject uses Dar Al-Handasah naming: SPS (sewage), WPS (water), IPS (irrigation)' : ''}`;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseClaudeResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const instruments = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(instruments) || instruments.length === 0) {
      throw new Error('No instruments found in the drawing');
    }

    const validTypes = ['AI', 'DI', 'DO', 'AO', 'COM'];
    const processedInstruments = [];

    instruments.forEach((instrument, index) => {
      if (!instrument.tag && !instrument.description) return;

      const tag = normalizeTag(instrument.tag || `POINT-${index + 1}`);
      let signalType = instrument.signalType?.toUpperCase() || null;
      if (!signalType || !validTypes.includes(signalType)) {
        signalType = inferSignalType(tag, instrument.description || '');
      }

      const description = (instrument.description || 'Unknown').toUpperCase().trim();
      const equipment = (instrument.equipment || '').toUpperCase().trim();

      processedInstruments.push({
        tag,
        signalType,
        description,
        location: instrument.location || '',
        equipment,
        equipmentId: instrument.equipmentId || '',
        sourceFile: instrument.sourceFile || '',
        isAlarm: instrument.isAlarm || false,
      });
    });

    if (processedInstruments.length === 0) {
      throw new Error('No valid instruments after parsing');
    }

    console.log(`Successfully parsed ${processedInstruments.length} I/O points`);
    return processedInstruments;
  } catch (error) {
    console.error('Failed to parse response:', error);
    throw new Error('Failed to parse instrument data. Please try again.');
  }
}

function normalizeTag(tag) {
  return tag.trim().toUpperCase().replace(/[^A-Z0-9\-_/.]/g, '');
}

function inferSignalType(tag, description) {
  const descUpper = description.toUpperCase();
  const tagUpper = tag.toUpperCase();

  if (descUpper.includes('START') || descUpper.includes('STOP') || descUpper.includes('COMMAND')) return 'DO';
  if (descUpper.includes('STATUS') || descUpper.includes('FAULT') || descUpper.includes('ALARM') || descUpper.includes('MODE')) return 'DI';
  if (descUpper.includes('READING') || descUpper.includes('TRANSMITTER') || descUpper.includes('LEVEL') || descUpper.includes('PRESSURE') || descUpper.includes('TEMPERATURE') || descUpper.includes('FLOW')) return 'AI';
  if (descUpper.includes('SPEED') && descUpper.includes('CONTROL')) return 'AO';
  if (descUpper.includes('POSITION COMMAND') || descUpper.includes('SETPOINT')) return 'AO';
  if (tagUpper.match(/[FPLT]I?T/) || tagUpper.match(/A[IT]/)) return 'AI';
  if (tagUpper.match(/LS[HL]{0,2}/) || tagUpper.match(/[FPLTA]S[HL]/) || tagUpper.match(/Y[IA]/) || tagUpper.match(/ZS/)) return 'DI';
  if (tagUpper.match(/[FPLT]C?V/) || tagUpper.match(/VFD|VSD/) || tagUpper.match(/[FPLT]Y/)) return 'AO';
  if (tagUpper.match(/X[VY]/) || tagUpper.match(/SOV/) || tagUpper.match(/^M-/)) return 'DO';

  return 'DI';
}

// ─── Mock Function ────────────────────────────────────────────────────────────

export function mockAnalyzeDrawing(file, template = 'isa-5.1') {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockInstruments = [
        { tag: 'LIT-101', signalType: 'AI', description: 'WATER LEVEL', location: 'SUMP PIT', equipment: 'LIT', equipmentId: '101', sourceFile: '', isAlarm: false },
        { tag: 'LALL-101', signalType: 'DI', description: 'LEVEL SWITCH LOW LOW', location: 'SUMP PIT', equipment: 'LSLL', equipmentId: '101', sourceFile: '', isAlarm: true },
        { tag: 'LAH-101', signalType: 'DI', description: 'LEVEL SWITCH HIGH', location: 'SUMP PIT', equipment: 'LSH', equipmentId: '101', sourceFile: '', isAlarm: true },
        { tag: 'HSR-WPS-01', signalType: 'DO', description: 'START', location: 'WET PIT', equipment: 'VFD PUMP', equipmentId: 'WPS-01', sourceFile: '', isAlarm: false },
        { tag: 'HSS-WPS-01', signalType: 'DO', description: 'STOP', location: 'WET PIT', equipment: 'VFD PUMP', equipmentId: 'WPS-01', sourceFile: '', isAlarm: false },
        { tag: 'SC-WPS-01', signalType: 'AO', description: 'SPEED CONTROL', location: 'WET PIT', equipment: 'VFD PUMP', equipmentId: 'WPS-01', sourceFile: '', isAlarm: false },
        { tag: 'HSO-WPS-01', signalType: 'COM', description: 'OPEN MOTOR STARTER', location: 'WET PIT', equipment: 'VFD PUMP', equipmentId: 'WPS-01', sourceFile: '', isAlarm: false },
      ];
      resolve(mockInstruments);
    }, 2500);
  });
}
