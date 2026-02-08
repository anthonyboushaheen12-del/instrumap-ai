# Quick Start Guide

Get InstruMap AI running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

## Step 3: Test with Mock Data (No API Key Required)

The app includes mock data for testing. Simply:

1. Open http://localhost:5173 in your browser
2. Upload any PDF or image file (it will be ignored in mock mode)
3. Click "Upload & Analyze"
4. Wait 2 seconds for the mock analysis to complete
5. You'll be redirected to the results page with sample instrument data
6. Test the editing and export features

## Step 4: (Optional) Add Real API Key

To analyze real P&ID drawings:

1. Get an API key from https://console.anthropic.com/
2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```env
   VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   ```
4. Restart the dev server:
   ```bash
   # Press Ctrl+C to stop, then:
   npm run dev
   ```

## Features to Test

### Homepage
- ✅ Drag and drop file upload
- ✅ Click to browse file upload
- ✅ File validation (PDF, PNG, JPG only)
- ✅ File size limit (10MB max)
- ✅ Template selection (Generic ISA vs Dar Al-Handasah)
- ✅ Loading overlay during analysis

### Results Page
- ✅ View extracted instruments in table
- ✅ Click any cell to edit (tag, signal type, description)
- ✅ Delete rows with trash icon
- ✅ Add new tags with form at top
- ✅ Color-coded signal type badges (AI=blue, DI=green, DO=orange, AO=purple)
- ✅ Summary statistics card
- ✅ Export to Excel with summary sheet
- ✅ Success toast notification after export
- ✅ Back to home button

## Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Port already in use
If port 5173 is already taken, Vite will automatically use the next available port (5174, 5175, etc.)

### Blank page on load
Check the browser console for errors. Make sure all dependencies are installed.

### Mock data not appearing
Open browser DevTools and check the Console tab for errors. The mock function should complete after 2 seconds.

### Excel export not working
Make sure you're testing in a modern browser (Chrome, Firefox, Edge, Safari). The XLSX library requires a recent browser version.

## Next Steps

- Upload real P&ID drawings (with API key)
- Customize the template prompts in `src/utils/analyzeDrawing.js`
- Add your company branding in `src/components/Header.jsx`
- Modify color scheme in `tailwind.config.js`

## Development Tips

- Hot Module Replacement (HMR) is enabled - changes reflect instantly
- Check `src/utils/analyzeDrawing.js:168` for the mock data function
- Edit `src/utils/analyzeDrawing.js:76` to customize analysis prompts
- Modify `src/utils/exportToExcel.js` to change Excel formatting

Enjoy using InstruMap AI!
