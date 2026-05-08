import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Fatal rendering error:', error);
    rootElement.innerHTML = `
      <div style="background: #111; color: #ef4444; padding: 2rem; font-family: sans-serif; border-radius: 1rem; margin: 2rem; border: 1px solid #dc2626;">
        <h1 style="margin-top: 0; font-size: 1.5rem;">Application Error</h1>
        <pre style="white-space: pre-wrap; word-break: break-all; background: #000; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">${error instanceof Error ? error.message : String(error)}</pre>
        <p style="color: #666; font-size: 0.875rem;">Check the browser console for details.</p>
      </div>
    `;
  }
}
