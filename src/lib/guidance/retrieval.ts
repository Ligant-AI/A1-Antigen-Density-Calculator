import { NORMALISATIONS, STOPWORDS, TERM_TO_GROUP, stem } from './synonyms';
import type { AnchorId, GuidanceEntry, ToolContext } from './types';
import { plainText } from './types';
const K1 = 1.2;
const B = 0.75;
const TITLE_WEIGHT = 2.5;
const EXPANSION_WEIGHT = 0.45;
const ANCHOR_BOOST = 1.6;
const COVERAGE_SYNONYM_CREDIT = 0.75;
const RELATIVE_FLOOR = 0.25;
const MIN_QUERY_COVERAGE = 0.55;
const KIND_MATCH_BOOST = 1.45;
const DEFAULT_LIMIT = 4;
const DEFINITIONAL = [
    /\bwhat (is|are|was|were)\b/i,
    /\bwhat (a|an|the)\b[^?]*\bis\b/i,
    /\btell me\b/i,
    /\bwhat does\b[^?]*\bmean\b/i,
    /\bwhat.*\bfor\b/i,
    /\bwhy\b/i,
    /\bexplain\b/i,
    /\bdefine\b/i,
    /\bmeaning of\b/i,
    /\bpurpose of\b/i,
];
export function questionIntent(query: string): 'definition' | 'practice' {
    if (/\b(my|mine|our)\b/i.test(query))
        return 'practice';
    return DEFINITIONAL.some((pattern) => pattern.test(query)) ? 'definition' : 'practice';
}
export function tokenisePairs(text: string): {
    written: string;
    term: string;
}[] {
    let normalised = text;
    for (const [pattern, replacement] of NORMALISATIONS) {
        normalised = normalised.replace(pattern, replacement);
    }
    return normalised
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
        .map((written) => ({ written, term: stem(written) }));
}
export function tokenise(text: string): string[] {
    return tokenisePairs(text).map((pair) => pair.term);
}
interface Passage {
    entry: GuidanceEntry;
    frequencies: Map<string, number>;
    length: number;
}
export interface RetrievalIndex {
    passages: Passage[];
    idf: Map<string, number>;
    averageLength: number;
    unknownTermIdf: number;
}
function addTerm(into: Map<string, number>, term: string, weight: number) {
    into.set(term, (into.get(term) ?? 0) + weight);
}
export function buildIndex(corpus: readonly GuidanceEntry[]): RetrievalIndex {
    const passages: Passage[] = corpus.map((entry) => {
        const frequencies = new Map<string, number>();
        let length = 0;
        const fields: [
            string,
            number
        ][] = [
            [entry.title, TITLE_WEIGHT],
            [plainText(entry), 1],
        ];
        for (const [text, fieldWeight] of fields) {
            for (const token of tokenise(text)) {
                addTerm(frequencies, token, fieldWeight);
                length += fieldWeight;
                const group = TERM_TO_GROUP.get(token);
                if (group)
                    addTerm(frequencies, group, fieldWeight);
            }
        }
        return { entry, frequencies, length };
    });
    const documentCount = passages.length;
    const containing = new Map<string, number>();
    for (const passage of passages) {
        for (const term of passage.frequencies.keys()) {
            containing.set(term, (containing.get(term) ?? 0) + 1);
        }
    }
    const idf = new Map<string, number>();
    for (const [term, count] of containing) {
        idf.set(term, Math.log(1 + (documentCount - count + 0.5) / (count + 0.5)));
    }
    const totalLength = passages.reduce((sum, p) => sum + p.length, 0);
    const rarest = idf.size > 0 ? Math.max(...idf.values()) : 1;
    return {
        passages,
        idf,
        averageLength: documentCount > 0 ? totalLength / documentCount : 0,
        unknownTermIdf: rarest,
    };
}
export function expandQuery(query: string): Map<string, number> {
    const weights = new Map<string, number>();
    for (const token of tokenise(query)) {
        weights.set(token, Math.max(weights.get(token) ?? 0, 1));
        const group = TERM_TO_GROUP.get(token);
        if (group) {
            weights.set(group, Math.max(weights.get(group) ?? 0, EXPANSION_WEIGHT));
        }
    }
    return weights;
}
export interface Match {
    entry: GuidanceEntry;
    score: number;
    scope: 'card' | 'suite';
    matched: string[];
    coverage: number;
}
export interface SearchOptions {
    context: ToolContext;
    anchor?: AnchorId;
    limit?: number;
}
export function search(index: RetrievalIndex, query: string, options: SearchOptions): Match[] {
    const weights = expandQuery(query);
    if (weights.size === 0)
        return [];
    const intent = questionIntent(query);
    const written = new Map<string, string>();
    for (const pair of tokenisePairs(query)) {
        if (!written.has(pair.term))
            written.set(pair.term, pair.written);
    }
    const contentTerms = [...weights]
        .filter(([term]) => !term.startsWith('g.'))
        .map(([term, weight]) => ({
        term,
        group: TERM_TO_GROUP.get(term),
        potential: weight * (index.idf.get(term) ?? index.unknownTermIdf),
    }));
    const queryIdf = contentTerms.reduce((sum, t) => sum + t.potential, 0);
    const matches: Match[] = [];
    for (const passage of index.passages) {
        const { entry } = passage;
        if (entry.when && !entry.when(options.context))
            continue;
        let score = 0;
        const matched: string[] = [];
        for (const [term, queryWeight] of weights) {
            const frequency = passage.frequencies.get(term);
            if (!frequency)
                continue;
            const idf = index.idf.get(term) ?? 0;
            if (idf <= 0)
                continue;
            const normalised = frequency * (K1 + 1) /
                (frequency + K1 * (1 - B + (B * passage.length) / (index.averageLength || 1)));
            score += queryWeight * idf * normalised;
            if (!term.startsWith('g.'))
                matched.push(written.get(term) ?? term);
        }
        if (score <= 0)
            continue;
        let coveredIdf = 0;
        for (const t of contentTerms) {
            if (passage.frequencies.has(t.term))
                coveredIdf += t.potential;
            else if (t.group && passage.frequencies.has(t.group)) {
                coveredIdf += t.potential * COVERAGE_SYNONYM_CREDIT;
            }
        }
        const coverage = queryIdf > 0 ? coveredIdf / queryIdf : 1;
        if (coverage < MIN_QUERY_COVERAGE)
            continue;
        const scope: Match['scope'] = options.anchor !== undefined && entry.anchor === options.anchor ? 'card' : 'suite';
        if (scope === 'card')
            score *= ANCHOR_BOOST;
        if ((entry.kind ?? 'practice') === intent)
            score *= KIND_MATCH_BOOST;
        matches.push({ entry, score, scope, matched: matched.sort(), coverage });
    }
    if (matches.length === 0)
        return [];
    matches.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
    const floor = matches[0].score * RELATIVE_FLOOR;
    return matches.filter((m) => m.score >= floor).slice(0, options.limit ?? DEFAULT_LIMIT);
}
export const NO_MATCH_MESSAGE = 'The guidance here does not cover that yet. Nothing in this answer is generated, so rather than guess, the tool says so.';
