import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.noahlandesberg.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  // Jost (a libre Futura clone) for UI chrome — nav, dates, post-meta.
  // Astro downloads and self-hosts it at build time, so there's no runtime
  // request to Google and every visitor gets the identical font. Exposed as
  // the --font-jost CSS variable, consumed via --font-ui in global.css.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Jost',
      cssVariable: '--font-jost',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
