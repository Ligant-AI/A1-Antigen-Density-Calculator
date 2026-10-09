/**
 * Where the suite lives, and what is in it.
 *
 * Single source of truth for this tool's address, version and citation. The
 * sitemap, the canonical links and the social metadata are derived from this.
 * Plain data with no browser dependency, because the build imports it too.
 *
 * The check scripts read this file TEXTUALLY, by regular expression, because
 * they are plain Node. Every constant below is assigned a single-quoted string
 * literal on one line. A reformat that wraps one across two lines does not fail
 * the typecheck; it makes a check silently stop finding what it is checking.
 */

export const SITE_URL = 'https://benchtools.ligant.ai'

/** This tool's own mount point under `SITE_URL`, where the Worker proxies it. */
export const TOOL_PATH = '/antigen-density-calculator/'

/*
 * The parent site, the Privacy Policy and the list of tools belong to the
 * suite's shared header and footer (@ligant/bench-chrome), not to this file.
 */

/**
 * The released version, cited on the page and stamped into every export.
 *
 * Beside the origin rather than in the component that happened to need it
 * first: a citation and an exported CSV that disagree about which version
 * produced a figure are worse than either alone.
 */
export const APP_VERSION = 'v1.1.0'

/** The year the citation carries. Fixed, not derived from the clock, so the
 *  page renders the same for every reader and for every build. */
export const RELEASE_YEAR = 2026

/**
 * The concept DOI, which Zenodo resolves to the newest archived version.
 *
 * The version DOI names one release and stops being current the moment there is
 * another. A reader who follows a citation wants the software, not the release
 * that happened to be current when the citation was written, so this is the one
 * the footer prints and CITATION.cff states. The version DOI is recorded in
 * CITATION.cff under identifiers, where it names the release it belongs to.
 *
 * Written as a bare identifier rather than a doi.org URL on purpose. The built
 * bundle is asserted to embed no origin other than this site and the repository,
 * and a DOI resolves perfectly well without one.
 */
export const CITATION_DOI = '10.5281/zenodo.22259176'

/**
 * The paper this tool implements, and the citation a reader should prefer.
 *
 * Two different works, and the distinction matters to whoever is writing a
 * reference list. The software DOI above identifies the thing that computed
 * their number. This identifies the method, and the argument for why a
 * goodness-of-fit statistic is not sufficient evidence that a calibration is
 * sound, which is the reason several of this tool's refusals exist at all.
 *
 * This is the version DOI, not the concept DOI, which is the opposite of the
 * choice made for the software above. A reader of the software wants whatever
 * version is current; a reader of a paper wants the text that was written, and
 * v1.0 is the citation of record. The concept DOI, 10.5281/zenodo.22283646,
 * resolves to the newest revision and is recorded in CITATION.cff.
 *
 * Written bare rather than as a doi.org URL, because the bundle embeds no
 * origin it does not have to.
 */
export const PAPER_DOI = '10.5281/zenodo.22283647'
export const PAPER_TITLE =
  'Goodness-of-fit statistics do not detect consequential calibration failures in ' +
  'flow cytometric antigen density quantification'

/**
 * Where the source is, once there is somewhere to send a reader.
 *
 * The footer asserts Apache 2.0 and points at a LICENSE file "distributed with
 * this software" without saying where that software can be found. A licence
 * assertion a reader cannot check is not verifiable, which is what a reviewer
 * called blocking, and it stays open until this is set.
 *
 * One public repository, which is both where the work is done and where a
 * reader is sent. This was null until there was somewhere real to send them,
 * because pointing at an address a reader cannot reach would have converted an
 * unbacked claim into a broken one.
 *
 * Typed with the absence still, because that is what makes the guard work:
 * scripts/check-network.mjs asserts the true thing in either state. With no URL
 * the footer must link nothing; with one, a footer claiming open source must
 * link it. scripts/check-privacy.mjs allows this exact value and nothing wider,
 * reading it from here rather than pattern-matching a host.
 *
 * Nothing on the page loads from it. It is an address a reader may choose to
 * follow, which is also why no check here can confirm it resolves: nothing
 * here fetches another origin, and that includes to test its own links.
 */
export const REPO_URL: string | null = 'https://github.com/Ligant-AI/A1-Antigen-Density-Calculator'
