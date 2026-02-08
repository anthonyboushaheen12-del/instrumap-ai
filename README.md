# InstruMap AI

> Transform P&ID Drawings into I/O Lists in Seconds

Built by I&C Engineers, for I&C Engineers.

## Overview

InstruMap AI is a web application that uses AI to automatically extract instrumentation tags from P&ID (Piping and Instrumentation Diagram) drawings and generate structured I/O lists. It leverages Claude AI's vision capabilities to identify instruments, classify signal types, and create exportable Excel spreadsheets.

## Features

- **Automatic Extraction**: Upload P&ID drawings (PDF, PNG, JPG) and automatically extract all instrument tags
- **Signal Classification**: AI classifies each instrument by signal type (AI, DI, DO, AO)
- **Interactive Review**: Edit tags, signal types, and descriptions directly in the browser
- **Add Missing Tags**: Manual form to add any instruments the AI might have missed
- **Excel Export**: One-click export to formatted Excel file with summary statistics
- **Template Support**: Generic ISA and Dar Al-Handasah template options
- **Clean UI**: Modern, professional interface with gradient design

## User Flow

1. **Upload** - Select a P&ID file (drag-and-drop or click to browse)
2. **Automatic Analysis** - AI extracts instruments and classifies signal types
3. **Review & Edit** - View results in an editable table, add or remove tags
4. **Export** - Download formatted Excel file with I/O list and summary

## Tech Stack

- **Frontend**: React 19 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Excel Export**: XLSX library
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd io-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Development Mode (Without API Key)

The app includes a mock function that returns sample data for development and testing. If no API key is provided, it automatically uses mock data.

### Production Mode (With API Key)

When a valid Anthropic API key is provided, the app will use Claude AI to analyze real P&ID drawings.

### Supported File Formats

- PDF documents
- PNG images
- JPG/JPEG images

File size limit: 10MB

## Project Structure

```
io-ai/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Header.jsx       # App header with branding
│   │   ├── Footer.jsx       # App footer
│   │   ├── LoadingOverlay.jsx  # Analysis loading state
│   │   └── SuccessToast.jsx    # Success notification
│   ├── pages/               # Main pages
│   │   ├── HomePage.jsx     # Landing page with upload
│   │   └── ResultsPage.jsx  # Results table view
│   ├── utils/               # Utility functions
│   │   ├── analyzeDrawing.js   # Claude API integration
│   │   ├── exportToExcel.js    # Excel generation
│   │   └── storage.js          # localStorage helpers
│   ├── App.jsx              # Main app with routing
│   └── index.css            # Global styles
├── .env.example             # Environment variables template
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

## API Integration

The app uses the Anthropic Claude API to analyze P&ID drawings:

- **Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Input**: Base64-encoded image or PDF
- **Output**: JSON array of instruments with tag, signal type, and description

### Signal Type Classification

- **AI (Analog Input)**: Sensors that provide continuous measurements (temperature, pressure, flow, level transmitters)
- **DI (Digital Input)**: Binary state sensors (limit switches, status indicators)
- **DO (Digital Output)**: On/off control outputs (valve open/close, motor start/stop)
- **AO (Analog Output)**: Continuous control outputs (valve positioning, variable speed drives)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. You can preview the production build:

```bash
npm run preview
```

## Deployment

The app is a static single-page application and can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

Make sure to set the `VITE_ANTHROPIC_API_KEY` environment variable in your hosting platform.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key for Claude AI | No (uses mock data if not provided) |

## Features Roadmap

### V1.0 (Current)
- ✅ Single file upload
- ✅ Automatic analysis
- ✅ Editable results table
- ✅ Excel export
- ✅ Template selection

### V1.1 (Planned)
- 🔲 Search/filter in results table
- 🔲 Confidence scores per tag
- 🔲 Batch processing (multiple files)
- 🔲 P&ID preview side-by-side with results
- 🔲 CSV export option
- 🔲 PDF export option

### V1.2 (Future)
- 🔲 User accounts and history
- 🔲 Custom template builder
- 🔲 Collaborative editing
- 🔲 API for integration

## Troubleshooting

### "Anthropic API key not found" error

Make sure you've created a `.env` file and added your API key. The file should be in the root directory and contain:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Restart the dev server after adding the API key.

### Analysis takes too long

Analysis typically takes 1-2 minutes depending on the complexity of the P&ID. Factors that affect speed:
- File size
- Number of instruments
- Drawing quality
- API response time

### No instruments detected

Possible causes:
- Drawing quality is too low
- Instruments use non-standard symbols
- File is not a P&ID (e.g., a blank page)

Try:
- Uploading a higher resolution image
- Selecting the appropriate template
- Adding missing tags manually

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.

---

**Statistics**

- 240+ Hours Saved
- 100+ P&IDs Analyzed
- 95% Accuracy

*"Trusted by engineers at Dar Al-Handasah"*
