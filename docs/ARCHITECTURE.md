# InstruMap AI - System Architecture

## Overview

InstruMap AI is a web application that transforms P&ID (Piping and Instrumentation Diagram) drawings into I/O (Input/Output) lists. It uses AI to analyze engineering drawings and extract instrument tags automatically.

---

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        direction TB
        App[App.jsx<br/>Router]

        subgraph Pages["Pages"]
            HP[HomePage.jsx<br/>Upload & Analyze]
            RP[ResultsPage.jsx<br/>View & Edit Results]
            EP[EquipmentTemplatesPage.jsx<br/>I/O Templates Library]
        end

        subgraph Components["Reusable Components"]
            Header[Header.jsx<br/>Navigation]
            Footer[Footer.jsx<br/>Copyright]
            Loading[LoadingOverlay.jsx<br/>Progress Indicator]
            Toast[SuccessToast.jsx<br/>Notifications]
        end

        subgraph Utils["Utility Functions"]
            Analyze[analyzeDrawing.js<br/>AI Analysis]
            Export[exportToExcel.js<br/>Excel Generation]
            Storage[storage.js<br/>LocalStorage]
        end
    end

    subgraph External["External Services"]
        Claude[Claude AI API<br/>Vision Analysis]
        Browser[Browser Storage<br/>LocalStorage]
    end

    App --> HP
    App --> RP
    App --> EP

    HP --> Header
    HP --> Footer
    HP --> Loading
    HP --> Analyze
    HP --> Storage

    RP --> Header
    RP --> Footer
    RP --> Toast
    RP --> Export
    RP --> Storage

    EP --> Header
    EP --> Footer

    Analyze --> Claude
    Storage --> Browser
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant HomePage
    participant AnalyzeDrawing
    participant ClaudeAPI
    participant Storage
    participant ResultsPage
    participant ExportExcel

    User->>HomePage: Upload P&ID file(s)
    User->>HomePage: Fill P&ID Details (optional)
    User->>HomePage: Attach Reference Files (optional)
    User->>HomePage: Click "Upload & Analyze"

    HomePage->>AnalyzeDrawing: Send file + template
    AnalyzeDrawing->>AnalyzeDrawing: Convert file to Base64
    AnalyzeDrawing->>ClaudeAPI: Send image + prompt
    ClaudeAPI-->>AnalyzeDrawing: Return JSON with instruments
    AnalyzeDrawing->>AnalyzeDrawing: Parse & validate response
    AnalyzeDrawing-->>HomePage: Return instrument array

    HomePage->>Storage: Save analysis data
    HomePage->>ResultsPage: Navigate with data

    ResultsPage->>Storage: Load data (if page refresh)
    User->>ResultsPage: Edit tags (click to edit)
    User->>ResultsPage: Add missing tags
    User->>ResultsPage: Delete incorrect tags

    User->>ResultsPage: Click "Export to Excel"
    ResultsPage->>ExportExcel: Send instruments + details
    ExportExcel->>ExportExcel: Create workbook
    ExportExcel->>User: Download .xlsx file
```

---

## Component Hierarchy

```mermaid
graph TD
    subgraph App["App.jsx (Router)"]
        direction TB
        Routes[React Router]
    end

    Routes --> HomePage
    Routes --> ResultsPage
    Routes --> EquipmentTemplatesPage

    subgraph HomePage["HomePage.jsx"]
        HP_Header[Header]
        HP_Upload[Upload Area]
        HP_FileList[File List]
        HP_Template[Template Selector]
        HP_Details[P&ID Details Form]
        HP_RefFiles[Reference Files Upload]
        HP_HowItWorks[How It Works Section]
        HP_Footer[Footer]
        HP_Loading[LoadingOverlay]
    end

    subgraph ResultsPage["ResultsPage.jsx"]
        RP_Header[Header]
        RP_FileInfo[File Info Card]
        RP_PIDDetails[P&ID Details View]
        RP_Summary[Summary Card]
        RP_AddTag[Add Tag Form]
        RP_Table[Tags Table]
        RP_Footer[Footer]
        RP_Toast[SuccessToast]
    end

    subgraph EquipmentTemplatesPage["EquipmentTemplatesPage.jsx"]
        EP_Header[Header]
        EP_Categories[Category Filter]
        EP_Templates[Template Cards]
        EP_Legend[Signal Type Legend]
        EP_Footer[Footer]
    end
