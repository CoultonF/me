/// <reference types="node" />
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Cloudflare adapter uses workerd in dev which breaks many Node deps
// https://github.com/withastro/astro/issues/15319
// Only load adapter for build; dev uses Node runtime
const isBuild = process.argv.includes('build');

export default defineConfig({
  output: 'server',
  ...(isBuild && {
    adapter: (await import('@astrojs/cloudflare')).default({ imageService: 'compile' }),
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
