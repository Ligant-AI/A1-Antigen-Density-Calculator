export interface SynonymGroup {
    id: string;
    terms: readonly string[];
}
export const SYNONYM_GROUPS: readonly SynonymGroup[] = [
    { id: 'g.mfi', terms: ['mfi', 'fluorescence', 'intensity', 'signal', 'brightness', 'bright', 'dim', 'median', 'geometric', 'mean', 'channel'] },
    { id: 'g.control', terms: ['control', 'isotype', 'fmo', 'unstained', 'background', 'blank', 'baseline', 'autofluorescence', 'nonspecific'] },
    { id: 'g.bead', terms: ['bead', 'beads', 'standard', 'standards', 'calibrator', 'population', 'populations', 'vial', 'lot', 'certificate'] },
    { id: 'g.density', terms: ['abc', 'density', 'capacity', 'molecules', 'sites', 'antigen', 'target', 'epitope', 'copies'] },
    { id: 'g.curve', terms: ['curve', 'fit', 'fitted', 'regression', 'linear', 'calibration', 'slope', 'intercept'] },
    { id: 'g.range', terms: ['range', 'extrapolate', 'extrapolated', 'outside', 'beyond', 'below', 'above', 'bracket', 'bracketing', 'offscale'] },
    { id: 'g.plateau', terms: ['plateau', 'saturate', 'saturated', 'saturation', 'asymptote', 'top', 'bottom'] },
    { id: 'g.dose', terms: ['ratio', 'concentration', 'titration', 'titrate', 'dilution'] },
    { id: 'g.killing', terms: ['lysis', 'killing', 'kill', 'cytotoxicity', 'cytotoxic', 'death', 'viability', 'specific'] },
    { id: 'g.error', terms: ['transcription', 'transcribed', 'typo', 'transposed', 'mistake', 'error', 'misplaced', 'decimal'] },
    { id: 'g.host', terms: ['host', 'species', 'mouse', 'rat', 'human', 'rabbit', 'humanised', 'capture', 'immunoglobulin', 'igg'] },
    { id: 'g.valency', terms: ['valency', 'bivalent', 'monovalent', 'fab', 'whole', 'binding'] },
    { id: 'g.conjugate', terms: ['fluorophore', 'conjugate', 'fp', 'pe', 'quantibrite', 'phycoerythrin'] },
    { id: 'g.interval', terms: ['confidence', 'interval', 'uncertainty', 'precision', 'replicate', 'replicates'] },
    { id: 'g.goodness', terms: ['r2', 'rsquared', 'goodness', 'quality', 'residual', 'residuals', 'scatter', 'deviation', 'departure'] },
    { id: 'g.curvature', terms: ['curvature', 'bend', 'bent', 'straight', 'nonlinear', 'quadratic', 'drift'] },
    { id: 'g.detector', terms: ['detector', 'voltage', 'pmt', 'gain', 'compensation', 'cytometer', 'acquisition', 'settings'] },
    { id: 'g.gating', terms: ['gate', 'gated', 'gating', 'singlet', 'live', 'dead', 'viable', 'debris'] },
    { id: 'g.subtraction', terms: ['subtract', 'subtracted', 'subtraction', 'correct', 'corrected', 'correction'] },
    { id: 'g.flag', terms: ['flag', 'flagged', 'caution', 'warning', 'alert', 'problem', 'wrong', 'invalid', 'bad', 'poor', 'poorly'] },
    { id: 'g.report', terms: ['report', 'reportable', 'publish', 'manuscript', 'figure', 'notebook', 'thesis'] },
    { id: 'g.export', terms: ['export', 'csv', 'svg', 'download', 'save', 'file'] },
    { id: 'g.privacy', terms: ['privacy', 'private', 'browser', 'local', 'locally', 'storage', 'stored', 'transmitted', 'server', 'cloud', 'sent', 'send', 'sends', 'upload', 'uploaded', 'leaves', 'internet', 'network', 'online', 'anywhere', 'anyone'] },
    { id: 'g.construct', terms: ['car', 'construct', 'scfv', 'affinity', 'hinge', 'costimulatory', 'receptor'] },
    { id: 'g.threshold', terms: ['threshold', 'band', 'bands', 'cutoff', 'activation', 'escape'] },
    { id: 'g.cells', terms: ['cell', 'cells', 'tumour', 'tumor', 'sample', 'samples', 'line', 'primary'] },
    { id: 'g.count', terms: ['few', 'fewer', 'more', 'number', 'points', 'levels', 'degrees', 'freedom'] },
    { id: 'g.detection', terms: ['detection', 'detectable', 'limit', 'quantification', 'sensitivity', 'noise'] },
    { id: 'g.compute', terms: ['calculate', 'calculation', 'compute', 'computed', 'formula', 'equation', 'arithmetic', 'derive', 'derived', 'work'] },
    { id: 'g.modality', terms: ['modality', 'adoptive', 'til', 'nk', 'tcr', 'lymphocyte', 'lymphocytes', 'therapy', 'product', 'infused', 'transduced', 'effector'] },
    { id: 'g.units', terms: ['unit', 'units', 'log', 'log10', 'decade', 'decades', 'scale', 'percent', 'percentage'] },
] as const;
export const NORMALISATIONS: readonly (readonly [
    RegExp,
    string
])[] = [
    [/r\s*(²|\^?2|\bsquared\b)/gi, ' r2 '],
    [/\bf\s*[:/]\s*p\b/gi, ' fp '],
    [/\blog\s*10\b/gi, ' log10 '],
    [/\bnon[\s-]specific\b/gi, ' nonspecific '],
    [/\boff[\s-]scale\b/gi, ' offscale '],
    [/\bdegrees? of freedom\b/gi, ' degrees freedom '],
] as const;
export const STOPWORDS: ReadonlySet<string> = new Set([
    'a', 'an', 'and', 'anything', 'are', 'as', 'at', 'be', 'but', 'by', 'can',
    'do', 'does', 'everything', 'for', 'from', 'has', 'have', 'how', 'i', 'if',
    'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'should', 'so',
    'something', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
    'they', 'this', 'to', 'use', 'used', 'using', 'was', 'were', 'what', 'when',
    'where', 'which', 'why', 'will', 'with', 'would', 'you', 'your',
    'define', 'defines', 'describe', 'describes', 'explain', 'explains',
    'purpose', 'tell', 'tells',
    'also', 'another', 'any', 'both', 'come', 'each', 'get', 'gets', 'give',
    'gives', 'go', 'goes', 'just', 'know', 'like', 'long', 'look', 'looks',
    'looking', 'make', 'makes', 'many', 'much', 'run', 'runs', 'same', 'say',
    'says', 'see', 'seen', 'short', 'still', 'take', 'takes', 'thing', 'things',
    'very', 'want', 'way', 'well',
]);
function undouble(word: string): string {
    const n = word.length;
    if (n < 3)
        return word;
    const last = word[n - 1];
    if (last !== word[n - 2] || 'lsz'.includes(last))
        return word;
    return word.slice(0, -1);
}
export function stem(token: string): string {
    if (token.length <= 3 || /\d/.test(token))
        return token;
    let word = token;
    if (word.endsWith('ies') && word.length > 4)
        word = `${word.slice(0, -3)}y`;
    else if (word.endsWith('sses'))
        word = word.slice(0, -2);
    else if (word.endsWith('ing') && word.length > 5)
        word = undouble(word.slice(0, -3));
    else if (word.endsWith('ed') && word.length > 4)
        word = undouble(word.slice(0, -2));
    else if (word.endsWith('es') && word.length > 4)
        word = word.slice(0, -1);
    else if (word.endsWith('s') && !word.endsWith('ss'))
        word = word.slice(0, -1);
    if (word.endsWith('e') && word.length > 3)
        word = word.slice(0, -1);
    return word.length >= 3 ? word : token;
}
export const TERM_TO_GROUP: ReadonlyMap<string, string> = new Map(SYNONYM_GROUPS.flatMap((group) => group.terms.map((term) => [stem(term), group.id] as const)));
