import { escapeHtml as esc } from '@ligant/bench-chrome';
import { APP_VERSION, REPO_URL, SITE_URL, TOOL_PATH } from './site';
export const TOOL_NAME = 'Antigen Density Calculator';
export const DEPLOYED_URL = `${SITE_URL}${TOOL_PATH}`;
export interface FaqItem {
    q: string;
    a: string;
}
export const SEO = {
    title: 'Ligant · Antigen Density Calculator: Antibody Binding Capacity',
    h1: 'Antigen density calculator: antibody binding capacity from flow cytometry MFI',
    lead: 'This tool turns the median fluorescence intensity (MFI) of your stained cells into antibody binding capacity (ABC), the number of antibody molecules bound per cell, by reading it off a standard curve built from beads of known, certified capacity. It subtracts your control in the background mode you declare, or not at all if you choose None, gives a confidence interval on the fitted calibration line, not on the sample, and says in words when a result should not be reported. It does not verify the standard or its lot, does not observe how the beads and cells were acquired, and cannot detect beads and cells acquired under different cytometer settings, or a stain below saturation, which makes every ABC a lower bound. Antibody binding capacity is not antigen copy number.',
    description: 'Free flow cytometry calculator: converts sample MFI to antibody binding capacity (ABC) from a bead standard curve, and withholds what your data cannot support.',
    faqHeading: 'Questions and answers',
    faq: [
        {
            q: 'How do I calculate antibody binding capacity from MFI with calibration beads?',
            a: "Pick the bead kit and, if you can, record the bead lot. The kit tells the tool whether the beads certify antibody binding capacity or PE molecules per bead; the lot is a label from the vial, is not used in the arithmetic, and is written into the export so the result can be traced. Enter at least three bead populations. For each, type the MFI you measured and the certified value from the certificate of analysis for your lot, never from memory or a paper. Enter each sample's stained MFI and, if you have one, its control MFI (isotype or FMO). Take every MFI from a live, singlet-gated population, acquired in the same session and at the same settings as the beads. Make the declarations in Analysis settings: the background subtraction mode; the detection antibody, whole IgG (bivalent) or Fab / scFv (1:1); its host species, which is checked against what the capture beads bind; whether the stain was titrated to saturation, answering yes only if it was titrated on both beads and cells; the fluorophore:protein ratio (PE beads only); and the confidence level. Then check the standard curve and any flags first, and read each sample's result after that.",
        },
        {
            q: 'Is antibody binding capacity the same as antigen copy number?',
            a: 'No. Antibody binding capacity is the number of antibody molecules bound per cell. Epitope accessibility, binding valency, conjugate performance and antigen internalization intervene between it and antigen copy number. With a Fab or scFv detection reagent, each bound antibody marks one site, so sites equal the ABC. With whole IgG, each bound antibody may hold one site or two, so sites are shown as a range from the ABC to twice the ABC. That range covers only the sites the antibody engaged. An epitope that was masked, already occupied, or internalized contributes nothing to the measurement, so the total antigen on the cell may exceed the top of that range by any amount: the top of the range is not an upper bound on antigen.',
        },
        {
            q: 'How many bead populations do I need, and when is the standard curve rejected?',
            a: "At least three. With three, the fit leaves one degree of freedom, so one wrong value cannot be found; add populations if the kit has them, and the curvature test needs six. Leave out a blank population by clearing its certified value or unticking it. No figure is reported if a bead MFI or certified value is impossible, if the standard spans more than 6 decades of MFI, if every certified value equals its MFI, if the populations fit with no scatter at all, if the slope is negative, if R² is below 0.98 (a minimum chosen for this tool, not a vendor requirement; R² is a necessary check, not a sufficient one, because a curved standard can pass it), if the certified values do not increase with MFI, or if the detection antibody's host species does not match what the beads capture. A log-log slope outside 0.85 to 1.15, and a curved standard, are flagged but do not stop the figure; for a slope outside the range, check detector saturation and compensation on beads and cells. The flag table on the page lists every flag and whether it stops the figure.",
        },
        {
            q: 'What if my sample is outside the range of the beads, or my control is as bright as the sample?',
            a: 'In both cases the figure is not reported. A sample MFI above or below the beads is outside the calibrated range: do not extrapolate. Add a bead population that brackets the sample, or acquire beads and sample again together at a setting that brings the sample within the beads. Do not dilute the stain to bring it into range: below saturation every ABC is an undercount. A control that equals or exceeds the sample means there is no specific signal: check that the right control was used and the tubes were not swapped. A genuinely negative result is a finding: report it as below detection. A different case is reported: if the stained MFI is within the beads but the reported result, after any control subtraction, is below the ABC of the dimmest bead, the figure is shown with a warning, and you should say so when you report it, because the curve has not been shown to quantify that dim.',
        },
        {
            q: 'How is the control subtracted, and what is the difference between density space and MFI space?',
            a: 'You choose the mode in Analysis settings. Density space reads stained and control off the curve separately and subtracts the two densities, which treats the background as extra bound molecules. MFI space subtracts the control MFI first and converts the difference, which treats the background as extra fluorescence. None reports the stained reading with no correction. Density space is preferred where the log-log slope departs from 1, because the mapping from MFI to ABC is then not proportional. The two agree when the curve slope is close to 1 and the background is small, and the tool tells you when they differ by more than 10%; report which mode you used. When the control accounts for 25% to 50% of the gross density, the figure is reported with a warning. At 50% or more, no figure is reported, and a sample whose background is 90% or more of its gross density is reported as below detection. If the control lies below the lowest bead, a background of 25% or more already stops the figure.',
        },
        {
            q: 'What does the confidence interval cover?',
            a: 'The interval is the confidence interval on the fitted mean response of the calibration line, evaluated at the stained reading and carried through to the reported density. It excludes measurement variability in the sample itself, which needs replicate acquisition to estimate. It also excludes uncertainty in the control reading: the background is subtracted as a point value, so the interval describes the position of the calibration curve rather than the full uncertainty of the difference. Where background is a small fraction of gross density the two are close. As the background fraction rises the interval becomes an approximation, and may be narrower or wider than a fully propagated interval. The confidence level is your choice of 90%, 95% or 99%, with 95% the default.',
        },
        {
            q: 'What can go wrong that the calculator cannot detect?',
            a: 'It cannot tell whether beads and cells were acquired under identical conditions: detector voltages and optical configuration must be unchanged between the two, and no output of this tool will indicate that. It cannot verify the beads or their lot: a fit built from another lot\'s certificate looks sound, which is why the lot is recorded in the export. Unless the detection antibody was titrated to saturation on beads and on cells, every reported ABC is a lower bound, and nothing in the numbers reveals it. Dead and dying cells bind antibody non-specifically and inflate the stained and control channels alike, which subtraction does not remove, so take every MFI from a live, singlet-gated population. Capture beads bind one host\'s immunoglobulin, and anti-immunoglobulin capture reagents cross-react across related hosts to an uncertified degree, so a mismatched detection antibody can still produce a well-fitting curve while the beads bind a fraction of what their assigned values assume; the declared host species is compared with the kit for this reason, and a host recorded as "other" cannot be checked. Antibody binding capacity is not antigen copy number. The density bands (100, 1,000 and 10,000 ABC) are order-of-magnitude reading aids, not cutoffs: CAR activation thresholds depend on the construct and on the effector function assessed.',
        },
        {
            q: 'Is my data uploaded anywhere?',
            a: 'No. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. The page sends an email address only if you choose to submit one in the newsletter signup, and its web analytics counts visits and sees how quickly the page loads, with further analytics only if you allow it in the banner; no analytics ever receives anything you type into this tool.',
        },
        {
            q: 'Is it free?',
            a: 'Yes. It is free to use and open source under the Apache 2.0 licence. Its source code is on GitHub, so you can download it and run it on your own computer.',
        },
    ] as readonly FaqItem[],
    featureList: [
        'Antibody binding capacity for each sample, read off a standard curve fitted to the bead populations you enter',
        'Control subtracted in density space or MFI space, as you declare, or not subtracted',
        'Withholds a figure the entered data cannot support, with the reason in words',
        'Confidence interval on the fitted calibration line, not on the sample',
        'CSV export of the settings, bead lot, inputs, fit, results and version; SVG export of the curve',
    ] as readonly string[],
} as const;
export function faqPanelHtml(): string {
    const body = SEO.faq.map(({ q, a }) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('');
    return `<section class="panel faq-panel" aria-labelledby="faq-heading"><div class="panel-head"><div class="titles"><h2 id="faq-heading">${esc(SEO.faqHeading)}</h2></div></div><div class="panel-body">${body}</div></section>`;
}
export function softwareApplication() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `Ligant · ${TOOL_NAME}`,
        url: DEPLOYED_URL,
        description: SEO.description,
        applicationCategory: 'ScientificApplication',
        operatingSystem: 'Any (runs in a web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0' },
        license: `${DEPLOYED_URL}LICENSE`,
        softwareVersion: APP_VERSION.replace(/^v/, ''),
        ...(REPO_URL !== null ? { codeRepository: REPO_URL } : {}),
        featureList: [...SEO.featureList],
    };
}
export function faqPage() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
}
export function breadcrumbs() {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ligant Bench Tools', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: TOOL_NAME, item: DEPLOYED_URL },
        ],
    };
}
const block = (o: object) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
export function jsonLdHtml(): string {
    return [softwareApplication(), faqPage(), breadcrumbs()].map(block).join('\n    ');
}
