import { renderHeader } from '@ligant/bench-chrome';
import { HEADER } from './chrome';
import { faqPanelHtml, jsonLdHtml } from './seo';
export const ROOT = '<div id="root"></div>';
export function applyStaticBlock(html: string): string {
    if (!html.includes(ROOT))
        throw new Error('ligant-static-block: <div id="root"></div> not found in index.html');
    if (!html.includes('</head>'))
        throw new Error('ligant-static-block: </head> not found in index.html');
    return html
        .replace(ROOT, `<div id="root"><div class="app"><header class="masthead">${renderHeader(HEADER)}</header><main id="main">${faqPanelHtml()}</main></div></div>`)
        .replace('</head>', `  ${jsonLdHtml()}\n  </head>`);
}
