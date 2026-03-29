/**
 * api/analyze.js — Vercel Serverless Function
 *
 * This file runs on Vercel's servers, NOT in the browser.
 * The API key lives here and is NEVER sent to the user.
 *
 * How it works:
 * 1. Your frontend sends images (as base64) to /api/analyze
 * 2. This function adds the secret API key and forwards to Claude
 * 3. Returns Claude's response back to your frontend
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from Vercel's environment (server-side only, never exposed)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.',
    });
  }

  const { images, prompt, systemPrompt } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  try {
    // Build the message content — one image block per page, then the prompt
    const content = [];

    images.forEach((image, index) => {
      // Support both old format (string) and new format ({ data, mediaType })
      const imageData = typeof image === 'string' ? image : image.data;
      const mediaType = typeof image === 'string' ? 'image/jpeg' : (image.mediaType || 'image/png');

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageData,
        },
      });

      // Label each image if there are multiple (pages or tiles)
      if (images.length > 1) {
        const label = (typeof image === 'object' && image.label)
          ? `[Tile: ${image.label} — image ${index + 1} of ${images.length}]`
          : `[Page ${index + 1} of ${images.length}]`;
        content.push({
          type: 'text',
          text: label,
        });
      }
    });

    // Add the extraction prompt at the end
    content.push({
      type: 'text',
      text: prompt,
    });

    // Call Claude API — key stays here on the server
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 16000,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content }],
        tools: [{
          name: 'submit_instruments',
          description: 'Submit the extracted instrument I/O list from the P&ID drawing',
          input_schema: {
            type: 'object',
            properties: {
              instruments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tag: { type: 'string', description: 'Formatted instrument tag' },
                    signalType: { type: 'string', enum: ['AI', 'DI', 'DO', 'AO', 'COM'] },
                    description: { type: 'string', description: 'Signal description from library' },
                    location: { type: 'string', description: 'Area or system from drawing' },
                    equipment: { type: 'string', description: 'Component name from library' },
                    equipmentId: { type: 'string', description: 'Equipment number from drawing' },
                    sourceFile: { type: 'string' },
                    confidence: { type: 'number', description: '0.0-1.0 confidence rating' }
                  },
                  required: ['tag', 'signalType', 'description']
                }
              }
            },
            required: ['instruments']
          }
        }],
        tool_choice: { type: 'tool', name: 'submit_instruments' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Claude API error',
      });
    }

    // Extract tool_use result and convert to text format for backward compatibility
    const toolUseBlock = data.content?.find(block => block.type === 'tool_use');
    if (toolUseBlock && toolUseBlock.input?.instruments) {
      // Return as a text content block containing the JSON array
      return res.status(200).json({
        ...data,
        content: [{
          type: 'text',
          text: JSON.stringify(toolUseBlock.input.instruments),
        }],
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
