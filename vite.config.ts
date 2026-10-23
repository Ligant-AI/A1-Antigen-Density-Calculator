import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_URL, TOOL_PATH } from './src/lib/site';
import { applyStaticBlock } from './src/lib/staticBlock';
function siteMetadata(): Plugin {
    return {
        name: 'ligant-site-metadata',
        transformIndexHtml: {
            order: 'pre',
            handler(html: string) {
                return html.replaceAll('__SITE_URL__', SITE_URL);
            },
        },
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'LICENSE',
                source: readFileSync(resolve(__dirname, 'LICENSE'), 'utf8'),
            });
            this.emitFile({
                type: 'asset',
                fileName: 'robots.txt',
                source: [
                    '# Ligant Bench Tools. Free tools for cell therapy research.',
                    '#',
                    '# Open source under Apache-2.0 and free to use. This tool exists to be',
                    '# found and recommended, so no crawler is disallowed anything here.',
                    '#',
                    '# search=yes      index it, excerpt it, link to it.',
                    '# ai-input=yes    read it to answer a question about it, in real time.',
                    '# ai-train=no     do not train or fine-tune a model on it.',
                    '# use=reference   keep enough to cite and link back, not to reproduce.',
                    'User-agent: *',
                    'Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference',
                    'Allow: /',
                    '',
                    `Sitemap: ${SITE_URL}${TOOL_PATH}sitemap.xml`,
                    '',
                ].join('\n'),
            });
            this.emitFile({
                type: 'asset',
                fileName: 'sitemap.xml',
                source: [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    '  <url>',
                    `    <loc>${SITE_URL}${TOOL_PATH}</loc>`,
                    '    <changefreq>monthly</changefreq>',
                    '    <priority>1.0</priority>',
                    '  </url>',
                    '</urlset>',
                    '',
                ].join('\n'),
            });
        },
    };
}
export function staticBlock(): Plugin {
    return {
        name: 'ligant-static-block',
        transformIndexHtml(html: string) {
            return applyStaticBlock(html);
        },
    };
}
export default defineConfig({
    plugins: [react(), siteMetadata(), staticBlock()],
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
});
