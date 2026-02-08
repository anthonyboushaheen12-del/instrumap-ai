import { buildLibraryPrompt, validateIOPoint, getEquipmentAliases, isSingleLoopInstrument, getComponentIO } from './instrumentLibrary';

/**
 * Analyzes a P&ID drawing file using OpenRouter, Gemini, or Claude API
 * @param {File} file - The P&ID file to analyze
 * @param {string} template - The template type ('isa-5.1', 'iec-62443', 'generic', 'dar', 'custom')
 * @returns {Promise<Array>} Array of extracted instruments
 */
export async function analyzeDrawing(file, template = 'isa-5.1') {
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!openrouterKey && !geminiKey && !anthropicKey) {
    throw new Error('No API key found. Please add VITE_OPENROUTER_API_KEY, VITE_GEMINI_API_KEY, or VITE_ANTHROPIC_API_KEY to your .env file');
  }

  const base64 = await fileToBase64(file);
  const mediaType = getMediaType(file.type);
  const prompt = buildPrompt(template);
  const isPdf = file.type === 'application/pdf';

  // Priority: Claude direct (best PDF support) > OpenRouter > Gemini
  if (anthropicKey) {
    return analyzeWithClaude(base64, mediaType, prompt, anthropicKey, isPdf);
  } else if (openrouterKey) {
    return analyzeWithOpenRouter(base64, mediaType, prompt, openrouterKey, isPdf);
  } else {
    return analyzeWithGemini(base64, mediaType, prompt, geminiKey);
  }
}

/**
 * Analyze drawing using OpenRouter API (supports PDFs via Claude)
 */
