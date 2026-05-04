import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const readPort = (...keys: string[]) => {
    for (const key of keys) {
      const rawValue = env[key] ?? process.env[key];
      if (!rawValue) continue;

      const port = Number.parseInt(rawValue, 10);
      if (Number.isInteger(port) && port > 0 && port <= 65535) {
        return port;
      }
    }

    return undefined;
  };
  const host = env.HOST || process.env.HOST || '0.0.0.0';
  const devPort = readPort('DEV_PORT', 'PORT');
  const previewPort = readPort('PREVIEW_PORT', 'PORT');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host,
      port: devPort,
      strictPort: Boolean(devPort),
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      host,
      port: previewPort,
      strictPort: Boolean(previewPort),
    },
  };
});
