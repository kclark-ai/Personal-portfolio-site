// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** Inject <link rel="preload" as="font"> for critical latin WOFF2 files post-build. */
function injectFontPreloads() {
  return {
    name: 'inject-font-preloads',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = fileURLToPath(dir);
        const astroDir = join(distPath, '_astro');

        const allFiles = await readdir(astroDir);
        const criticalFonts = allFiles.filter(f =>
          f.endsWith('.woff2') && (
            /^inter-latin-wght-normal\./.test(f) ||
            /^fraunces-latin-standard-normal\./.test(f) ||
            /^fraunces-latin-standard-italic\./.test(f)
          )
        );

        if (!criticalFonts.length) return;

        const preloadTags = criticalFonts
          .map(f => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/_astro/${f}">`)
          .join('');

        async function* walkHtml(dir) {
          for (const entry of await readdir(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) yield* walkHtml(full);
            else if (entry.name.endsWith('.html')) yield full;
          }
        }

        for await (const htmlFile of walkHtml(distPath)) {
          const html = await readFile(htmlFile, 'utf-8');
          if (!html.includes('<link rel="stylesheet"')) continue;
          const updated = html.replace(
            '<link rel="stylesheet"',
            `${preloadTags}<link rel="stylesheet"`
          );
          await writeFile(htmlFile, updated);
        }
      },
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), injectFontPreloads()],
});
