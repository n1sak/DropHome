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
      proxy: {
        '/api': 'http://localhost:8787',
        '/share': 'http://localhost:8787',
        '/drop': 'http://localhost:8787',
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
