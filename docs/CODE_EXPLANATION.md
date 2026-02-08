# InstruMap AI - Complete Code Explanation for Beginners

This document explains every file and every important code concept in simple terms. If you're new to React or web development, this guide will help you understand how everything works.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [How React Works](#how-react-works)
3. [File-by-File Explanation](#file-by-file-explanation)
4. [Key Concepts Explained](#key-concepts-explained)

---

## Project Overview

**InstruMap AI** is a web app that:
1. Takes P&ID (engineering drawing) files as input
2. Uses AI to find all instrument tags in the drawing
3. Shows the results in an editable table
4. Exports the data to Excel

Think of it like a smart scanner for engineering drawings.

---

## How React Works

Before diving into the code, let's understand React basics:

### Components
Components are like LEGO blocks. Each component is a reusable piece of UI.

```jsx
// This is a simple component
function MyButton() {
  return <button>Click Me</button>;
}
```

### State
State is data that can change. When state changes, React updates the screen automatically.

```jsx
const [count, setCount] = useState(0);  // count starts at 0
setCount(5);  // Now count is 5, and screen updates!
```

### Props
Props are like function arguments - they pass data from parent to child.

```jsx
// Parent passes name to child
<Greeting name="John" />

// Child receives and uses it
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

---

## File-by-File Explanation

### 1. `src/main.jsx` - The Starting Point

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**What each line does:**

| Line | Explanation |
|------|-------------|
| `import { StrictMode } from 'react'` | Imports StrictMode which helps catch bugs during development |
| `import { createRoot } from 'react-dom/client'` | Imports the function that connects React to the HTML page |
| `import './index.css'` | Loads the CSS styles for the whole app |
| `import App from './App.jsx'` | Imports the main App component |
| `createRoot(document.getElementById('root'))` | Finds the `<div id="root">` in index.html |
| `.render(<StrictMode><App /></StrictMode>)` | Puts our App inside that div |

**In simple terms:** This file is the "ignition key" - it starts the whole application.

---

### 2. `src/App.jsx` - The Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import EquipmentTemplatesPage from './pages/EquipmentTemplatesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/templates" element={<EquipmentTemplatesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**What each line does:**

| Line | Explanation |
|------|-------------|
| `import { BrowserRouter, Routes, Route }` | Imports routing tools (like a GPS for web pages) |
| `<BrowserRouter>` | Wraps the app to enable page navigation |
| `<Routes>` | Container for all the different pages |
| `<Route path="/" element={<HomePage />} />` | When URL is `/`, show HomePage |
| `<Route path="/results" .../>` | When URL is `/results`, show ResultsPage |
| `<Route path="/templates" .../>` | When URL is `/templates`, show EquipmentTemplatesPage |

**In simple terms:** This file is like a "traffic controller" - it decides which page to show based on the URL.

---

### 3. `src/index.css` - Global Styles

```css
@import 'tailwindcss';

@keyframes slideUp {
  0% {
    transform: translateY(100px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

* {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #f9fafb;
}
```

**What each section does:**

| Section | Explanation |
|---------|-------------|
| `@import 'tailwindcss'` | Loads Tailwind CSS - a utility-first CSS framework |
| `@keyframes slideUp` | Defines an animation that slides elements up while fading in |
| `@keyframes fadeIn` | Defines a simple fade-in animation |
| `::-webkit-scrollbar` | Customizes how the scrollbar looks |
| `*` | The `*` means "all elements" - adds smooth color transitions |
| `body` | Styles the page body - removes margin, sets min height and background |

**In simple terms:** This file makes everything look nice with animations and custom scrollbars.

---

### 4. `src/pages/HomePage.jsx` - Upload Page (Main Page)

This is the biggest file, so let's break it into sections:

#### Section A: Imports

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, BarChart3, Download, CheckCircle, X, Info,
         ChevronDown, ChevronUp, Paperclip, Scan, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingOverlay from '../components/LoadingOverlay';
import { analyzeDrawing, mockAnalyzeDrawing } from '../utils/analyzeDrawing';
import { saveAnalysisData } from '../utils/storage';
```

| Import | What it is |
|--------|-----------|
| `useState` | React hook to store data that changes |
| `useNavigate` | Function to go to different pages |
| `Upload, FileText, ...` | Icons from the Lucide library |
| `Header, Footer, LoadingOverlay` | Our custom components |
| `analyzeDrawing, mockAnalyzeDrawing` | Functions to analyze P&ID files |
| `saveAnalysisData` | Function to save data to browser storage |

#### Section B: State Variables

```jsx
const [files, setFiles] = useState([]);
const [template, setTemplate] = useState('generic');
const [analyzing, setAnalyzing] = useState(false);
const [error, setError] = useState(null);
const [dragActive, setDragActive] = useState(false);
const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
const [showPidDetails, setShowPidDetails] = useState(false);
const [pidDetails, setPidDetails] = useState({
  projectName: '',
  drawingNumber: '',
  revision: '',
  area: '',
  equipmentList: '',
  notes: '',
  referenceFiles: []
});
const [analyzingRefIndex, setAnalyzingRefIndex] = useState(null);
```

| State Variable | What it stores | Example Value |
|----------------|---------------|---------------|
| `files` | Array of uploaded P&ID files | `[File1, File2]` |
| `template` | Selected analysis template | `'generic'` or `'dar'` |
| `analyzing` | Is analysis running? | `true` or `false` |
| `error` | Error message if something fails | `'File too large'` |
| `dragActive` | Is user dragging a file over? | `true` or `false` |
| `analysisProgress` | Progress of multi-file analysis | `{ current: 2, total: 5 }` |
| `showPidDetails` | Is P&ID details section open? | `true` or `false` |
| `pidDetails` | All the P&ID metadata | Object with project info |
| `analyzingRefIndex` | Which reference file is being analyzed | `0`, `1`, or `null` |

#### Section C: File Handling Functions

```jsx
const handleDrag = (e) => {
  e.preventDefault();        // Stop browser's default behavior
  e.stopPropagation();       // Stop event from bubbling up
  if (e.type === 'dragenter' || e.type === 'dragover') {
    setDragActive(true);     // User is dragging over - highlight the area
  } else if (e.type === 'dragleave') {
    setDragActive(false);    // User left - remove highlight
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelect(Array.from(e.dataTransfer.files));  // Process dropped files
  }
};

const handleFileSelect = (selectedFiles) => {
  const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  const validFiles = [];
  const errors = [];

  selectedFiles.forEach(file => {
    // Check file type
    if (!validTypes.includes(file.type)) {
      errors.push(`${file.name}: Invalid file type`);
      return;
    }
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`${file.name}: File size must be less than 10MB`);
      return;
    }
    validFiles.push(file);
  });

  if (errors.length > 0) {
    setError(errors.join(', '));
  } else {
    setError(null);
  }

  setFiles(prevFiles => [...prevFiles, ...validFiles]);  // Add to existing files
};
```

**In simple terms:** These functions handle when users drag files or click to upload. They check if files are the right type and size.

#### Section D: Analysis Function

```jsx
const handleUploadAndAnalyze = async () => {
  if (files.length === 0) {
    setError('Please select at least one file');
    return;
  }

  setAnalyzing(true);    // Show loading spinner
  setError(null);        // Clear any previous errors
  setAnalysisProgress({ current: 0, total: files.length });

  try {
    const useMock = !import.meta.env.VITE_ANTHROPIC_API_KEY;  // Use mock if no API key
    const allInstruments = [];
    const fileResults = [];

    // Loop through each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setAnalysisProgress({ current: i + 1, total: files.length });

      try {
        // Analyze the file (mock or real API)
        const instruments = useMock
          ? await mockAnalyzeDrawing(file, template)
          : await analyzeDrawing(file, template);

        if (instruments && instruments.length > 0) {
          // Add source filename to each instrument
          const instrumentsWithSource = instruments.map(inst => ({
            ...inst,
            source: file.name
          }));

          allInstruments.push(...instrumentsWithSource);
          fileResults.push({
            filename: file.name,
            count: instruments.length,
            success: true
          });
        }
      } catch (err) {
        fileResults.push({
          filename: file.name,
          count: 0,
          success: false,
          error: err.message
        });
      }
    }

    // Save and navigate to results
    const analysisData = {
      filename: files.length === 1 ? files[0].name : `${files.length} files`,
      instruments: allInstruments,
      template: template,
      timestamp: new Date().toISOString(),
      pidDetails: pidDetails,
    };
    saveAnalysisData(analysisData);
    navigate('/results', { state: analysisData });

  } catch (err) {
    setError(err.message || 'Failed to analyze drawings');
  } finally {
    setAnalyzing(false);
    setAnalysisProgress({ current: 0, total: 0 });
  }
};
```

**Flow explained:**
1. Check if files are uploaded
2. Start loading spinner
3. Loop through each file
4. Call AI to analyze each file
5. Collect all the instrument tags
6. Save data and go to results page

#### Section E: Reference File Analysis

```jsx
const analyzeReferenceFile = async (index) => {
  const refFile = pidDetails.referenceFiles[index];
  if (!refFile || !refFile.file) {
    setError('Cannot analyze this file');
    return;
  }

  setAnalyzingRefIndex(index);  // Mark which file is being analyzed

  try {
    const useMock = !import.meta.env.VITE_ANTHROPIC_API_KEY;
    const instruments = useMock
      ? await mockAnalyzeDrawing(refFile.file, template)
      : await analyzeDrawing(refFile.file, template);

    // Update the reference file with analyzed data
    setPidDetails(prev => ({
      ...prev,
      referenceFiles: prev.referenceFiles.map((file, i) => {
        if (i === index) {
          return {
            ...file,
            analyzed: true,
            analyzedData: instruments,
            analyzedAt: new Date().toISOString()
          };
        }
        return file;
      })
    }));
  } catch (err) {
    setError(`Failed to analyze ${refFile.name}: ${err.message}`);
  } finally {
    setAnalyzingRefIndex(null);
  }
};
```

**In simple terms:** This function analyzes a reference P&ID file and stores the extracted equipment I/O with it.

---

### 5. `src/pages/ResultsPage.jsx` - Results Display

#### Key State Variables

```jsx
const [data, setData] = useState(null);           // Analysis results
const [instruments, setInstruments] = useState([]);// Editable instrument list
const [editingCell, setEditingCell] = useState(null);  // Which cell is being edited
const [showSuccess, setShowSuccess] = useState(false); // Show success toast
const [newTag, setNewTag] = useState('');         // New tag input
const [newSignalType, setNewSignalType] = useState('AI'); // New tag signal type
const [newDescription, setNewDescription] = useState(''); // New tag description
```

#### Loading Data

```jsx
useEffect(() => {
  // Try navigation state first (fastest)
  let analysisData = location.state;

  // Fallback to localStorage (for page refresh)
  if (!analysisData) {
    analysisData = getAnalysisData();
  }

  if (!analysisData || !analysisData.instruments) {
    navigate('/');  // No data? Go back home
    return;
  }

  setData(analysisData);
  setInstruments(analysisData.instruments);
  clearAnalysisData();  // Clean up localStorage
}, [location.state, navigate]);
```

**What `useEffect` does:** Runs code when the component first loads. Here it:
1. Gets analysis data from navigation or localStorage
2. If no data found, redirects to home page
3. Sets the data into state variables

#### Editing Functions

```jsx
const handleCellEdit = (index, field, value) => {
  const updated = [...instruments];     // Copy the array
  updated[index][field] = value;        // Change the specific field
  setInstruments(updated);              // Save changes
};

const handleDeleteRow = (index) => {
  if (window.confirm('Are you sure?')) {
    const updated = instruments.filter((_, i) => i !== index);
    setInstruments(updated);
  }
};

const handleAddTag = () => {
  if (!newTag.trim()) {
    alert('Please enter a tag name');
    return;
  }

  const newInstrument = {
    tag: newTag.trim(),
    signalType: newSignalType,
    description: newDescription.trim() || 'No description',
  };

  setInstruments([...instruments, newInstrument]);

  // Reset form
  setNewTag('');
  setNewSignalType('AI');
  setNewDescription('');
};
```

#### Export Function

```jsx
const handleExport = () => {
  const summary = calculateSummary(instruments);  // Count AI, DI, DO, AO
  const filename = exportToExcelWithSummary(
    instruments,
    data.filename,
    summary,
    data.pidDetails
  );
  setSuccessMessage(`Excel file downloaded: ${filename}`);
  setShowSuccess(true);
};
```

---

### 6. `src/pages/EquipmentTemplatesPage.jsx` - Templates Library

#### Template Data Structure

```jsx
const DEFAULT_TEMPLATES = [
  {
    id: 'vfd-pump',
    name: 'VFD Pump',
    category: 'Pumps',
    description: 'Variable Frequency Drive controlled pump',
    ioPoints: [
      { tag: 'HS-XXX', signalType: 'DI', description: 'Hand Switch' },
      { tag: 'YI-XXX', signalType: 'DI', description: 'Running Status' },
      { tag: 'YA-XXX', signalType: 'DI', description: 'Fault Alarm' },
      { tag: 'II-XXX', signalType: 'AI', description: 'Motor Current' },
      { tag: 'M-XXX', signalType: 'DO', description: 'Motor Start' },
      { tag: 'I-XXX', signalType: 'AO', description: 'Speed Reference' },
    ],
  },
  // ... more templates
];
```

**What this is:** A library of standard equipment with their typical I/O points. Engineers can reference this when analyzing P&IDs.

---

### 7. `src/components/Header.jsx` - Navigation Bar

```jsx
export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();  // Get current URL path

  useEffect(() => {
    // Load saved theme on startup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg">
          <span className="text-white font-bold">IM</span>
        </div>
        <div>
          <h1>InstruMap AI</h1>
          <p>P&ID to I/O List</p>
        </div>
      </div>

      {/* Navigation Links */}
      <Link to="/templates">Equipment Templates</Link>

      {/* Dark Mode Toggle */}
      <button onClick={toggleDarkMode}>
        {darkMode ? <Sun /> : <Moon />}
      </button>
    </header>
  );
}
```

---

### 8. `src/components/LoadingOverlay.jsx` - Loading Spinner

```jsx
import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ message, subMessage }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
        <h3>{message || 'Analyzing Your P&ID'}</h3>
        <p>{subMessage || 'Extracting instruments...'}</p>
        <p>This usually takes 1-2 minutes</p>
      </div>
    </div>
  );
}
```

**Key CSS classes:**
- `fixed inset-0` - Covers entire screen
- `bg-black/50` - Semi-transparent black background
- `backdrop-blur-sm` - Blurs the content behind
- `animate-spin` - Makes the loader icon spin

---

### 9. `src/components/SuccessToast.jsx` - Success Notification

```jsx
export default function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);  // Auto-close after 3 seconds
    return () => clearTimeout(timer);          // Cleanup if component unmounts
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg">
      <CheckCircle className="w-6 h-6" />
      <span>{message}</span>
      <button onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

### 10. `src/utils/storage.js` - Browser Storage

```jsx
const STORAGE_KEY = 'instrumap_current_analysis';

// Save data
export function saveAnalysisData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save:', error);
    return false;
  }
}

// Get data
export function getAnalysisData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get:', error);
    return null;
  }
}

// Delete data
export function clearAnalysisData() {
  localStorage.removeItem(STORAGE_KEY);
}
```

**What is localStorage?** It's like a small database in the browser. Data stays even after closing the browser. We use it as a backup in case the user refreshes the page.

---

### 11. `src/utils/analyzeDrawing.js` - AI Analysis

#### Main Function

```jsx
export async function analyzeDrawing(file, template = 'generic') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('API key not found');
  }

  // Convert file to base64 (text format for API)
  const base64 = await fileToBase64(file);
  const mediaType = getMediaType(file.type);
  const prompt = buildPrompt(template);

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 }},
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  const data = await response.json();
  const content = data.content[0].text;
  return parseClaudeResponse(content);
}
```

#### Mock Function (for testing without API)

```jsx
export function mockAnalyzeDrawing(file, template = 'generic') {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { tag: 'LIT-1002', signalType: 'AI', description: 'Level Transmitter' },
        { tag: 'LSLL-1004', signalType: 'DI', description: 'Level Switch Low Low' },
        { tag: 'M-SCP-WP-1', signalType: 'DO', description: 'Motor Pump' },
        { tag: 'I-SCP-WP-1', signalType: 'AO', description: 'VFD Speed Reference' },
        // ... more mock instruments
      ]);
    }, 2000);  // Simulate 2 second delay
  });
}
```

---

### 12. `src/utils/exportToExcel.js` - Excel Export

```jsx
import * as XLSX from 'xlsx';

