import { buildLibraryPrompt, validateIOPoint, getEquipmentAliases, isSingleLoopInstrument, getComponentIO } from './instrumentLibrary';

/**
 * analyzeDrawing.js
 *
 * KEY CHANGE: We no longer send PDFs directly to Claude as documents.
 * Instead we:
 *   1. Convert each PDF page → JPEG image using PDF.js (runs in browser, free)
 *   2. Send those images to /api/analyze (our Vercel serverless function)
 *   3. The serverless function adds the API key and calls Claude vision
 *
 * Why this works better:
 * - Claude's vision model SEES the drawing like a human engineer would
 * - Instrument bubbles, tag labels, signal lines are all visually recognized
 * - Much higher accuracy than text extraction from PDFs
 */

// ─── PDF.js Setup ────────────────────────────────────────────────────────────
// We load PDF.js from CDN (free, no install needed)
// This converts PDF pages into canvas images that Claude can see

let pdfjsLib = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;

  // Load PDF.js from CDN if not already loaded
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
      script.type = 'module';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Small delay to ensure module initializes
    await new Promise((r) => setTimeout(r, 300));
  }

  pdfjsLib = window.pdfjsLib;

  // Point to the PDF.js worker (required — this does the heavy lifting)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

  return pdfjsLib;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyzes a P&ID drawing file
 * @param {File} file - PDF, PNG, or JPG file
 * @param {string} template - Template type
 * @returns {Promise<Array>} Extracted I/O list
 */
export async function analyzeDrawing(file, template = 'isa-5.1') {
  const isPdf = file.type === 'application/pdf';
  const prompt = buildPrompt(template);

  console.log(`Starting analysis: ${file.name} (${isPdf ? 'PDF' : 'Image'})`);

  // Step 1: Convert file to array of JPEG base64 images
  let images;
  if (isPdf) {
    images = await pdfToImages(file);
  } else {
    // For PNG/JPG, just convert directly — no need for PDF.js
    const base64 = await fileToBase64(file);
    images = [base64];
  }

  console.log(`Converted to ${images.length} image(s), sending to analysis...`);

  // Step 2: Send to our serverless function (which holds the API key)
  const responseText = await callAnalyzeApi(images, prompt);

  // Step 3: Parse Claude's JSON response into instruments
  return parseClaudeResponse(responseText);
}

// ─── PDF → Images ────────────────────────────────────────────────────────────

/**
 * Converts a PDF file into an array of JPEG base64 strings (one per page)
 * Uses PDF.js to render each page to a canvas, then exports as JPEG
 *
 * @param {File} pdfFile
 * @returns {Promise<string[]>} Array of base64 JPEG strings
 */
async function pdfToImages(pdfFile) {
  const pdfjs = await getPdfjs();

  // Read the PDF file as ArrayBuffer
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Load the PDF document
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  console.log(`PDF has ${totalPages} page(s)`);

  // Limit to first 5 pages (most P&IDs are 1-2 pages, but let's be safe)
  const pagesToProcess = Math.min(totalPages, 5);
  const images = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    console.log(`Rendering page ${pageNum}/${pagesToProcess}...`);
    const pageImage = await renderPageToJpeg(pdf, pageNum);
    images.push(pageImage);
  }

  return images;
}

/**
 * Renders a single PDF page to a JPEG base64 string
 * Scale 2.0 = 2x resolution — high enough for Claude to read small instrument tags
 */
async function renderPageToJpeg(pdf, pageNum, scale = 2.0) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // Create an off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');

  // White background (P&IDs are usually on white)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render the PDF page onto the canvas
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Export as JPEG (quality 0.85 = good balance of quality vs file size)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  // Strip the "data:image/jpeg;base64," prefix — Claude just needs the raw base64
  return dataUrl.split(',')[1];
}

// ─── API Call ─────────────────────────────────────────────────────────────────

/**
 * Sends images + prompt to our Vercel serverless function
 * The function is at /api/analyze — it holds the API key server-side
 */
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

/**
 * Converts an image file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

/**
 * Builds the extraction prompt (unchanged from your original — it's good)
 */
