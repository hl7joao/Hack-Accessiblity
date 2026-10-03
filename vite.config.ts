import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The CTA APIs don't send CORS headers, and the Train Tracker key must stay
// server-side. In dev, Vite proxies them; in production, mirror these routes
// in a small backend / edge function.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ttKey = env.CTA_TRAIN_KEY ?? '';

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        // Customer Alerts API (no key): routes.aspx, alerts.aspx
        '/api/cta': {
          target: 'https://www.transitchicago.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cta/, '/api/1.0'),
        },
        // Train Tracker API (key injected here, never shipped to the browser)
        '/api/traintracker': {
          target: 'http://lapi.transitchicago.com',
          changeOrigin: true,
          rewrite: (path) => {
            const [p, q = ''] = path.replace(/^\/api\/traintracker/, '/api/1.0').split('?');
            const params = new URLSearchParams(q);
            params.set('key', ttKey);
            params.set('outputType', 'JSON');
            return `${p}?${params}`;
          },
        },
      },
    },
  };
});
