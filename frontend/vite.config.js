import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: '0.0.0.0',

    // Correct MIME types for Unity WebGL assets
    headers: {
      // Required for SharedArrayBuffer (Unity threading / Brotli decompression)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Ensure large Unity binary assets aren't processed by Vite's bundler
  assetsInclude: ['**/*.data', '**/*.wasm', '**/*.unityweb'],

  optimizeDeps: {
    exclude: ['unity'],
  },
});
