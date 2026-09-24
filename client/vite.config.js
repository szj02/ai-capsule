import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the React app runs on its own port (5173) but /api and /auth
// calls need to reach the Express server on port 5000. This proxy makes
// that transparent so the same fetch('/api/...') calls work in dev
// AND in production (where Express serves the build directly).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth': 'http://localhost:5000'
    }
  }
});
