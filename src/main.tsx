import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * Register the offline worker.
 *
 * A rider checking step-free status is often underground or on bad signal - exactly
 * when they need the answer. Registered after load so it never delays first paint.
 */
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is an enhancement; the app works without it.
      });
    });
  } else {
    // In dev the worker is poison: cache-first serves stale modules, so code and
    // env values (like a rotated API key) stick around after they've changed on
    // disk. Kill any worker left over from a previous production preview.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    if ('caches' in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
