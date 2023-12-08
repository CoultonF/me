import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
// https://astro.build/config
import react from '@astrojs/react';

// https://astro.build/config
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react(), tailwind()],
});
