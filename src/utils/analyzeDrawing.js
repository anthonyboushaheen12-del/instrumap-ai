import { buildLibraryForPrompt, IO_LIBRARY, lookupComponent } from './ioLibrary';
import { buildCorrectionHints } from './storage';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * analyzeDrawing.js
 *
 * KEY CHANGE: We no longer send PDFs directly to Claude as documents.
 * Instead we:
 *   1. Convert each PDF page -> JPEG image using PDF.js (runs in browser, free)
 *   2. Send those images to /api/analyze (our Vercel serverless function)
 *   3. The serverless function adds the API key and calls Claude vision
 */

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function analyzeDrawing(file, template = 'isa-5.1', onProgress) {
  const isPdf = file.type === 'application/pdf';
  const prompt = buildPrompt(template);
  const report = onProgress || (() => {});

  console.log(`Starting analysis: ${file.name} (${isPdf ? 'PDF' : 'Image'})`);

  report('reading');
  let images;
  if (isPdf) {
    const pdfRenderPromise = (async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const pagesToProcess = Math.min(totalPages, 5);

      report('converting');
      const pageImages = [];
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        console.log(`Rendering page ${pageNum}/${pagesToProcess}...`);
        const result = await renderPageToImage(pdf, pageNum);
        // renderPageToImage returns either a single image object or an array of tiles
        if (Array.isArray(result)) {
          pageImages.push(...result);
        } else {
          pageImages.push(result);
        }
      }
      return pageImages;
    })();

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF rendering timed out — try a smaller file.')), 30000)
    );

    images = await Promise.race([pdfRenderPromise, timeout]);
  } else {
    report('converting');
    const base64 = await fileToBase64(file);
    const mediaType = file.type || 'image/png';
    images = [{ data: base64, mediaType }];
  }

  console.log(`Converted to ${images.length} image(s), sending to analysis...`);

  report('analyzing');
  const responseText = await callAnalyzeApi(images, prompt.userPrompt, prompt.systemPrompt);

  report('processing');
  const instruments = parseClaudeResponse(responseText);
  const deduplicated = deduplicateInstruments(instruments);
  const validated = validateAgainstLibrary(deduplicated);

  // Verification pass — ask Claude to check for missed tags
  report('verifying');
  const verified = await verifyExtraction(images, validated, prompt.systemPrompt);
  return verified;
}

// ─── PDF -> Images ────────────────────────────────────────────────────────────

async function renderPageToImage(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);

  // Start at scale 2.0 for maximum detail — Claude needs to read small tags
  let scale = 2.0;
  const viewport = page.getViewport({ scale: 1.0 });
  const maxDimension = Math.max(viewport.width, viewport.height);

  // Cap so longest side never exceeds 4000px (higher res for better tag readability)
  if (maxDimension * scale > 4000) {
    scale = 4000 / maxDimension;
  }

  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

  // For very dense drawings (both axes > 3500px), tile into overlapping quadrants
  if (canvas.width > 3500 && canvas.height > 3500) {
    console.log(`Page ${pageNum}: Dense drawing (${canvas.width}x${canvas.height}px), using tiled analysis`);
    return tileCanvas(canvas);
  }

  // Try PNG first (lossless, best for reading small text on P&IDs)
  let dataUrl = canvas.toDataURL('image/png');
  let mediaType = 'image/png';

  // If PNG is too large (>4.5MB base64), fall back to high-quality JPEG
  const base64Data = dataUrl.split(',')[1];
  const sizeBytes = base64Data.length * 0.75;
  if (sizeBytes > 4.5 * 1024 * 1024) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    mediaType = 'image/jpeg';
    console.log(`Page ${pageNum}: PNG too large (${Math.round(sizeBytes / 1024)}KB), using JPEG`);
  }

  console.log(`Page ${pageNum} rendered: ${canvas.width}x${canvas.height}px (${mediaType})`);

  return { data: dataUrl.split(',')[1], mediaType };
}

/**
 * Split a canvas into overlapping tiles for dense drawings.
 * Only used when both dimensions exceed the threshold.
 */
