/**
 * LocalStorage utilities for persisting analysis data
 */

const STORAGE_KEY = 'instrumap_current_analysis';

/**
 * Save analysis data to localStorage
 */
export function saveAnalysisData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save analysis data:', error);
    return false;
  }
}

/**
 * Get analysis data from localStorage
 */
export function getAnalysisData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get analysis data:', error);
    return null;
  }
}

/**
 * Clear analysis data from localStorage
 */
export function clearAnalysisData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear analysis data:', error);
    return false;
  }
}

/**
 * Check if analysis data exists
 */
export function hasAnalysisData() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ─── Correction Memory ────────────────────────────────────────────────────────

const CORRECTIONS_KEY = 'instrumap_corrections';
const MAX_CORRECTIONS = 200;

/**
 * Log a user correction for future prompt hints
 */
export function logCorrection(originalValue, correctedValue, field, tag) {
  try {
    const corrections = getCorrections();
    corrections.push({
      field,
      tag,
      original: originalValue,
      corrected: correctedValue,
      timestamp: Date.now(),
    });
    // Keep only the most recent corrections
    const trimmed = corrections.slice(-MAX_CORRECTIONS);
    localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('Failed to log correction:', error);
  }
}

/**
 * Get all stored corrections
 */
export function getCorrections() {
  try {
    const data = localStorage.getItem(CORRECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Build correction hints for the prompt based on recurring patterns
 */
export function buildCorrectionHints() {
  const corrections = getCorrections();
  if (corrections.length < 3) return '';

  // Find recurring signal type corrections (same original → same corrected, 2+ times)
  const signalPatterns = {};
  corrections
    .filter(c => c.field === 'signalType')
    .forEach(c => {
      const key = `${c.original}→${c.corrected}`;
      signalPatterns[key] = (signalPatterns[key] || 0) + 1;
    });

  const hints = [];
  for (const [pattern, count] of Object.entries(signalPatterns)) {
    if (count >= 2) {
      const [from, to] = pattern.split('→');
      hints.push(`- Signal type "${from}" is frequently corrected to "${to}" by the user`);
    }
  }

  // Find recurring description corrections
  const descPatterns = {};
  corrections
    .filter(c => c.field === 'description')
    .forEach(c => {
      const key = `${c.original}→${c.corrected}`;
      descPatterns[key] = (descPatterns[key] || 0) + 1;
    });

  for (const [pattern, count] of Object.entries(descPatterns)) {
    if (count >= 2) {
      const [from, to] = pattern.split('→');
      hints.push(`- Description "${from}" should be "${to}"`);
    }
  }

  if (hints.length === 0) return '';

  return `\n## LEARNED CORRECTIONS (from user feedback)\n${hints.join('\n')}`;
}
