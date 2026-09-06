import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./pages', import.meta.url)),
  base: './',
  publicDir: false,
  resolve: {alias: {'@':fileURLToPath(new URL('.',import.meta.url))}},
  define: {__FLINT_PUBLIC__:true},
  plugins: [react()],
  css: {postcss: {plugins: [tailwindcss()]}},
  build: {outDir: '../dist-pages', emptyOutDir:true},
});
