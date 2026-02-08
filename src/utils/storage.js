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