function buildPrompt(template) {
  let aliasList = '';
  try {
    const aliases = getEquipmentAliases();
    aliasList = Object.entries(aliases)
      .filter(([alias]) => alias.length <= 30)
      .slice(0, 20)
      .map(([alias, key]) => `- "${alias}" → ${key}`)
      .join('\n');
  } catch (error) {
    console.warn('Failed to get equipment aliases:', error);
    aliasList = '(Alias mapping unavailable)';
  }

  const basePrompt = `You are an I/O list generator. Your ONLY job is to:
1. Identify equipment in the P&ID drawing
2. Match each equipment to its type from the MASTER LIBRARY below
3. Output the EXACT I/O points from the library for each equipment found

${buildLibraryPrompt()}

## EQUIPMENT ALIAS MAPPING

Common tag patterns and their equipment types:
${aliasList}

## INSTRUCTIONS

1. **IDENTIFY** equipment in the drawing (e.g., "P-WPS-01" is a VFD Pump, "MV-01" is a Motorized Valve, "LIT-101" is a Level Transmitter)
2. **LOOK UP** the equipment type in the library above (use aliases if needed)
3. **OUTPUT** I/O points based on equipment type:
   - **SINGLE-LOOP INSTRUMENTS** (LIT, PIT, FIT, TIT, PSL, PSH, LSL, LSH, etc.): Keep the ORIGINAL tag from the drawing (e.g., "LIT-101" stays "LIT-101", NOT "LI-101")
   - **MULTI-POINT EQUIPMENT** (Pumps, Valves, Fans, etc.): Append equipment ID to library I/O tag (e.g., "HSR-WPS-01", "HSS-WPS-01")

## OUTPUT FORMAT

Return JSON array. For each I/O point:
- **tag**:
  - Single-loop: Keep original tag from drawing (e.g., "LIT-101", "PIT-201")
  - Multi-point: [Library I/O Tag]-[Equipment ID] (e.g., "HSR-WPS-01", "HSS-WPS-01")
- **signalType**: EXACTLY as shown in library (AI, DI, DO, AO)
- **description**: EXACTLY as shown in library - DO NOT MODIFY
- **location**: Area/location from drawing
- **equipment**: Equipment type name from library (e.g., "VFD PUMP", "MOTORIZED VALVE", "LEVEL TRANSMITTER")
- **isAlarm**: true if it's an alarm signal

## CRITICAL RULES

1. **USE DESCRIPTIONS EXACTLY** - Copy from library, don't modify
2. **OUTPUT ALL SIGNALS** - When you find equipment, output ALL its I/O points from the library
3. **TAG FORMAT** - Single-loop instruments keep original tag; multi-point equipment append ID to I/O tag
4. **MATCH EQUIPMENT** - Use library equipment names exactly as shown

Return ONLY the JSON array.`;

  if (template === 'dar') {
    return basePrompt + `\n\n## DAR AL-HANDASAH PROJECT\nFacility types: SPS (sewage), WPS (water), IPS (irrigation)\nUse the MASTER LIBRARY above exactly as written.`;
  }
  if (template === 'isa-5.1') {
    return basePrompt + `\n\n## ISA-5.1 - Additional Notes\nFollow ISA-5.1 tag naming conventions.`;
  }

  return basePrompt;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

/**
 * Parses Claude's JSON response into instrument objects
 * (Unchanged from your original — the parsing logic is solid)
 */
function parseClaudeResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const instruments = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(instruments) || instruments.length === 0) {
      throw new Error('No instruments found in the drawing');
    }

    const validTypes = ['AI', 'DI', 'DO', 'AO'];
    const processedInstruments = [];
    const validationErrors = [];
    const aliases = getEquipmentAliases();

    instruments.forEach((instrument, index) => {
      if (!instrument.tag && !instrument.description) return;

      const tag = normalizeTag(instrument.tag || `POINT-${index + 1}`);
      let signalType = instrument.signalType?.toUpperCase() || null;
      if (!signalType || !validTypes.includes(signalType)) {
        signalType = inferSignalType(tag, instrument.description || '');
      }

      const description = (instrument.description || 'Unknown').toUpperCase().trim();
      let equipmentType = (instrument.equipment || '').toUpperCase().trim();

      if (!equipmentType) {
        const componentMatch = getComponentIO(tag);
        if (componentMatch) equipmentType = componentMatch.equipment.toUpperCase();
      }

      let isValid = true;
      let validationResult = null;

      if (equipmentType) {
        let ioTag = tag;
        if (tag.includes('-')) {
          const parts = tag.split('-');
          const componentMatch = getComponentIO(parts[0]);
          if (componentMatch && !isSingleLoopInstrument(parts[0])) ioTag = parts[0];
        }

        validationResult = validateIOPoint(equipmentType, ioTag, description);

        if (!validationResult.valid) {
          isValid = false;
          validationErrors.push({ tag, equipment: equipmentType, error: validationResult.reason });

          const componentMatch = getComponentIO(tag);
          if (componentMatch) {
            const matchingIO = componentMatch.ioPoints.find(
              (io) =>
                io.signal.toUpperCase() === description ||
                io.ioTag.toUpperCase() === ioTag.toUpperCase()
            );
            if (matchingIO) {
              isValid = true;
              validationResult = { valid: true, ioPoint: matchingIO, component: componentMatch };
              equipmentType = componentMatch.equipment.toUpperCase();
            }
          }
        } else {
          equipmentType = validationResult.component.equipment.toUpperCase();
        }
      }

      if (isValid || !equipmentType) {
        processedInstruments.push({
          tag,
          signalType,
          description,
          location: instrument.location || '',
          equipment: equipmentType || instrument.equipment || '',
          isAlarm: instrument.isAlarm ?? validationResult?.ioPoint?.isAlarm ?? false,
        });
      }
    });

    if (validationErrors.length > 0) {
      console.warn(`Validation warnings (${validationErrors.length} items):`, validationErrors);
    }

    if (processedInstruments.length === 0) {
      throw new Error('No valid instruments after validation');
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
  if (descUpper.includes('READING') || descUpper.includes('TRANSMITTER')) return 'AI';
  if (descUpper.includes('SPEED') && descUpper.includes('COMMAND')) return 'AO';
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
        { tag: 'LIT-101', signalType: 'AI', description: 'WATER LEVEL', location: 'SUMP PIT', equipment: 'LEVEL TRANSMITTER', isAlarm: false },
        { tag: 'LSLL-101', signalType: 'DI', description: 'LOW LOW LEVEL SWITCH', location: 'SUMP PIT', equipment: 'LEVEL SWITCH', isAlarm: true },
        { tag: 'LSH-101', signalType: 'DI', description: 'HIGH LEVEL SWITCH', location: 'SUMP PIT', equipment: 'LEVEL SWITCH', isAlarm: true },
        { tag: 'HSR-WPS-01', signalType: 'DO', description: 'START', location: 'WET PIT', equipment: 'VFD PUMP', isAlarm: false },
        { tag: 'HSS-WPS-01', signalType: 'DO', description: 'STOP', location: 'WET PIT', equipment: 'VFD PUMP', isAlarm: false },
        { tag: 'SC-WPS-01', signalType: 'AO', description: 'SPEED CONTROL', location: 'WET PIT', equipment: 'VFD PUMP', isAlarm: false },
      ];
      resolve(mockInstruments);
    }, 2500);
  });
}