function tileCanvas(canvas, overlapPx = 200) {
  const { width, height } = canvas;
  const midX = Math.floor(width / 2) + overlapPx;
  const midY = Math.floor(height / 2) + overlapPx;

  const regions = [
    { x: 0, y: 0, w: midX, h: midY, label: 'top-left' },
    { x: width - midX, y: 0, w: midX, h: midY, label: 'top-right' },
    { x: 0, y: height - midY, w: midX, h: midY, label: 'bottom-left' },
    { x: width - midX, y: height - midY, w: midX, h: midY, label: 'bottom-right' },
  ];

  const tiles = [];
  for (const region of regions) {
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = region.w;
    tileCanvas.height = region.h;
    const tileCtx = tileCanvas.getContext('2d');
    tileCtx.drawImage(canvas, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);

    let dataUrl = tileCanvas.toDataURL('image/png');
    let mediaType = 'image/png';
    const base64Data = dataUrl.split(',')[1];
    const sizeBytes = base64Data.length * 0.75;
    if (sizeBytes > 4.5 * 1024 * 1024) {
      dataUrl = tileCanvas.toDataURL('image/jpeg', 0.92);
      mediaType = 'image/jpeg';
    }

    tiles.push({ data: dataUrl.split(',')[1], mediaType, label: region.label });
  }

  console.log(`Tiled into ${tiles.length} overlapping quadrants (${overlapPx}px overlap)`);
  return tiles;
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function callAnalyzeApi(images, prompt, systemPrompt) {
  const firstImage = images[0].data || images[0];
  const imageSizeKB = Math.round((firstImage.length * 0.75) / 1024);
  console.log(`Sending ${images.length} image(s): ~${imageSizeKB}KB each`);
  if (imageSizeKB > 5000) {
    console.warn('Image is very large, may cause timeout');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, prompt, systemPrompt }),
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

// ─── Verification Pass ────────────────────────────────────────────────────────

async function verifyExtraction(images, instruments, systemPrompt) {
  try {
    const tagList = [...new Set(instruments.map(i => i.tag))].join(', ');
    const equipmentList = [...new Set(instruments.filter(i => i.equipmentId).map(i => `${i.equipment} (${i.equipmentId})`))].join(', ');

    const verifyPrompt = `I already extracted these instrument tags from this P&ID drawing:

TAGS FOUND: ${tagList}

EQUIPMENT FOUND: ${equipmentList}

Please carefully re-examine the drawing and identify any instrument tags that I MISSED. Look especially in:
- Detail callout boxes
- Title block and legend areas
- Small instrument bubbles that are hard to read
- Equipment labels near piping

Return ONLY a JSON array of missed instruments (same format as before). If nothing was missed, return an empty array [].
Do NOT repeat tags already found. ONLY return NEW tags that were missed.`;

    const responseText = await callAnalyzeApi(images, verifyPrompt, systemPrompt);
    const missedInstruments = parseClaudeResponse(responseText, true);

    if (missedInstruments.length > 0) {
      console.log(`Verification found ${missedInstruments.length} missed instrument(s)`);
      // Mark verified additions with lower confidence
      const newInsts = missedInstruments.map(inst => ({
        ...inst,
        confidence: Math.min(inst.confidence || 0.7, 0.75),
      }));
      return deduplicateInstruments([...instruments, ...newInsts]);
    }

    console.log('Verification pass: no missed instruments');
    return instruments;
  } catch (error) {
    console.warn('Verification pass failed, using initial extraction:', error.message);
    return instruments;
  }
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(template) {
  const libraryText = buildLibraryForPrompt();

  const systemPrompt = `You are an expert I&C engineer analyzing P&ID drawings to generate I/O lists.
You must be EXTREMELY thorough — missing even one instrument tag is unacceptable.

## YOUR MASTER LIBRARY
Every component you find MUST be matched against this library. Do not invent signals.

${libraryText}`;

  const userPrompt = `Analyze this P&ID drawing and extract ALL instrument tags into an I/O list.

## HOW TO ANALYZE

STEP 1 — SCAN THE ENTIRE DRAWING SYSTEMATICALLY:
  a) Start from the TOP-LEFT corner and scan across to the RIGHT, then move DOWN.
  b) Check EVERY instrument bubble, tag callout, detail box, and equipment label.
  c) Look inside DETAIL CALLOUT BOXES — they often contain pump/motor/panel details.
  d) Check the TITLE BLOCK and LEGEND for equipment lists and abbreviations.
  e) Look for tags in the format: XXX-NNN, XX-NNN, or PREFIX-SUFFIX-NNN.
  f) Check BOTH the main drawing area AND any detail/inset drawings.

STEP 2 — IDENTIFY every instrument and equipment tag visible in the drawing.
Examples of tags you'll find: LIT-101, MV-WPS-01, P-WPS-01, PSH-201, TIT-301, UPS-01, OCU-1, AIT-201, FS-101, SOV-101

STEP 3 — MATCH each tag to the closest COMPONENT in your library.

STEP 4 — OUTPUT all I/O points for each matched component. Output EVERY signal in the library entry — do not skip any.

## STRICT MATCHING RULES

1. ONLY output equipment you can EXPLICITLY SEE tagged in the drawing.
   Do NOT add equipment from the library that is not visible in the drawing.
   If you are not sure something exists, leave it out.

2. PUMP TYPE MATCHING — read the detail callout on the drawing carefully:
   - "DETAIL-SP" or "HS-DETAIL SP" = SUMP PIT PUMP → use "HS-DETAIL SP (SUMP PIT PUMP)" library entry
   - "DETAIL-P1" or "HS-DETAIL P1" or "VFD" label = VFD PUMP → use "HS-DETAIL P1(VFD PUMP)" entry
   - "DETAIL-CP" = CONSTANT SPEED PUMP → use "HS-DETAIL CP" entry
   - When in doubt between pump types, use SUMP PIT PUMP, not VFD PUMP

3. For SUMP PIT PUMPS specifically:
   The library has ONE entry covering BOTH pumps together.
   Do NOT duplicate the entry — output it once with equipmentId showing both pumps.
   Example: equipmentId: "SPS-1 & SPS-2"

4. NEVER output equipment types that are not matched to a visible tag in the drawing.
   Example: if you don't see "RTU" or "ROOF TOP UNIT" label on the drawing, don't output it.

5. For OCU (Odor Control Unit): match to "ODOR CONTROL UNIT LCP" library entry.
   Tag format on drawing may appear as "OCU-1" or "PS2.1-OCU-1".

6. For AIT (H2S analyzer): match to "AIT" library entry, output H2S READING signal.

7. For UPS: match to "UPS" library entry, output all its signals.

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
  "sourceFile": "",
  "confidence": 0.0-1.0
}

The "confidence" field rates how certain you are: 1.0 = tag clearly readable, 0.7-0.9 = partially obscured or ambiguous, below 0.7 = guessing.

## CRITICAL RULES
1. ONLY use descriptions from the library — never invent your own
2. Output ALL I/O points for every equipment found — never skip any signal row
3. If a component is not in the library, skip it
4. Return ONLY the JSON array, no other text
5. COMPLETENESS IS CRITICAL — scan every corner of the drawing, every detail box, every callout
6. If a pump has 10 I/O points in the library, output all 10 — do not summarize or reduce
7. Do NOT stop early — process the ENTIRE drawing before returning results

${template === 'dar' ? '\nProject uses Dar Al-Handasah naming: SPS (sewage), WPS (water), IPS (irrigation)' : ''}${buildCorrectionHints()}`;

  return { systemPrompt, userPrompt };
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseClaudeResponse(responseText, allowEmpty = false) {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      if (allowEmpty) return [];
      throw new Error('No JSON array found in response');
    }

    const instruments = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(instruments)) {
      if (allowEmpty) return [];
      throw new Error('No instruments found in the drawing');
    }
    if (instruments.length === 0) {
      if (allowEmpty) return [];
      throw new Error('No instruments found in the drawing');
    }

    const validTypes = ['AI', 'DI', 'DO', 'AO', 'COM'];
    const processedInstruments = [];

    instruments.forEach((instrument, index) => {
      if (!instrument.tag && !instrument.description) return;

      const tag = normalizeTag(instrument.tag || `POINT-${index + 1}`);
      let signalType = instrument.signalType?.toUpperCase() || null;
      let confidenceAdjust = 0;
      if (!signalType || !validTypes.includes(signalType)) {
        signalType = inferSignalType(tag, instrument.description || '');
        confidenceAdjust = -0.15; // Lower confidence when signal type was inferred
      }

      const description = (instrument.description || 'Unknown').toUpperCase().trim();
      const equipment = (instrument.equipment || '').toUpperCase().trim();
      const rawConfidence = typeof instrument.confidence === 'number' ? instrument.confidence : 0.85;

      processedInstruments.push({
        tag,
        signalType,
        description,
        location: instrument.location || '',
        equipment,
        equipmentId: instrument.equipmentId || '',
        sourceFile: instrument.sourceFile || '',
        isAlarm: instrument.isAlarm || false,
        confidence: Math.max(0, Math.min(1, rawConfidence + confidenceAdjust)),
      });
    });

    if (processedInstruments.length === 0) {
      if (allowEmpty) return [];
      throw new Error('No valid instruments after parsing');
    }

    console.log(`Successfully parsed ${processedInstruments.length} I/O points`);
    return processedInstruments;
  } catch (error) {
    if (allowEmpty) return [];
    console.error('Failed to parse response:', error);
    throw new Error('Failed to parse instrument data. Please try again.');
  }
}

