/**
 * Module-level store for passing File objects between pages.
 * File objects can't be serialized to localStorage or navigation state,
 * so we hold them in memory here.
 */

let storedFiles = [];

export function storeFiles(files) {
  storedFiles = [...files];
}

export function getStoredFiles() {
  return storedFiles;
}

export function clearStoredFiles() {
  storedFiles = [];
}
