/**
 * What this tool supplies to the suite's shared header and footer
 * (@ligant/bench-chrome). Everything else in them is the suite's, written once.
 *
 * Each reference is in three pieces, so what is shown and what is copied cannot
 * differ. Two works, and a reference list wants both: the paper for the method,
 * the software for the thing that produced the number. The paper is first
 * because it is the one a reader of the literature is looking for. Identifiers
 * are bare rather than doi.org links, because the bundle embeds no origin it
 * does not have to.
 */
import type { FooterOptions, HeaderOptions } from '@ligant/bench-chrome'
import {
  APP_VERSION,
  CITATION_DOI,
  PAPER_DOI,
  PAPER_TITLE,
  RELEASE_YEAR,
  REPO_URL,
  SITE_URL,
  TOOL_PATH,
} from './site'

export const HEADER: HeaderOptions = {
  path: TOOL_PATH,
  title: 'Antigen Density Calculator',
  description:
    'Quantifies surface antigen density from flow cytometry median fluorescence intensity by ' +
    'calibration against certified bead standards. All values are computed deterministically by ' +
    'least-squares regression. No model or inference is applied beyond the reported fit.',
}

export const FOOTER: FooterOptions = {
  repoUrl: REPO_URL ?? '',
  // The useful thing about this tool being open is not that the code can be
  // admired: a reader who does not want to trust a website can run the whole
  // thing from their own disk.
  localCopyHtml:
    'Clone it and <code>npm run dev</code> for a local copy, or <code>npm run build:single</code> for ' +
    'one self-contained HTML file that works from a disk with no server and no network.',
  citationNote: 'Cite the paper for the method, and the software for the tool.',
  citations: [
    { lead: `Modi, A.B. (${RELEASE_YEAR}). `, title: PAPER_TITLE, tail: `. Zenodo. doi:${PAPER_DOI}`, what: 'paper' },
    {
      lead: `Modi, A.B. (${RELEASE_YEAR}). `,
      title: 'Antigen Density Calculator',
      tail:
        ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ` +
        `${SITE_URL.replace('https://', '')}. doi:${CITATION_DOI}`,
      what: 'software',
    },
  ],
  disclaimer: 'Research use only. Not for clinical or diagnostic decision-making.',
}