/**
 * Remove exact duplicate instruments (same tag + signalType + description)
 * Keeps the first occurrence (or the one with higher confidence)
 */
function deduplicateInstruments(instruments) {
  const seen = new Map();
  const result = [];

  for (const inst of instruments) {
    const key = `${inst.tag}|${inst.signalType}|${inst.description}`;
    if (seen.has(key)) {
      const existing = seen.get(key);
      // Keep the one with higher confidence
      if ((inst.confidence || 0) > (existing.confidence || 0)) {
        const idx = result.indexOf(existing);
        result[idx] = inst;
        seen.set(key, inst);
      }
      console.log(`Deduplicated: ${inst.tag} (${inst.description})`);
      continue;
    }
    seen.set(key, inst);
    result.push(inst);
  }

  if (result.length < instruments.length) {
    console.log(`Deduplication removed ${instruments.length - result.length} duplicate(s)`);
  }
  return result;
}

/**
 * Validate extracted instruments against the IO library.
 * - Corrects descriptions to match canonical library text
 * - Flags missing I/O points for multi-point equipment
 * - Adjusts confidence for unmatched instruments
 */
function validateAgainstLibrary(instruments) {
  // Group instruments by equipmentId to check completeness
  const equipmentGroups = new Map();
  const validated = [];

  for (const inst of instruments) {
    // Try to find the library component for this instrument
    const tagPrefix = inst.tag.split('-')[0];
    const component = lookupComponent(tagPrefix);

    if (component) {
      // Check if this I/O point matches a library entry
      const matchingIO = component.ioPoints.find(io => {
        if (!io.ioTag) return false;
        const ioTagUpper = io.ioTag.toUpperCase();
        return tagPrefix === ioTagUpper || inst.tag.toUpperCase().startsWith(ioTagUpper);
      });

      // If description differs from library, use canonical version
      if (matchingIO) {
        const canonicalDesc = matchingIO.description.toUpperCase().trim();
        if (inst.description !== canonicalDesc) {
          console.log(`Library correction: "${inst.description}" → "${canonicalDesc}" for ${inst.tag}`);
          inst.description = canonicalDesc;
        }
      }
    }

    // Track equipment groups for completeness check
    if (inst.equipmentId) {
      const groupKey = `${inst.equipment}|${inst.equipmentId}`;
      if (!equipmentGroups.has(groupKey)) {
        equipmentGroups.set(groupKey, []);
      }
      equipmentGroups.get(groupKey).push(inst);
    }

    validated.push(inst);
  }

  // Check completeness for multi-point equipment
  for (const [groupKey, groupInsts] of equipmentGroups) {
    const equipment = groupInsts[0].equipment;
    if (!equipment) continue;

    // Find matching library component
    const component = IO_LIBRARY.find(c => {
      const compName = c.componentTag.toUpperCase();
      return compName.includes(equipment.toUpperCase()) || equipment.toUpperCase().includes(compName.split('(')[0].trim());
    });

    if (component && component.ioPoints.length > 1) {
      const expectedCount = component.ioPoints.length;
      const actualCount = groupInsts.length;
      if (actualCount < expectedCount) {
        console.warn(
          `Incomplete extraction: ${equipment} ${groupInsts[0].equipmentId} has ${actualCount}/${expectedCount} I/O points`
        );
        // Reduce confidence for incomplete groups
        groupInsts.forEach(inst => {
          inst.confidence = Math.min(inst.confidence || 0.8, 0.7);
        });
      }
    }
  }

  return validated;
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
