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

  const { images, prompt } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  try {
    // Build the message content — one image block per page, then the prompt
    const content = [];

    images.forEach((imageBase64, index) => {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg', // We convert everything to JPEG for smaller file size
          data: imageBase64,
        },
      });

      // Label each page if there are multiple
      if (images.length > 1) {
        content.push({
          type: 'text',
          text: `[Page ${index + 1} of ${images.length}]`,
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
        messages: [{ role: 'user', content }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Claude API error',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
