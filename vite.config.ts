import { defineConfig } from 'vite';

// base './' => relative asset paths, required by YouTube Playables (no absolute paths).
export default defineConfig({
  base: './',
  assetsInclude: ['**/*.glb'],
  build: {
    target: 'es2018',
    assetsInlineLimit: 8192,
    modulePreload: { polyfill: false },
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Keep three.js in its own file so every file stays under the 512 KiB "should" limit.
        manualChunks: { three: ['three'] },
      },
    },
  },
  server: { port: 5174 },
});
