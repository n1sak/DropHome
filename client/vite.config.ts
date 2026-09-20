import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two build targets share this config:
//   vite build                  -> normal app, talks to the Express server in /server
//   vite build --mode artifact  -> one classic script + one stylesheet, which
//                                  scripts/build-artifact.mjs inlines into a single HTML file
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    plugins: [react()],
    define: {
      __ARTIFACT__: JSON.stringify(artifact),
    },
    server: {
      port: 5173,
      // changeOrigin stays off so the server sees the page's own host and its same-site check passes
      proxy: {
        '/api': { target: 'http://localhost:8787', changeOrigin: false },
        '/share': { target: 'http://localhost:8787', changeOrigin: false },
        '/drop': { target: 'http://localhost:8787', changeOrigin: false },
      },
    },
    build: artifact
      ? {
          outDir: 'dist-artifact',
          cssCodeSplit: false,
          assetsInlineLimit: 100_000_000,
          modulePreload: false,
          rollupOptions: {
            output: {
              format: 'iife',
              inlineDynamicImports: true,
              entryFileNames: 'app.js',
              assetFileNames: 'app[extname]',
            },
          },
        }
      : { outDir: 'dist' },
  };
});
