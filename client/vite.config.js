import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths let the same build work under any GitHub Pages subpath.
  base: './',
  plugins: [react(), tailwindcss()],
});