```

---

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> HomePage

    state HomePage {
        [*] --> NoFiles
        NoFiles --> FilesSelected: Drop/Select Files
        FilesSelected --> Analyzing: Click Analyze
        Analyzing --> NavigateToResults: Success
        Analyzing --> FilesSelected: Error
    }

    HomePage --> ResultsPage: Navigate with Data

    state ResultsPage {
        [*] --> LoadData
        LoadData --> DisplayResults: Data Found
        LoadData --> HomePage: No Data (Redirect)
        DisplayResults --> Editing: Click Cell
        Editing --> DisplayResults: Blur
        DisplayResults --> AddingTag: Fill Form
        AddingTag --> DisplayResults: Click Add
        DisplayResults --> Exporting: Click Export
        Exporting --> DisplayResults: Download Complete
    }

    ResultsPage --> HomePage: Click Back

    state EquipmentTemplatesPage {
        [*] --> AllTemplates
        AllTemplates --> FilteredTemplates: Select Category
        FilteredTemplates --> ExpandedTemplate: Click Template
        ExpandedTemplate --> FilteredTemplates: Click Collapse
    }
```

---

## File Structure

```
IO AI/
├── src/
│   ├── main.jsx              # Application entry point
│   ├── App.jsx               # Router configuration
│   ├── index.css             # Global styles + Tailwind
│   │
│   ├── pages/
│   │   ├── HomePage.jsx      # File upload & analysis
│   │   ├── ResultsPage.jsx   # Results display & editing
│   │   └── EquipmentTemplatesPage.jsx  # I/O templates
│   │
│   ├── components/
│   │   ├── Header.jsx        # Navigation header
│   │   ├── Footer.jsx        # Page footer
│   │   ├── LoadingOverlay.jsx # Loading spinner
│   │   └── SuccessToast.jsx  # Success notifications
│   │
│   └── utils/
│       ├── analyzeDrawing.js # Claude API integration
│       ├── exportToExcel.js  # XLSX file generation
│       └── storage.js        # LocalStorage helpers
│
├── docs/
│   ├── ARCHITECTURE.md       # This file
│   └── CODE_EXPLANATION.md   # Detailed code walkthrough
│
└── package.json
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 | UI Components |
| Build Tool | Vite | Fast development & bundling |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Routing | React Router DOM | Page navigation |
| Icons | Lucide React | SVG icon library |
| Excel Export | SheetJS (xlsx) | Generate Excel files |
| AI Analysis | Claude API | Vision-based P&ID analysis |
| Storage | LocalStorage | Persist analysis between pages |

---

## Signal Types (ISA S5.1 Standard)

```mermaid
graph LR
    subgraph Inputs["INPUTS (Field → PLC)"]
        AI[AI - Analog Input<br/>4-20mA signals<br/>Transmitters]
        DI[DI - Digital Input<br/>On/Off signals<br/>Switches]
    end

    subgraph Outputs["OUTPUTS (PLC → Field)"]
        AO[AO - Analog Output<br/>4-20mA control<br/>Control Valves, VFDs]
        DO[DO - Digital Output<br/>On/Off commands<br/>Solenoids, Motors]
    end

    Field[Field Devices] --> AI
    Field --> DI
    AO --> Actuators[Actuators]
    DO --> Actuators
```

| Signal | Type | Direction | Examples |
|--------|------|-----------|----------|
| AI | Analog Input | Field → Control | LIT, PIT, FIT, TIT |
| DI | Digital Input | Field → Control | LSH, PSL, ZSO, ZSC |
| AO | Analog Output | Control → Field | FV, VFD Speed, Positioners |
| DO | Digital Output | Control → Field | XV, Motor Start, SOV |

---

## Key Features

1. **Multi-File Upload** - Process multiple P&ID drawings at once
2. **AI-Powered Analysis** - Claude vision model extracts instrument tags
3. **P&ID Details** - Store project info, drawing number, equipment list
4. **Reference Files** - Attach PDF/DWG files for future equipment matching
5. **Editable Results** - Click to edit any tag, add/remove instruments
6. **Excel Export** - Generate formatted I/O list with summary sheet
7. **Equipment Templates** - Reference library of standard equipment I/O
8. **Dark Mode** - Toggle between light and dark themes
