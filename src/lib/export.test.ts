import { describe, it, expect } from 'vitest'
import { buildResultsCsv, substituteCssVars, summaryLine, type ExportPayload } from './export'
import {
  DEFAULT_OPTIONS,
  captureCompatibilityFlags,
  fitStandardCurve,
  quantifyWithCalibration,
  type BeadStandard,
  type CurveResult,
  type Flag,
  type QuantifyOptions,
  type Sample,
} from './quantify'

const RESOLVED = new Map([
  ['series-evidence', '#0D7C66'],
  ['surface', '#FFFFFF'],
  // The value that broke the export: a font stack containing double quotes.
  ['mono', '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'],
  ['band-fill', 'rgba(13, 124, 102, 0.14)'],
])

describe('substituteCssVars', () => {
  it('replaces a single reference', () => {
    expect(substituteCssVars('var(--series-evidence)', RESOLVED)).toBe('#0D7C66')
  })

  it('replaces every reference in a compound value', () => {
    expect(substituteCssVars('1px solid var(--surface) var(--series-evidence)', RESOLVED)).toBe(
      '1px solid #FFFFFF #0D7C66',
    )
  })

  it('returns a font stack complete with its quotes, for the serialiser to escape', () => {
    const out = substituteCssVars('var(--mono)', RESOLVED)
    expect(out).toContain('"IBM Plex Mono"')
    expect(out).toContain('monospace')
  })

  it('leaves an unknown reference untouched rather than emitting empty', () => {
    expect(substituteCssVars('var(--not-a-token)', RESOLVED)).toBe('var(--not-a-token)')
  })

  it('passes through a value with no references', () => {
    expect(substituteCssVars('#123456', RESOLVED)).toBe('#123456')
    expect(substituteCssVars('', RESOLVED)).toBe('')
  })

  it('handles values holding commas and parentheses', () => {
    expect(substituteCssVars('var(--band-fill)', RESOLVED)).toBe('rgba(13, 124, 102, 0.14)')
  })
})

// The worked example, as the page loads it.
const BEADS: BeadStandard[] = [
  { id: 'd0', label: 'Blank', mfi: 210, assigned: null, included: false },
  { id: 'd1', label: 'Population 1', mfi: 2_050, assigned: 8_300, included: true },
  { id: 'd2', label: 'Population 2', mfi: 12_900, assigned: 51_000, included: true },
  { id: 'd3', label: 'Population 3', mfi: 39_500, assigned: 175_000, included: true },
  { id: 'd4', label: 'Population 4', mfi: 121_000, assigned: 512_000, included: true },
]
const SAMPLES: Sample[] = [
  { id: 'ds1', label: 'CD19 (NALM-6)', mfi: 8_900, controlMfi: 240 },
  { id: 'ds2', label: 'HER2 (SK-BR-3)', mfi: 62_000, controlMfi: 310 },
  { id: 'ds3', label: 'HER2 (primary keratinocyte)', mfi: 420, controlMfi: 260 },
]
const OPTIONS: QuantifyOptions = { ...DEFAULT_OPTIONS, antibodyHost: 'mouse', saturationConfirmed: true }
const CURVE = fitStandardCurve(BEADS) as CurveResult

function payload(extra: readonly Flag[] = []): ExportPayload {
  return {
    kitName: 'Quantum Simply Cellular (anti-Mouse IgG)',
    lotId: '',
    assignedLabel: 'Assigned ABC',
    options: OPTIONS,
    standards: BEADS,
    curve: CURVE,
    samples: SAMPLES.map((sample) => ({
      sample,
      result: quantifyWithCalibration(sample, CURVE, OPTIONS, extra),
    })),
    appVersion: 'test',
  }
}

const HEADER = [
  'Sample', 'Sample MFI', 'Control MFI', 'Gross ABC', 'Background ABC', 'Net ABC',
  'Net ABC (as reported)', 'CI lower', 'CI upper',
  'Inferred antigen sites low', 'Inferred antigen sites high', 'flag_status',
]

/** Split one CSV line, honouring quoted cells such as "35,636". */
function cellsOf(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { cells.push(cell); cell = '' }
    else cell += ch
  }
  cells.push(cell)
  return cells
}

/** One sample row of the CSV, keyed by the columns above. */
function rowFor(csv: string, label: string): Record<string, string> {
  const line = csv.split('\n').find((l) => l.startsWith(label + ','))
  if (!line) throw new Error(`no row for ${label}`)
  const cells = cellsOf(line)
  return Object.fromEntries(HEADER.map((h, i) => [h, cells[i]]))
}

describe('the CSV export of a do-not-report result', () => {
  const csv = buildResultsCsv(payload(), new Date(0))

  it('carries no net figure, interval or inferred sites for the keratinocyte', () => {
    const row = rowFor(csv, 'HER2 (primary keratinocyte)')
    expect(row['flag_status']).toBe('do_not_report')
    expect(row['Net ABC']).toBe('')
    expect(row['Net ABC (as reported)']).toBe('not reported')
    expect(row['CI lower']).toBe('')
    expect(row['CI upper']).toBe('')
    expect(row['Inferred antigen sites low']).toBe('')
    expect(row['Inferred antigen sites high']).toBe('')
  })

  it('keeps the gross and background densities that explain the flag', () => {
    const row = rowFor(csv, 'HER2 (primary keratinocyte)')
    expect(Math.round(Number(row['Gross ABC']))).toBe(1_636)
    expect(Math.round(Number(row['Background ABC']))).toBe(1_004)
  })

  it('does not print the withheld figure anywhere in the file', () => {
    const line = csv.split('\n').find((l) => l.startsWith('HER2 (primary keratinocyte),')) ?? ''
    expect(line).not.toMatch(/\b63[12]\b/)
    expect(csv).not.toMatch(/limit of quantification/i)
  })

  it('still reports a reportable sample in full', () => {
    const row = rowFor(csv, 'CD19 (NALM-6)')
    expect(row['flag_status']).not.toBe('do_not_report')
    expect(row['Net ABC (as reported)']).toBe('35,636')
    expect(row['CI lower']).not.toBe('')
  })

  it('carries no figure for any sample under an invalid calibration', () => {
    const invalid = buildResultsCsv(payload(captureCompatibilityFlags('mouse', 'rat')), new Date(0))
    for (const s of SAMPLES) {
      const row = rowFor(invalid, s.label)
      expect(row['flag_status']).toBe('do_not_report')
      expect(row['Net ABC']).toBe('')
      expect(row['CI lower']).toBe('')
      expect(row['Inferred antigen sites low']).toBe('')
    }
  })
})

describe('the notebook summary line', () => {
  const results = payload().samples

  it('says not reported for the keratinocyte, with no figure and no interval', () => {
    const { sample, result } = results[2]
    const line = summaryLine(sample.label, result, OPTIONS.confidenceLevel)
    expect(line).toContain('not reported')
    expect(line).not.toMatch(/ABC|CI|\d{3}/)
    expect(line).not.toContain('below detection')
  })

  it('gives a reportable sample its figure and interval', () => {
    const { sample, result } = results[0]
    expect(summaryLine(sample.label, result, OPTIONS.confidenceLevel)).toMatch(/^CD19 \(NALM-6\): 35,636 ABC \(95% CI /)
  })
})
