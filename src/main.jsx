import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add error handling for rendering
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
  // Show error on page
  const rootElement = document.getElementById('root') || document.body;
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace; background: #1a1a1a; color: #ff4444;">
      <h1>Application Error</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background: #2a2a2a; padding: 10px; overflow: auto;">${error.stack || error.toString()}</pre>
      <p>Check browser console (F12) for more details.</p>
    </div>
  `;
}
