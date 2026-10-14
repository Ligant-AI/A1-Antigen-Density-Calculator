import type { FooterOptions, HeaderOptions } from '@ligant/bench-chrome';
import { APP_VERSION, CITATION_DOI, RELEASE_YEAR, REPO_URL, SITE_URL, TOOL_PATH, } from './site';
export const HEADER: HeaderOptions = {
    path: TOOL_PATH,
    title: 'Antigen Density Calculator',
    description: 'Quantifies surface antigen density from flow cytometry median fluorescence intensity by ' +
        'calibration against certified bead standards. Every value is computed deterministically by a ' +
        'least-squares fit you can read. No model and no inference is applied to any reported number.',
};
export const FOOTER: FooterOptions = {
    repoUrl: REPO_URL ?? '',
    localCopyHtml: 'Clone it and <code>npm run dev</code> for a local copy, or <code>npm run build:single</code> for ' +
        'one self-contained HTML file that works from a disk with no server and no network.',
    citationNote: 'Cite the software as below.',
    citationFootnote: 'References are given as text rather than links, so the page itself sends no visit to a publisher.',
    citations: [
        {
            lead: `Modi, A.B. (${RELEASE_YEAR}). `,
            title: 'Antigen Density Calculator',
            tail: ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ` +
                `${SITE_URL.replace('https://', '')}. doi:${CITATION_DOI}`,
            what: 'software',
        },
    ],
    disclaimer: 'Research use only. Not qualified for GxP decision-making.',
};
