import { defineConfig } from 'vite';

export default defineConfig({
  // Relative URLs work both on GitHub Pages project paths and local previews.
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
});
