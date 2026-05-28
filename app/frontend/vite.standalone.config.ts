import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Swap the entry HTML to `index.standalone.html` at build start so the
 * standalone build uses a clean, env-var-free template, then restore
 * `index.html` afterwards.
 */
function useStandaloneEntryHtml() {
  const root = __dirname;
  const realIndex = path.join(root, 'index.html');
  const standaloneIndex = path.join(root, 'index.standalone.html');
  const backupIndex = path.join(root, 'index.original.html.bak');
  return {
    name: 'use-standalone-entry-html',
    buildStart() {
      if (fs.existsSync(realIndex) && fs.existsSync(standaloneIndex)) {
        fs.copyFileSync(realIndex, backupIndex);
        fs.copyFileSync(standaloneIndex, realIndex);
      }
    },
    closeBundle() {
      if (fs.existsSync(backupIndex)) {
        fs.copyFileSync(backupIndex, realIndex);
        fs.unlinkSync(backupIndex);
      }
    },
  };
}

/**
 * Standalone build config.
 *
 * Produces a single self-contained `index.html` (no separate JS/CSS files,
 * everything is inlined) under `dist-standalone/`. The output file can be
 * double-clicked or hosted anywhere — no server required.
 *
 * Build with:
 *   pnpm run build:standalone
 */
export default defineConfig({
  plugins: [
    useStandaloneEntryHtml(),
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Use relative base so the file works when opened via file:// or any subpath.
  base: './',
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000, // inline all assets
    chunkSizeWarningLimit: 100_000,
    rollupOptions: {
      output: {
        // Single bundle — disable code splitting so everything inlines into one HTML.
        inlineDynamicImports: true,
      },
    },
  },
});