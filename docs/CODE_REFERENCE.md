# Code File Reference Guide

Quick reference guide for all code files in the InstruMap AI application.

## Entry Points

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/main.jsx` | Application entry point, React initialization | None (side effects) |
| `index.html` | HTML entry point | N/A |
| `src/App.jsx` | Root component, routing setup | `App` component |

## Core Utilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/utils/instrumentLibrary.js` | Equipment I/O library (CSV-based) | `instrumentLibrary`, `getComponentIO()`, `buildLibraryPrompt()`, `validateIOPoint()`, `isSingleLoopInstrument()`, `getEquipmentAliases()`, `normalizeKey()` |
| `src/utils/analyzeDrawing.js` | AI analysis engine (Claude/Gemini/OpenRouter) | `analyzeDrawing()`, `mockAnalyzeDrawing()` |
| `src/utils/exportToExcel.js` | Excel export functionality | `exportToExcelWithSummary()` |
| `src/utils/storage.js` | LocalStorage utilities | `saveAnalysisData()`, `getAnalysisData()`, `clearAnalysisData()` |

## Pages

| File | Purpose | Route | Key Features |
|------|---------|-------|--------------|
| `src/pages/HomePage.jsx` | File upload and analysis | `/` | File upload, P&ID details form, analysis trigger |
| `src/pages/ResultsPage.jsx` | Results display and export | `/results` | Editable table, add/delete tags, Excel export |
| `src/pages/EquipmentTemplatesPage.jsx` | Equipment templates reference | `/templates` | Template library display |

## Components

| File | Purpose | Props | Usage |
|------|---------|-------|-------|
| `src/components/Header.jsx` | App header with branding | None | Used in all pages |
| `src/components/Footer.jsx` | App footer | None | Used in all pages |
| `src/components/LoadingOverlay.jsx` | Loading overlay | `isLoading`, `message` | Shown during analysis |
| `src/components/SuccessToast.jsx` | Success notification | `message`, `onClose` | Shown after successful actions |

## Data Files

| File | Purpose | Format | Usage |
|------|---------|--------|-------|
| `src/data/io-library.csv` | Reference CSV library | CSV | Reference only (embedded in code) |

## Configuration

| File | Purpose | Key Settings |
|------|---------|--------------|
| `vite.config.js` | Vite build configuration | React plugin, CSV asset handling |
| `tailwind.config.js` | Tailwind CSS configuration | Theme, plugins |
| `postcss.config.js` | PostCSS configuration | Tailwind plugin |
| `package.json` | Dependencies and scripts | React, Vite, Tailwind, XLSX, etc. |
| `.env.example` | Environment variables template | API keys template |

## Styling

| File | Purpose | Contents |
|------|---------|----------|
| `src/index.css` | Global styles | Tailwind imports, custom CSS variables |

---

## Function Dependencies Map

### `analyzeDrawing.js` depends on:
- `instrumentLibrary.js` → `buildLibraryPrompt()`, `validateIOPoint()`, `getComponentIO()`, `isSingleLoopInstrument()`, `getEquipmentAliases()`

### `exportToExcel.js` depends on:
- `instrumentLibrary.js` → `getComponentIO()`, `normalizeKey()`

### `HomePage.jsx` depends on:
- `analyzeDrawing.js` → `analyzeDrawing()`
- `storage.js` → `saveAnalysisData()`

### `ResultsPage.jsx` depends on:
- `exportToExcel.js` → `exportToExcelWithSummary()`
- `storage.js` → `getAnalysisData()`, `clearAnalysisData()`

---

## Data Structures

### Instrument Object
```javascript
{
  tag: "LIT-101",
  signalType: "AI",
  description: "WATER LEVEL",
  location: "TANK-101",
  equipment: "LEVEL TRANSMITTER",
  isAlarm: false,
  source: "drawing.pdf" // optional, for multi-file
}
```

### Library Component Structure
```javascript
{
  category: "LIBRARY",
  equipment: "LEVEL TRANSMITTER",
  ioPoints: [
    { ioTag: "LI", signal: "WATER LEVEL", ioType: "AI", isAlarm: false }
  ],
  sourceId: "LIT"
}
```

### Analysis Data Structure
```javascript
{
  filename: "drawing.pdf",
  multipleFiles: false,
  fileResults: [...],
  instruments: [...],
  template: "isa-5.1",
  timestamp: "2026-02-07T...",
  pidDetails: {
    projectName: "...",
    drawingNumber: "...",
    revision: "...",
    area: "...",
    equipmentList: "...",
    notes: "...",
    referenceFiles: [...]
  }
}
```

---

## Key Constants

### Signal Types
- `AI` - Analog Input
- `DI` - Digital Input
- `DO` - Digital Output
- `AO` - Analog Output

### Templates
- `isa-5.1` - ISA Generic template
- `dar-al-handasah` - Dar Al-Handasah template

### File Limits
- Max file size: 10MB
- Supported types: PDF, PNG, JPG, JPEG

---

## Storage Keys

| Key | Purpose | Data Type |
|-----|---------|-----------|
| `instrumap_current_analysis` | Current analysis results | Object |

---

## API Endpoints

### Anthropic Claude
- **URL**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514`

### OpenRouter
- **URL**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `anthropic/claude-3.5-sonnet`

### Google Gemini
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Model**: `gemini-2.0-flash`

---

## Common Patterns

### File Upload Pattern
```javascript
const handleFileSelect = (files) => {
  const validFiles = files.filter(file => 
    ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) &&
    file.size <= 10 * 1024 * 1024
  );
  setFiles(prev => [...prev, ...validFiles]);
};
```

### Analysis Pattern
```javascript
const instruments = await analyzeDrawing(file, template);
const validated = instruments.filter(inst => inst.tag && inst.signalType);
saveAnalysisData({ instruments: validated, ... });
```

### Export Pattern
```javascript
const summary = {
  total: instruments.length,
  byType: { AI: 0, DI: 0, DO: 0, AO: 0 }
};
exportToExcelWithSummary(instruments, filename, summary, pidDetails);
```

---

## Quick Debug Checklist

- [ ] Check console for "Library loaded: X components" message
- [ ] Verify API keys in `.env` file
- [ ] Check file format and size limits
- [ ] Verify all imports are correct
- [ ] Check localStorage for saved data
- [ ] Verify React Router navigation
- [ ] Check network tab for API calls
- [ ] Verify Excel export file format

---

## File Size Reference

| File | Approx. Size | Purpose |
|------|--------------|---------|
| `instrumentLibrary.js` | ~15KB | Library definitions (embedded CSV) |
| `analyzeDrawing.js` | ~8KB | AI integration |
| `exportToExcel.js` | ~4KB | Excel generation |
| `HomePage.jsx` | ~12KB | Upload page |
| `ResultsPage.jsx` | ~10KB | Results page |

---

## Version History

- **v1.0**: Initial implementation with CSV library integration
- **v1.1**: Added validation layer and equipment aliases
- **v1.2**: Multi-file support and deduplication
- **v1.3**: P&ID details form and reference files

---

For detailed documentation, see `CODE_DOCUMENTATION.md`.