async function analyzeWithOpenRouter(base64, mediaType, prompt, apiKey, isPdf) {
  try {
    // Use Claude 3.5 Sonnet via OpenRouter - it has good vision and PDF support
    const model = 'anthropic/claude-3.5-sonnet';

    console.log('Sending to OpenRouter:', { model, mediaType, isPdf });

    // OpenRouter with Claude supports PDFs using the file format
    let content;
    if (isPdf) {
      // For PDFs, use file type with base64
      content = [
        {
          type: 'file',
          file: {
            filename: 'drawing.pdf',
            file_data: `data:${mediaType};base64,${base64}`,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ];
    } else {
      // For images, use image_url format
      content = [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mediaType};base64,${base64}`,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ];
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'InstruMap AI',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenRouter response:', data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze drawing with OpenRouter');
    }

    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      console.error('No content in response:', data);
      throw new Error('No response content from OpenRouter');
    }

    console.log('OpenRouter content:', responseContent.substring(0, 500));

    const instruments = parseClaudeResponse(responseContent);
    return instruments;
  } catch (error) {
    console.error('OpenRouter analysis error:', error);
    throw error;
  }
}

/**
 * Analyze drawing using Google Gemini API
 */
async function analyzeWithGemini(base64, mediaType, prompt, apiKey) {
  try {
    const model = 'gemini-2.0-flash';

    console.log('Sending to Gemini:', { model, mediaType, promptLength: prompt.length });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType,
                    data: base64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const data = await response.json();
    console.log('Gemini response:', data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze drawing with Gemini');
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('No content in response:', data);
      throw new Error('No response content from Gemini');
    }

    console.log('Gemini content:', content.substring(0, 500));

    const instruments = parseClaudeResponse(content);
    return instruments;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
}

/**
 * Analyze drawing using Anthropic Claude API
 */
async function analyzeWithClaude(base64, mediaType, prompt, apiKey, isPdf) {
  try {
    console.log('Sending to Claude:', { mediaType, isPdf });

    // Build content based on file type
    let fileContent;
    if (isPdf) {
      // For PDFs, use document type
      fileContent = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        },
      };
    } else {
      // For images, use image type
      fileContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        },
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              fileContent,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      throw new Error(error.error?.message || 'Failed to analyze drawing with Claude');
    }

    const data = await response.json();
    console.log('Claude response received');
    const content = data.content[0].text;
    const instruments = parseClaudeResponse(content);

    return instruments;
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw error;
  }
}

/**
 * Converts a file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the appropriate media type for Claude API
 */
function getMediaType(fileType) {
  if (fileType === 'application/pdf') return 'application/pdf';
  if (fileType.startsWith('image/')) return fileType;
  return 'application/pdf';
}

/**
 * Builds the analysis prompt based on template - LIBRARY-BASED EXTRACTION
 */
function buildPrompt(template) {
  let aliasList = '';
  try {
    const aliases = getEquipmentAliases();
    aliasList = Object.entries(aliases)
      .filter(([alias]) => alias.length <= 30) // Only show reasonable aliases
      .slice(0, 20) // Limit to top 20
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

## EXAMPLES

Example 1: Single-loop instrument "LIT-101" found in drawing:
\`\`\`json
[
  {"tag": "LIT-101", "signalType": "AI", "description": "WATER LEVEL", "location": "SUMP PIT", "equipment": "LEVEL TRANSMITTER", "isAlarm": false}
]
\`\`\`

Example 2: Multi-point equipment "P-WPS-01" (VFD Pump) found in drawing:
\`\`\`json
[
  {"tag": "HSR-WPS-01", "signalType": "DO", "description": "START", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false},
  {"tag": "HSS-WPS-01", "signalType": "DO", "description": "STOP", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false},
  {"tag": "HS-WPS-01", "signalType": "DO", "description": "DRIVE ON/OFF", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false},
  {"tag": "SC-WPS-01", "signalType": "AO", "description": "SPEED CONTROL", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false},
  {"tag": "TI-WPS-01", "signalType": "AI", "description": "TEMPERATURE SENSOR READING", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false},
  {"tag": "VI-WPS-01", "signalType": "AI", "description": "VIBRATION SENSOR READING", "location": "WET PIT", "equipment": "VFD PUMP", "isAlarm": false}
]
\`\`\`

## CRITICAL RULES

1. **USE DESCRIPTIONS EXACTLY** - Copy from library, don't modify
2. **OUTPUT ALL SIGNALS** - When you find equipment, output ALL its I/O points from the library
3. **TAG FORMAT** - Single-loop instruments keep original tag; multi-point equipment append ID to I/O tag
4. **MATCH EQUIPMENT** - Use library equipment names exactly as shown

Return ONLY the JSON array.`;

  if (template === 'dar') {
    return basePrompt + `

## DAR AL-HANDASAH PROJECT - Additional Notes

Facility types: SPS (sewage), WPS (water), IPS (irrigation)
Use the MASTER LIBRARY above exactly as written.`;
  }

  if (template === 'isa-5.1') {
    return basePrompt + `

## ISA-5.1 - Additional Notes

Follow ISA-5.1 tag naming conventions.
Use the MASTER LIBRARY above exactly as written.`;
  }

  return basePrompt;
}

/**
 * Parses Claude's response and extracts instrument data with library validation
 */
function parseClaudeResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const instruments = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(instruments) || instruments.length === 0) {
      throw new Error('No instruments found in the drawing');
    }

    const validTypes = ['AI', 'DI', 'DO', 'AO'];
    const processedInstruments = [];
    const validationErrors = [];
    const aliases = getEquipmentAliases();

    instruments.forEach((instrument, index) => {
      if (!instrument.tag && !instrument.description) {
        return;
      }

      const tag = normalizeTag(instrument.tag || `POINT-${index + 1}`);
      let signalType = instrument.signalType ? instrument.signalType.toUpperCase() : null;

      if (!signalType || !validTypes.includes(signalType)) {
        signalType = inferSignalType(tag, instrument.description || '');
      }

      let description = instrument.description || 'Unknown';
      description = description.toUpperCase().trim();

      // Extract equipment type
      let equipmentType = (instrument.equipment || '').toUpperCase().trim();
      
      // Try to match equipment using library
      if (!equipmentType) {
        // Try to infer from tag
        const componentMatch = getComponentIO(tag);
        if (componentMatch) {
          equipmentType = componentMatch.equipment.toUpperCase();
        }
      }

      // Validate against library if equipment type is provided
      let isValid = true;
      let validationResult = null;
      
      if (equipmentType) {
        // Extract I/O tag from full tag (for multi-point equipment)
        let ioTag = tag;
        if (tag.includes('-')) {
          const parts = tag.split('-');
          // For multi-point, first part is usually the I/O tag
          // For single-loop, the whole tag is the component tag
          const componentMatch = getComponentIO(parts[0]);
          if (componentMatch && !isSingleLoopInstrument(parts[0])) {
            ioTag = parts[0];
          }
        }
        
        validationResult = validateIOPoint(equipmentType, ioTag, description);
        
        if (!validationResult.valid) {
          isValid = false;
          validationErrors.push({
            tag,
            equipment: equipmentType,
            error: validationResult.reason
          });
          
          // Try to find closest match
          const componentMatch = getComponentIO(tag);
          if (componentMatch) {
            const matchingIO = componentMatch.ioPoints.find(io => 
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
          // Use validated equipment name
          equipmentType = validationResult.component.equipment.toUpperCase();
        }
      }

      // Only add if valid or if we couldn't validate (no equipment type provided)
      if (isValid || !equipmentType) {
        processedInstruments.push({
          tag,
          signalType,
          description,
          location: instrument.location || '',
          equipment: equipmentType || instrument.equipment || '',
          isAlarm: instrument.isAlarm !== undefined ? instrument.isAlarm : (validationResult?.ioPoint?.isAlarm || false),
        });
      }
    });

    // Log validation warnings
    if (validationErrors.length > 0) {
      console.warn(`Validation warnings (${validationErrors.length} items):`, validationErrors);
    }

    if (processedInstruments.length === 0) {
      throw new Error('No valid instruments after validation');
    }

    console.log(`Successfully parsed ${processedInstruments.length} I/O points${validationErrors.length > 0 ? ` (${validationErrors.length} warnings)` : ''}`);
    return processedInstruments;

  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    throw new Error('Failed to parse instrument data from analysis. Please try again.');
  }
}

/**
 * Normalizes tag names
 */
function normalizeTag(tag) {
  let normalized = tag.trim().toUpperCase();
  normalized = normalized.replace(/[^A-Z0-9\-_/.]/g, '');
  return normalized;
}

/**
 * Improved signal type inference based on tag AND description
 */
function inferSignalType(tag, description) {
  const tagUpper = tag.toUpperCase();
  const descUpper = description.toUpperCase();

  // Check description first for more accuracy
  if (descUpper.includes('START') || descUpper.includes('STOP') || descUpper.includes('COMMAND')) {
    return 'DO';
  }
  if (descUpper.includes('STATUS') || descUpper.includes('FAULT') || descUpper.includes('ALARM') || descUpper.includes('MODE')) {
    return 'DI';
  }
  if (descUpper.includes('READING') || descUpper.includes('TRANSMITTER')) {
    return 'AI';
  }
  if (descUpper.includes('SPEED') && descUpper.includes('COMMAND')) {
    return 'AO';
  }

  // Tag-based inference
  if (tagUpper.match(/[FPLT]I?T/) || tagUpper.match(/A[IT]/)) {
    return 'AI';
  }
  if (tagUpper.match(/LS[HL]{0,2}/) || tagUpper.match(/[FPLTA]S[HL]/) || tagUpper.match(/Y[IA]/) || tagUpper.match(/ZS/)) {
    return 'DI';
  }
  if (tagUpper.match(/[FPLT]C?V/) || tagUpper.match(/VFD|VSD/) || tagUpper.match(/[FPLT]Y/)) {
    return 'AO';
  }
  if (tagUpper.match(/X[VY]/) || tagUpper.match(/SOV/) || tagUpper.match(/^M-/)) {
    return 'DO';
  }

  return 'DI'; // Default to DI for unknown
}

/**
 * Mock function for development - Uses CSV library to generate realistic mock data
 */
export function mockAnalyzeDrawing(file, template = 'isa-5.1') {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock data based on library entries
      const mockInstruments = [];
      
      // Get some common equipment from library
      const commonEquipment = [
        { key: 'LIT', location: 'SUMP PIT' },
        { key: 'LSLL', location: 'SUMP PIT' },
        { key: 'LSL', location: 'SUMP PIT' },
        { key: 'LSH', location: 'SUMP PIT' },
        { key: 'LSHH', location: 'SUMP PIT' },
        { key: 'HS-DETAIL SP', location: 'SUMP PIT', id: 'SPS2.1' },
        { key: 'ODOR CONTROL UNIT LCP', location: 'PUMP STATION', id: 'OCU' },
        { key: 'AIT', location: 'PUMP STATION', id: 'H2S' },
        { key: 'UPS', location: 'PUMP STATION', id: 'UPS' },
      ];
      
      for (const eq of commonEquipment) {
        const component = getComponentIO(eq.key);
        if (component) {
          const equipmentId = eq.id || '01';
          const isSingleLoop = isSingleLoopInstrument(eq.key);
          
          for (const io of component.ioPoints) {
            if (['AI', 'DI', 'DO', 'AO'].includes(io.ioType)) {
              let tag;
              if (isSingleLoop) {
                // For single-loop, use component tag format
                tag = `${eq.key}-${equipmentId}`;
              } else {
                // For multi-point, append equipment ID to I/O tag
                tag = `${io.ioTag}-${equipmentId}`;
              }
              
              mockInstruments.push({
                tag,
                signalType: io.ioType,
                description: io.signal,
                location: eq.location,
                equipment: component.equipment,
                isAlarm: io.isAlarm || false,
              });
            }
          }
        }
      }
      
      resolve(mockInstruments);
    }, 2500);
  });
}
