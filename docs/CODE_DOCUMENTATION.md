# Code Documentation

Complete documentation of all code files in the InstruMap AI application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Files](#core-files)
3. [Utility Modules](#utility-modules)
4. [Page Components](#page-components)
5. [UI Components](#ui-components)
6. [Data Files](#data-files)
7. [Configuration Files](#configuration-files)

---

## Project Structure

```
IO AI/
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Root component with routing
│   ├── index.css                # Global styles and Tailwind imports
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingOverlay.jsx
│   │   └── SuccessToast.jsx
│   ├── pages/                   # Main application pages
│   │   ├── HomePage.jsx
│   │   ├── ResultsPage.jsx
│   │   └── EquipmentTemplatesPage.jsx
│   ├── utils/                   # Core business logic
│   │   ├── instrumentLibrary.js # Equipment I/O library (CSV-based)
│   │   ├── analyzeDrawing.js    # AI analysis engine
│   │   ├── exportToExcel.js     # Excel export functionality
│   │   └── storage.js           # LocalStorage utilities
│   └── data/
│       └── io-library.csv       # Reference CSV (embedded in code)
├── public/                      # Static assets
│   └── vite.svg
├── index.html                   # HTML entry point
├── vite.config.js               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── package.json                 # Dependencies and scripts
└── .env.example                 # Environment variables template
```

---

## Core Files

### `src/main.jsx`
**Purpose**: Application entry point that initializes React and renders the root component.

**Key Code**:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root not found in HTML');
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  // Error display logic...
}
```

**Features**:
- Error handling for missing root element
- StrictMode for development warnings
- Console logging for debugging

---

### `src/App.jsx`
**Purpose**: Root component that sets up routing and error boundaries.

**Key Code**:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Component } from 'react';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import EquipmentTemplatesPage from './pages/EquipmentTemplatesPage';

class ErrorBoundary extends Component {
  // Catches React rendering errors
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/templates" element={<EquipmentTemplatesPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

**Routes**:
- `/` - Home page (file upload)
- `/results` - Results page (I/O list review and export)
- `/templates` - Equipment templates reference page

**Error Handling**:
- React ErrorBoundary catches component errors
- Displays user-friendly error messages

---

## Utility Modules

### `src/utils/instrumentLibrary.js`
**Purpose**: Core library that defines all equipment types and their I/O points. This is the master reference for the entire application.

**Key Functions**:

#### `buildLibraryFromCsv(csvText)`
Parses CSV data and builds the equipment library object structure.

**Code Structure**:
```javascript
function buildLibraryFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const library = {};
  let lastComponent = '';
  
  rows.forEach((row, index) => {
    // Skip header row
    if (index === 0) return;
    
    // Extract component, I/O tag, description, and I/O type
    const componentRaw = (row[0] || '').trim();
    const ioTag = (row[1] || '').trim();
    const description = (row[2] || '').trim();
    const ioType = normalizeIoType(row[3] || '');
    
    // Handle multi-line component names (e.g., "HS-DETAIL SP\n(SUMP PIT PUMP)")
    const { baseName, equipmentName } = splitComponentName(activeComponent);
    
    // Build library structure
    library[primaryKey] = {
      category: 'LIBRARY',
      equipment: equipmentName || baseName,
      ioPoints: [
        { ioTag, signal: description, ioType, isAlarm: isAlarmSignal(...) }
      ],
      sourceId: primaryKey
    };
  });
  
  return library;
}
```

**Library Structure**:
```javascript
instrumentLibrary = {
  'LIT': {
    category: 'LIBRARY',
    equipment: 'LEVEL TRANSMITTER',
    ioPoints: [
      { ioTag: 'LI', signal: 'WATER LEVEL', ioType: 'AI', isAlarm: false }
    ],
    sourceId: 'LIT'
  },
  'HS-DETAIL SP': {
    category: 'LIBRARY',
    equipment: 'SUMP PIT PUMP',
    ioPoints: [
      { ioTag: 'HI', signal: 'AUTO/MANUAL INDICATION', ioType: 'DI', isAlarm: false },
      { ioTag: 'LAHH', signal: 'HIGH HIGH LEVEL ALARM', ioType: 'DI', isAlarm: true },
      // ... more I/O points
    ],
    sourceId: 'HS-DETAIL SP'
  }
  // ... more equipment types
}
```

#### `getComponentIO(componentTag)`
Looks up I/O points for a component tag from the library.

**Usage**:
```javascript
const component = getComponentIO('LIT');
// Returns: { equipment: 'LEVEL TRANSMITTER', ioPoints: [...] }

const component = getComponentIO('HS-DETAIL SP');
// Returns: { equipment: 'SUMP PIT PUMP', ioPoints: [...] }
```

#### `buildLibraryPrompt()`
Generates the prompt text sent to AI models, dynamically built from the library.

**Output Format**:
```markdown
## MASTER I/O LIBRARY (USE EXACTLY AS WRITTEN)

### SINGLE-LOOP INSTRUMENTS (Keep original tag from drawing)
| Component Tag | I/O Tag | I/O Type | Description (USE EXACTLY) |
|---------------|---------|----------|---------------------------|
| LIT | LI | AI | WATER LEVEL |
| PIT | PI | AI | PRESSURE |

### MULTI-POINT EQUIPMENT (Append equipment ID to I/O tag)
#### VFD PUMP (HS-DETAIL P1)
| I/O Tag | I/O Type | Description (USE EXACTLY) |
|---------|----------|---------------------------|
| HSR | DO | START |
| HSS | DO | STOP |
| ...
```

#### `validateIOPoint(equipmentType, ioTag, description)`
Validates extracted I/O points against the library to prevent hallucinations.

**Returns**:
```javascript
{
  valid: true/false,
  reason: 'Error message if invalid',
  ioPoint: { ioTag, signal, ioType, isAlarm },
  component: { equipment, ioPoints, ... }
}
```

#### `getEquipmentAliases()`
Generates alias mappings for better equipment matching (e.g., "P-*" → "VFD PUMP").

**Exported Functions**:
- `normalizeKey(value)` - Normalizes strings to library keys
- `isSingleLoopInstrument(componentKey)` - Checks if component has single I/O point
- `getComponentIO(componentTag)` - Gets I/O points for a component
- `getEquipmentAliases()` - Gets equipment alias mappings
- `validateIOPoint(equipmentType, ioTag, description)` - Validates I/O points
- `buildLibraryPrompt()` - Generates AI prompt from library
- `getIOTypeSummary()` - Gets summary statistics
- `getComponentsByCategory(category)` - Filters by category

**File Location**: `src/utils/instrumentLibrary.js`

---

### `src/utils/analyzeDrawing.js`
**Purpose**: Handles AI analysis of P&ID drawings using Claude, Gemini, or OpenRouter APIs.

**Key Functions**:

#### `analyzeDrawing(file, template)`
Main function that analyzes a P&ID file and returns extracted instruments.

**Flow**:
1. Converts file to base64
2. Determines media type (PDF vs image)
3. Builds prompt using `buildLibraryPrompt()` from library
4. Calls appropriate API (Claude > OpenRouter > Gemini)
5. Parses response and validates against library
6. Returns array of instruments

**Code Structure**:
```javascript
export async function analyzeDrawing(file, template = 'isa-5.1') {
  const base64 = await fileToBase64(file);
  const mediaType = getMediaType(file.type);
  const prompt = buildPrompt(template); // Uses buildLibraryPrompt()
  const isPdf = file.type === 'application/pdf';
  
  // Priority: Claude direct > OpenRouter > Gemini
  if (anthropicKey) {
    return analyzeWithClaude(base64, mediaType, prompt, anthropicKey, isPdf);
  } else if (openrouterKey) {
    return analyzeWithOpenRouter(base64, mediaType, prompt, openrouterKey, isPdf);
  } else {
    return analyzeWithGemini(base64, mediaType, prompt, geminiKey);
  }
}
```

#### `buildPrompt(template)`
Builds the analysis prompt with library content and instructions.

**Key Features**:
- Includes equipment alias mappings
- Separates single-loop vs multi-point equipment instructions
- Provides examples for both types
- Template-specific notes (DAR, ISA-5.1)

#### `parseClaudeResponse(responseText)`
Parses AI response and validates against library.

**Validation Process**:
1. Extracts JSON array from response
2. For each instrument:
   - Normalizes tag
   - Validates signal type (AI/DI/DO/AO)
   - Validates against library using `validateIOPoint()`
   - Falls back to inference if validation fails
3. Returns validated instruments array

**Code Structure**:
```javascript
function parseClaudeResponse(responseText) {
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  const instruments = JSON.parse(jsonMatch[0]);
  
  instruments.forEach((instrument) => {
    // Validate against library
    const validationResult = validateIOPoint(
      instrument.equipment,
      ioTag,
      instrument.description
    );
    
    if (validationResult.valid) {
      // Use validated data
      processedInstruments.push({
        tag,
        signalType: validationResult.ioPoint.ioType,
        description: validationResult.ioPoint.signal,
        equipment: validationResult.component.equipment,
        isAlarm: validationResult.ioPoint.isAlarm
      });
    }
  });
  
  return processedInstruments;
}
```

#### `mockAnalyzeDrawing(file, template)`
Generates mock data for development/testing using the library.

**File Location**: `src/utils/analyzeDrawing.js`

**Dependencies**:
- `instrumentLibrary.js` - For `buildLibraryPrompt()`, `getComponentIO()`, `isSingleLoopInstrument()`, `validateIOPoint()`, `getEquipmentAliases()`

---

### `src/utils/exportToExcel.js`
**Purpose**: Exports I/O list data to Excel format with summary sheets.

**Key Functions**:

#### `exportToExcelWithSummary(instruments, filename, summary, pidDetails)`
Main export function that creates Excel workbook with I/O list and summary sheets.

**Excel Structure**:
1. **IO List Sheet**:
   - Columns: SN, LOCATION, EQUIPMENT/INSTRUMENT, SIGNAL, IO TYPE, ALARM
   - Data rows from instruments array
   - Column width optimization

2. **Summary Sheet**:
   - P&ID metadata (project name, drawing number, revision, area)
   - File information
   - Signal type breakdown (AI, DI, DO, AO counts)
   - Equipment list
   - Notes

**Code Structure**:
```javascript
export function exportToExcelWithSummary(instruments, filename, summary, pidDetails = null) {
  const workbook = XLSX.utils.book_new();
  
  // Create I/O List worksheet
  const ioListData = [
    ['SN', 'LOCATION', 'EQUIPMENT/INSTRUMENT', 'SIGNAL', 'IO TYPE', 'ALARM'],
    ...instruments.map((instrument, index) => [
      index + 1,
      extractLocation(instrument.tag, instrument.location, instrument.equipment),
      extractEquipment(instrument.tag, instrument.equipment, instrument.description),
      instrument.description.toUpperCase(),
      instrument.signalType,
      instrument.isAlarm ? 'X' : ''
    ])
  ];
  
  // Create Summary worksheet
  const summaryData = [
    ['P&ID Analysis Summary'],
    // ... metadata, statistics, etc.
  ];
  
  // Write and download
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  // ... download logic
}
```

#### `extractLocation(tag, providedLocation, equipmentType)`
Derives location from tag/equipment using library when possible.

**Priority**:
1. Provided location (if available)
2. Equipment type inference (from library)
3. Tag-based heuristics (fallback)

#### `extractEquipment(tag, providedEquipment, description)`
Derives equipment type using library lookup.

**Priority**:
1. Provided equipment (if available)
2. Library lookup via `getComponentIO()`
3. Tag prefix matching
4. Heuristic fallback

**File Location**: `src/utils/exportToExcel.js`

**Dependencies**:
- `instrumentLibrary.js` - For `getComponentIO()`, `normalizeKey()`
- `xlsx` library - For Excel generation

---

### `src/utils/storage.js`
**Purpose**: LocalStorage utilities for persisting analysis data between page navigations.

**Key Functions**:

#### `saveAnalysisData(data)`
Saves analysis results to localStorage.

**Data Structure**:
```javascript
{
  filename: 'drawing.pdf',
  multipleFiles: false,
  fileResults: [{ filename, count, success, error }],
  instruments: [{ tag, signalType, description, location, equipment, isAlarm }],
  template: 'isa-5.1',
  timestamp: '2026-02-07T...',
  pidDetails: { projectName, drawingNumber, revision, area, equipmentList, notes, referenceFiles }
}
```

#### `getAnalysisData()`
Retrieves saved analysis data.

#### `clearAnalysisData()`
Clears saved data (called after navigation to results page).

**File Location**: `src/utils/storage.js`

**Storage Key**: `'instrumap_current_analysis'`

---

## Page Components

### `src/pages/HomePage.jsx`
**Purpose**: Main landing page where users upload P&ID files for analysis.

**Key Features**:

#### File Upload Area
- Drag-and-drop zone
- Click to browse
- File validation (type, size)
- Preview for image files
- Multi-file support

**Code Structure**:
```jsx
const handleFileSelect = (selectedFiles) => {
  const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  const validFiles = selectedFiles.filter(file => {
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
  });
  setFiles(prevFiles => [...prevFiles, ...validFiles]);
};
```

#### Analysis Flow
```jsx
const handleUploadAndAnalyze = async () => {
  setAnalyzing(true);
  
  for (let i = 0; i < files.length; i++) {
    const instruments = await analyzeDrawing(file, template);
    allInstruments.push(...instruments.map(inst => ({ ...inst, source: file.name })));
  }
  
  // Deduplicate instruments
  const deduplicatedInstruments = deduplicate(allInstruments);
  
  // Save and navigate
  saveAnalysisData({ instruments: deduplicatedInstruments, ... });
  navigate('/results', { state: analysisData });
};
```

#### P&ID Details Form
- Project name
- Drawing number
- Revision
- Area/Unit
- Equipment list (textarea)
- Reference files (PDF/DWG)

**File Location**: `src/pages/HomePage.jsx`

**Dependencies**:
- `analyzeDrawing.js` - For analysis
- `storage.js` - For saving data
- `mockAnalyzeDrawing.js` - For development mode

---

### `src/pages/ResultsPage.jsx`
**Purpose**: Displays analysis results in an editable table with export functionality.

**Key Features**:

#### Results Table
- Editable cells (click to edit)
- Signal type badges (color-coded)
- Delete rows
- Source file tracking (for multi-file)

**Code Structure**:
```jsx
const handleCellEdit = (index, field, value) => {
  const updated = [...instruments];
  updated[index][field] = value;
  setInstruments(updated);
};

// In render:
{editingCell === `${index}-tag` ? (
  <input
    value={instrument.tag}
    onChange={(e) => handleCellEdit(index, 'tag', e.target.value)}
    onBlur={() => setEditingCell(null)}
  />
) : (
  <span onClick={() => setEditingCell(`${index}-tag`)}>
    {instrument.tag}
  </span>
)}
```

#### Add Tag Form
- Tag input
- Signal type dropdown (AI/DI/DO/AO)
- Description input
- Insert button

#### Export Functionality
```jsx
const handleExport = () => {
  const summary = calculateSummary(instruments);
  exportToExcelWithSummary(instruments, data.filename, summary, data.pidDetails);
};
```

#### Summary Statistics
- Total tags count
- Breakdown by signal type (AI, DI, DO, AO)

**File Location**: `src/pages/ResultsPage.jsx`

**Dependencies**:
- `exportToExcel.js` - For Excel export
- `storage.js` - For retrieving saved data

---

### `src/pages/EquipmentTemplatesPage.jsx`
**Purpose**: Reference page showing standard I/O templates for common equipment types.

**Key Features**:
- Expandable equipment cards
- I/O point tables
- Signal type counts
- Category filtering

**Note**: Currently uses hardcoded templates. Could be updated to use the CSV library.

**File Location**: `src/pages/EquipmentTemplatesPage.jsx`

---

## UI Components

### `src/components/Header.jsx`
**Purpose**: Application header with branding and navigation.

**Features**:
- Logo/branding
- Navigation links
- Consistent styling

**File Location**: `src/components/Header.jsx`

---

### `src/components/Footer.jsx`
**Purpose**: Application footer with copyright and links.

**File Location**: `src/components/Footer.jsx`

---

### `src/components/LoadingOverlay.jsx`
**Purpose**: Full-screen loading overlay during analysis.

**Features**:
- Spinner animation
- Progress message
- Blocks user interaction

**File Location**: `src/components/LoadingOverlay.jsx`

---

### `src/components/SuccessToast.jsx`
**Purpose**: Success notification toast for completed actions.

**Features**:
- Auto-dismiss after delay
- Success message display
- Smooth animations

**File Location**: `src/components/SuccessToast.jsx`

---

## Data Files

### `src/data/io-library.csv`
**Purpose**: Reference CSV file containing the master equipment library.

**Structure**:
```csv
"COMPONENT TAG NUMBER",I/O TAG NUMBER,INSTRUMENT/EQUIPMENT TYPE,IO TYPE,
LSL,LAL,LEVEL SWITCH LOW,DI,
LIT,LI,WATER LEVEL,AI,
"HS-DETAIL SP
(SUMP PIT PUMP)",HI,AUTO/MANUAL INDICATION,DI,
...
```

**Note**: This file is for reference only. The actual library data is embedded in `instrumentLibrary.js` as a string constant to avoid import issues.

**File Location**: `src/data/io-library.csv`

---

## Configuration Files

### `vite.config.js`
**Purpose**: Vite build tool configuration.

**Configuration**:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.csv'],
})
```

**File Location**: `vite.config.js`

---

### `tailwind.config.js`
**Purpose**: Tailwind CSS configuration.

**File Location**: `tailwind.config.js`

---

### `package.json`
**Purpose**: Project dependencies and npm scripts.

**Key Dependencies**:
- `react` & `react-dom` - UI framework
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `xlsx` - Excel export
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework

**Scripts**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**File Location**: `package.json`

---

## Data Flow

### Analysis Flow
```
User uploads PDF/DWG
    ↓
HomePage.jsx → analyzeDrawing()
    ↓
analyzeDrawing.js → buildPrompt() → buildLibraryPrompt()
    ↓
AI API (Claude/Gemini/OpenRouter)
    ↓
parseClaudeResponse() → validateIOPoint()
    ↓
Validated instruments array
    ↓
saveAnalysisData() → localStorage
    ↓
Navigate to ResultsPage
    ↓
ResultsPage displays instruments
    ↓
User edits/adds/deletes
    ↓
exportToExcelWithSummary()
    ↓
Excel file download
```

### Library Usage Flow
```
Application starts
    ↓
instrumentLibrary.js loads
    ↓
CSV string parsed → buildLibraryFromCsv()
    ↓
Library object created (40 components)
    ↓
buildLibraryPrompt() generates prompt text
    ↓
Prompt sent to AI with drawing
    ↓
AI response parsed
    ↓
validateIOPoint() checks each result
    ↓
Validated data used in export
```

---

## Key Design Patterns

### 1. Library-Driven Extraction
All I/O point extraction is driven by the CSV library. The AI is instructed to output only I/O points that exist in the library, preventing hallucinations.

### 2. Validation Layer
Every extracted I/O point is validated against the library before being accepted, ensuring accuracy.

### 3. Single-Loop vs Multi-Point Handling
- **Single-loop instruments** (LIT, PIT, FIT): Keep original tag from drawing
- **Multi-point equipment** (Pumps, Valves): Append equipment ID to I/O tag

### 4. Error Boundaries
React ErrorBoundary catches rendering errors and displays user-friendly messages instead of white screens.

### 5. Graceful Degradation
If library fails to load, app continues with empty library rather than crashing.

---

## Environment Variables

### `.env` File
```env
# Anthropic Claude API (Direct)
VITE_ANTHROPIC_API_KEY=sk-ant-...

# OpenRouter API (Alternative)
VITE_OPENROUTER_API_KEY=sk-or-...

# Google Gemini API (Alternative)
VITE_GEMINI_API_KEY=...
```

**Note**: If no API keys are provided, the app uses `mockAnalyzeDrawing()` for development.

---

## API Integration Details

### Claude API (Anthropic)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514`
- **Supports**: PDFs and images
- **Format**: Base64 encoded files

### OpenRouter API
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `anthropic/claude-3.5-sonnet`
- **Supports**: PDFs and images via Claude

### Gemini API
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Model**: `gemini-2.0-flash`
- **Supports**: Images only (no PDF)

---

## Testing & Development

### Mock Mode
When no API keys are configured, the app automatically uses `mockAnalyzeDrawing()` which:
- Generates realistic data based on the library
- Uses actual library equipment types
- Simulates 2.5 second delay
- Returns sample instruments for testing

### Development Workflow
1. Start dev server: `npm run dev`
2. App loads at `http://localhost:5173` (or next available port)
3. Upload test file or use mock mode
4. Review results and export to Excel
5. Check console for library loading messages

---

## Troubleshooting

### Library Not Loading
**Symptoms**: Empty library, no I/O points extracted
**Check**:
- Console for "Library loaded: X components" message
- CSV string in `instrumentLibrary.js` is properly formatted
- No syntax errors in `buildLibraryFromCsv()`

### Import Errors
**Symptoms**: White screen, module errors
**Check**:
- All exports are properly declared (`export function ...`)
- Import paths are correct
- No circular dependencies

### Analysis Fails
**Symptoms**: Error during analysis, no results
**Check**:
- API key is valid and set in `.env`
- File format is supported (PDF, PNG, JPG)
- File size is under 10MB
- Network connectivity

---

## Code Quality

### Error Handling
- Try-catch blocks around critical operations
- Error boundaries for React components
- Graceful fallbacks (empty library, mock mode)
- User-friendly error messages

### Performance
- Library built once at module load
- CSV parsing optimized
- Deduplication for multi-file analysis
- Efficient React rendering

### Maintainability
- Clear function names
- Comprehensive comments
- Modular structure
- Separation of concerns

---

## Future Enhancements

### Potential Improvements
1. **Library Management UI**: Allow users to edit/update the CSV library through the UI
2. **Custom Templates**: User-defined equipment templates
3. **Batch Processing**: Analyze multiple files at once
4. **Library Versioning**: Track library changes over time
5. **Export Formats**: CSV, JSON, XML export options
6. **API Endpoint**: REST API for programmatic access

---

## Summary

This application is a complete I/O list generator that:
- Uses AI to extract instruments from P&ID drawings
- Validates extractions against a master equipment library
- Provides interactive editing capabilities
- Exports professional Excel files

The codebase is well-structured, modular, and follows React best practices. All core functionality is contained in the `src/utils/` directory, with UI components in `src/components/` and pages in `src/pages/`.