export function exportToExcelWithSummary(instruments, filename, summary, pidDetails) {
  const workbook = XLSX.utils.book_new();  // Create new Excel file

  // Sheet 1: I/O List
  const ioListData = [
    ['#', 'Tag', 'Signal Type', 'Description'],  // Headers
    ...instruments.map((inst, i) => [
      i + 1, inst.tag, inst.signalType, inst.description
    ])
  ];
  const ioListSheet = XLSX.utils.aoa_to_sheet(ioListData);
  XLSX.utils.book_append_sheet(workbook, ioListSheet, 'I/O List');

  // Sheet 2: Summary
  const summaryData = [
    ['P&ID Analysis Summary'],
    [],
    ['Project Name', pidDetails?.projectName || ''],
    ['Drawing Number', pidDetails?.drawingNumber || ''],
    ['Total Tags', summary.total],
    [],
    ['Signal Type Breakdown'],
    ['AI (Analog Input)', summary.AI],
    ['DI (Digital Input)', summary.DI],
    ['DO (Digital Output)', summary.DO],
    ['AO (Analog Output)', summary.AO],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Download file
  const exportFilename = `${pidDetails?.drawingNumber || filename}_IOList.xlsx`;
  XLSX.writeFile(workbook, exportFilename);
  return exportFilename;
}

export function calculateSummary(instruments) {
  const summary = { total: instruments.length, AI: 0, DI: 0, DO: 0, AO: 0 };

  instruments.forEach(instrument => {
    const type = instrument.signalType;
    if (summary.hasOwnProperty(type)) {
      summary[type]++;
    }
  });

  return summary;
}
```

---

## Key Concepts Explained

### 1. What is JSX?

JSX looks like HTML but it's actually JavaScript. React converts it to real HTML.

```jsx
// This JSX:
<div className="box">
  <h1>Hello</h1>
</div>

// Becomes this JavaScript:
React.createElement('div', { className: 'box' },
  React.createElement('h1', null, 'Hello')
);
```

### 2. What is `useState`?

`useState` creates a variable that, when changed, causes the screen to update.

```jsx
const [count, setCount] = useState(0);
// count = current value (0)
// setCount = function to change it

setCount(5);  // Screen updates to show 5
```

### 3. What is `useEffect`?

`useEffect` runs code at specific times:
- When component first appears
- When certain values change
- When component is removed

```jsx
useEffect(() => {
  console.log('Component loaded!');
}, []);  // Empty array = run only once when component loads

useEffect(() => {
  console.log('Count changed to:', count);
}, [count]);  // Run whenever 'count' changes
```

### 4. What is `async/await`?

`async/await` makes waiting for things (like API calls) easier to read:

```jsx
// Without async/await (confusing)
fetch(url).then(response => response.json()).then(data => console.log(data));

// With async/await (clearer)
const response = await fetch(url);
const data = await response.json();
console.log(data);
```

### 5. What are Tailwind CSS Classes?

Tailwind uses small utility classes instead of writing CSS:

| Class | What it does |
|-------|-------------|
| `flex` | Display as flexbox |
| `items-center` | Vertically center items |
| `gap-4` | Add 1rem gap between items |
| `p-4` | Add 1rem padding all around |
| `bg-blue-500` | Blue background |
| `text-white` | White text |
| `rounded-lg` | Rounded corners |
| `hover:bg-blue-600` | Darker blue on hover |

### 6. Signal Types (I&C Engineering)

| Type | Full Name | Direction | Example |
|------|-----------|-----------|---------|
| AI | Analog Input | Field to PLC | Level transmitter (4-20mA) |
| DI | Digital Input | Field to PLC | On/off switch |
| AO | Analog Output | PLC to Field | Valve position (4-20mA) |
| DO | Digital Output | PLC to Field | Motor start command |

---

## Quick Reference

### React Hooks Used

| Hook | Purpose |
|------|---------|
| `useState` | Store and update data |
| `useEffect` | Run code on load or when values change |
| `useNavigate` | Go to different pages |
| `useLocation` | Get current URL info |

### Key Files Summary

| File | Purpose |
|------|---------|
| `main.jsx` | App entry point |
| `App.jsx` | Page routing |
| `HomePage.jsx` | File upload & analysis |
| `ResultsPage.jsx` | View & edit results |
| `EquipmentTemplatesPage.jsx` | I/O templates reference |
| `Header.jsx` | Navigation bar |
| `analyzeDrawing.js` | AI analysis logic |
| `exportToExcel.js` | Excel file generation |
| `storage.js` | Browser storage helpers |
