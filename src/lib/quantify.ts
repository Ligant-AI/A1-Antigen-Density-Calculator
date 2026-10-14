import { linearRegression, meanResponseInterval, quadraticCurvature, type CurvatureTest, type LinearFit, } from './stats';
import type { Flag, FlagLevel } from './flags';
import { SCIENTIFIC_ABOVE, formatNumber } from './format';
import { ASSIGNED_IMPOSSIBLE, MFI_IMPOSSIBLE, MFI_IMPOSSIBLE_LOW, checkMfi } from './validate';
export type { Flag, FlagLevel };
export type StandardKind = 'abc' | 'pe-molecules';
export type HostSpecies = 'unstated' | 'mouse' | 'human' | 'rat' | 'rabbit' | 'other';
export type BackgroundMode = 'abc' | 'mfi' | 'none';
export type Valency = 'monovalent' | 'bivalent';
export interface BeadStandard {
    id: string;
    label: string;
    mfi: number | null;
    assigned: number | null;
    included: boolean;
}
export interface Sample {
    id: string;
    label: string;
    mfi: number | null;
    controlMfi: number | null;
}
export interface QuantifyOptions {
    standardKind: StandardKind;
    fpRatio: number;
    backgroundMode: BackgroundMode;
    valency: Valency;
    antibodyHost: HostSpecies;
    saturationConfirmed: boolean;
    confidenceLevel: number;
}
export const DEFAULT_OPTIONS: QuantifyOptions = {
    standardKind: 'abc',
    fpRatio: 1,
    backgroundMode: 'abc',
    valency: 'bivalent',
    antibodyHost: 'unstated',
    saturationConfirmed: false,
    confidenceLevel: 0.95,
};
export interface CurveResult {
    fit: LinearFit;
    logMfi: number[];
    logAssigned: number[];
    mfiRange: [
        number,
        number
    ];
    assignedRange: [
        number,
        number
    ];
    residuals: CurveResidual[];
    curvature: CurvatureTest | null;
    flags: Flag[];
}
export interface CurveResidual {
    label: string;
    logResidual: number;
    percent: number;
}
export interface SampleResult {
    id: string;
    label: string;
    grossAbc: number | null;
    controlAbc: number | null;
    netAbc: number | null;
    withheld: boolean;
    backgroundFraction: number | null;
    sampleInRange: boolean | null;
    controlInRange: boolean | null;
    modeDivergence: number | null;
    lower: number | null;
    upper: number | null;
    sitesLow: number | null;
    sitesHigh: number | null;
    flags: Flag[];
    calibrationFlags: Flag[];
}
const SLOPE_TOLERANCE = 0.15;
const MIN_R2 = 0.98;
const MAX_STANDARD_DECADES = 6;
const MIN_CURVATURE_POPULATIONS = 6;
const CURVATURE_ALPHA = 0.05;
export function fitStandardCurve(standards: BeadStandard[]): CurveResult | {
    error: string;
} {
    const usable = standards.filter((s) => s.included &&
        s.mfi !== null &&
        s.assigned !== null &&
        s.mfi > 0 &&
        s.assigned > 0);
    if (usable.length < 3) {
        return {
            error: `Need at least 3 bead populations with positive MFI and assigned value; have ${usable.length}.`,
        };
    }
    const logMfi = usable.map((s) => Math.log10(s.mfi as number));
    const logAssigned = usable.map((s) => Math.log10(s.assigned as number));
    let fit: LinearFit;
    try {
        fit = linearRegression(logMfi, logAssigned);
    }
    catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
    const flags: Flag[] = [];
    const impossible = usable.flatMap((s) => {
        const label = s.label || 'An unnamed population';
        const mfi = s.mfi as number;
        const assigned = s.assigned as number;
        if (mfi >= MFI_IMPOSSIBLE || mfi < MFI_IMPOSSIBLE_LOW) {
            return [`${label} (intensity ${formatNumber(mfi)})`];
        }
        if (assigned >= ASSIGNED_IMPOSSIBLE || assigned < MFI_IMPOSSIBLE_LOW) {
            return [`${label} (certified value ${formatNumber(assigned)})`];
        }
        return [];
    });
    if (impossible.length > 0) {
        const one = impossible.length === 1;
        flags.push({
            level: 'critical',
            message: `${impossible.join(', ')} ${one ? 'holds a value' : 'hold values'} outside anything a cytometer reports or a certificate of analysis lists, so ${one ? 'it is not a measurement' : 'they are not measurements'}.`,
            remedy: 'A value this size is a transcription artefact rather than a reading: a pasted exponent, a formula result, or a cell carried over from another sheet. The fit is levered by it, so nothing derived from this calibration can be reported until it is corrected or the population is unticked.',
        });
    }
    const logMfiRange = Math.max(...logMfi) - Math.min(...logMfi);
    if (impossible.length === 0 && logMfiRange > MAX_STANDARD_DECADES) {
        const order = [...usable].sort((a, b) => (a.mfi as number) - (b.mfi as number));
        const dimmest = order[0];
        const brightest = order[order.length - 1];
        flags.push({
            level: 'critical',
            message: `The populations span ${logMfiRange.toFixed(1)} decades of intensity, from ${dimmest.label || 'an unnamed population'} at ${formatNumber(dimmest.mfi as number)} to ${brightest.label || 'an unnamed population'} at ${formatNumber(brightest.mfi as number)}. No bead set covers that range, and no detector reports it at one setting.`,
            remedy: 'These readings did not come from one acquisition. The usual cause is a misplaced decimal point or an exponent in one population; the other is two standards pasted into one table. Correct the outlying row or untick it.',
        });
    }
    if (impossible.length === 0) {
        const odd = usable.filter((s) => checkMfi(s.mfi) !== null);
        if (odd.length > 0 && odd.length < usable.length) {
            const names = odd.map((s) => `${s.label || 'an unnamed population'} at ${formatNumber(s.mfi as number)}`);
            const one = odd.length === 1;
            flags.push({
                level: 'warning',
                message: `${names.join(', ')} ${one ? 'is the only population whose' : 'are the only populations whose'} intensity lies outside what a cytometer reports, while the other ${usable.length - odd.length} lie inside it.`,
                remedy: 'One population out of range is a transcription error more often than a property of the standard. Where its certified value was scaled with it, the point moves along the calibration line, so the fit stays excellent and nothing else here will remark on it. Check this row against the acquisition record.',
            });
        }
    }
    if (usable.every((s) => s.assigned === s.mfi)) {
        flags.push({
            level: 'critical',
            message: 'Every certified value is the same number as its intensity, so this is not a calibration. A fit through it returns the intensity unchanged, and would report raw MFI as though it were antibody binding capacity.',
            remedy: 'This is what a two column paste produces when both columns are intensities. Enter the certified values from the vial or its certificate of analysis in the second column.',
        });
    }
    else if (fit.residualSE < DEGENERATE_SE) {
        flags.push({
            level: 'critical',
            message: `The populations fall exactly on a straight line, with no residual scatter at all (residual standard error ${fit.residualSE.toExponential(1)}). Real bead data carries pipetting, gating and lot variation, so this describes constructed numbers rather than a measurement.`,
            remedy: 'The confidence interval on any result from this curve would be zero width, which is not a claim the data can support. Check that the certified values came from the certificate of analysis and were not derived from the intensities.',
        });
    }
    if (usable.length === 3) {
        flags.push({
            level: 'warning',
            message: 'The fit rests on three populations, leaving one degree of freedom. The confidence band is weakly determined and an error in any single population is unidentifiable.',
            remedy: 'Include a fourth bead population wherever the kit provides one. Three is the minimum that permits a fit, not a sufficient number for a quantitative one.',
        });
    }
    if (fit.slope <= 0) {
        flags.push({
            level: 'critical',
            message: `The standard curve slopes downward (slope ${fit.slope.toFixed(2)}). Brighter populations are carrying lower certified values, which no calibration can do.`,
            remedy: 'Every result from this curve would be inverted, reporting fewer molecules for a brighter sample. Check the certified values against the certificate of analysis before reading any result.',
        });
    }
    else if (Math.abs(fit.slope - 1) > SLOPE_TOLERANCE) {
        flags.push({
            level: 'warning',
            message: `Log-log slope is ${fit.slope.toFixed(3)}. A well-behaved standard approximates 1.0.`,
            remedy: 'Departures from unity indicate detector non-linearity or a compensation error. Lower the detector voltage if the brightest population is saturating, and confirm compensation was applied to beads and cells alike.',
        });
    }
    if (fit.r2 < MIN_R2) {
        flags.push({
            level: 'critical',
            message: `Standard curve R² = ${fit.r2.toFixed(4)}, below the conventional acceptance threshold of ${MIN_R2}.`,
            remedy: 'Check that each bead population is gated on the correct peak and that none are transposed, then look for a saturated or off-scale population.',
        });
    }
    const byMfi = usable
        .map((s2) => ({ label: s2.label, mfi: s2.mfi as number, assigned: s2.assigned as number }))
        .sort((a, b) => a.mfi - b.mfi);
    const inversion = byMfi.findIndex((p2, i) => i > 0 && p2.assigned <= byMfi[i - 1].assigned);
    if (inversion > 0) {
        flags.push({
            level: 'critical',
            message: `Assigned values are not increasing with MFI: ${byMfi[inversion - 1].label} (${formatNumber(byMfi[inversion - 1].assigned)}) is at or above ${byMfi[inversion].label} (${formatNumber(byMfi[inversion].assigned)}) despite lower fluorescence.`,
            remedy: 'A brighter population must carry a higher assigned value. This almost always means two rows were transposed or a value was transcribed against the wrong population. Check the entries against the certificate of analysis before reading any result.',
        });
    }
    const mfis = usable.map((s) => s.mfi as number);
    const assigned = usable.map((s) => s.assigned as number);
    const residuals: CurveResidual[] = usable.map((s2, i) => {
        const logResidual = logAssigned[i] - (fit.slope * logMfi[i] + fit.intercept);
        return {
            label: s2.label,
            logResidual,
            percent: (10 ** logResidual - 1) * 100,
        };
    });
    const curvature = usable.length >= MIN_CURVATURE_POPULATIONS ? quadraticCurvature(logMfi, logAssigned) : null;
    if (curvature && curvature.p < CURVATURE_ALPHA) {
        flags.push({
            level: 'warning',
            message: `The standard is not straight in log-log space. Its local slope runs from ${curvature.slopeAtLow.toFixed(2)} at the low end to ${curvature.slopeAtHigh.toFixed(2)} at the high end, a drift of ${Math.abs(curvature.slopeDrift).toFixed(2)} across the calibrated range (quadratic term ${curvature.p < 0.001 ? 'p < 0.001' : `p = ${curvature.p.toFixed(3)}`}).`,
            remedy: 'A curved standard biases every value converted through it, and the bias changes sign across the range. Neither the slope nor R² reveals it, because a symmetric bend leaves the overall slope at unity and most of a parabola over this range is line. Look for detector non-linearity: lower the voltage if the brightest population approaches the top of the scale, confirm compensation was applied identically to beads and cells, and check that no population is off-scale at either end.',
        });
    }
    return {
        fit,
        logMfi,
        logAssigned,
        mfiRange: [Math.min(...mfis), Math.max(...mfis)],
        assignedRange: [Math.min(...assigned), Math.max(...assigned)],
        residuals,
        curvature,
        flags,
    };
}
const DEGENERATE_SE = 1e-9;
const RATIO_TOLERANCE = 2.5;
const MIN_RATIO_ROWS = 3;
export interface RatioOutlier {
    id: string;
    label: string;
    ratio: number;
    factor: number;
    message: string;
    remedy: string;
}
export interface StandardConsistency {
    median: number | null;
    outliers: RatioOutlier[];
    wholeTable: boolean;
}
export function checkStandardConsistency(standards: readonly BeadStandard[]): StandardConsistency {
    const usable = standards.filter((s) => s.included && s.mfi !== null && s.assigned !== null && s.mfi > 0 && s.assigned > 0);
    if (usable.length < MIN_RATIO_ROWS)
        return { median: null, outliers: [], wholeTable: false };
    const ratios = usable.map((s) => (s.assigned as number) / (s.mfi as number));
    const sorted = [...ratios].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    if (!(median > 0))
        return { median: null, outliers: [], wholeTable: false };
    const outliers: RatioOutlier[] = [];
    usable.forEach((s, i) => {
        const ratio = ratios[i];
        const factor = Math.max(ratio / median, median / ratio);
        if (factor <= RATIO_TOLERANCE)
            return;
        outliers.push({
            id: s.id,
            label: s.label,
            ratio,
            factor,
            message: `This population does not agree with the other standards. Its certified value is ${formatRatio(ratio)} times its intensity, where the others sit near ${formatRatio(median)}, a difference of about ${formatFactor(factor)} times.`,
            remedy: 'Check this row against the certificate of analysis. A value entered against the wrong population, or transposed with the row beside it, is the usual cause.',
        });
    });
    return {
        median,
        outliers,
        wholeTable: outliers.length * 2 > usable.length,
    };
}
function formatRatio(v: number): string {
    if (!Number.isFinite(v))
        return 'n/a';
    if (v >= SCIENTIFIC_ABOVE)
        return v.toExponential(2);
    if (v >= 1000)
        return Math.round(v).toLocaleString('en-GB');
    if (v >= 1)
        return Number(v.toPrecision(3)).toString();
    return Number(v.toPrecision(2)).toString();
}
function formatFactor(v: number): string {
    if (!Number.isFinite(v))
        return 'n/a';
    const rounded = Number(v.toPrecision(2));
    if (rounded >= SCIENTIFIC_ABOVE)
        return rounded.toExponential(2);
    if (rounded >= 1000)
        return Math.round(rounded).toLocaleString('en-GB');
    return String(rounded);
}
export function captureCompatibilityFlags(kitHost: HostSpecies | null, declared: HostSpecies): Flag[] {
    if (kitHost === null || declared === 'unstated')
        return [];
    if (declared === 'other') {
        return [
            {
                level: 'warning',
                message: `The selected beads capture ${kitHost} immunoglobulin. The detection antibody host is recorded as other.`,
                remedy: 'Confirm from the antibody datasheet that these beads capture this host. If they do not, the calibration does not apply, however well the curve fits.',
            },
        ];
    }
    if (declared === kitHost)
        return [];
    return [
        {
            level: 'critical',
            message: `The selected beads capture ${kitHost} immunoglobulin, but the detection antibody is declared as ${declared}. These beads cannot calibrate this stain.`,
            remedy: 'Capture reagents cross-react across related hosts to an uncertified degree, so the curve can fit well while the beads bind a fraction of the antibody their assigned values assume. Select a kit whose capture species matches the detection antibody. Do not report values from this calibration.',
        },
    ];
}
function mfiToAbc(mfi: number, curve: CurveResult, options: QuantifyOptions): number | null {
    if (!(mfi > 0))
        return null;
    const logValue = curve.fit.slope * Math.log10(mfi) + curve.fit.intercept;
    const value = 10 ** logValue;
    return options.standardKind === 'pe-molecules' ? value / options.fpRatio : value;
}
const MATERIAL_BACKGROUND = 0.25;
const DOMINANT_BACKGROUND = 0.5;
const DETECTION_FLOOR = 0.9;
const MODE_DIVERGENCE = 0.1;
export function quantifySample(sample: Sample, curve: CurveResult, options: QuantifyOptions, invalidating: readonly Flag[] = []): SampleResult {
    const flags: Flag[] = [];
    const base: SampleResult = {
        id: sample.id,
        label: sample.label,
        grossAbc: null,
        controlAbc: null,
        netAbc: null,
        withheld: false,
        backgroundFraction: null,
        sampleInRange: null,
        controlInRange: null,
        modeDivergence: null,
        lower: null,
        upper: null,
        sitesLow: null,
        sitesHigh: null,
        flags,
        calibrationFlags: [],
    };
    if (sample.mfi === null || !(sample.mfi > 0))
        return base;
    const [minMfi, maxMfi] = curve.mfiRange;
    const controlMfi = sample.controlMfi;
    const hasControl = controlMfi !== null && controlMfi > 0 && options.backgroundMode !== 'none';
    const sampleInRange = sample.mfi >= minMfi && sample.mfi <= maxMfi;
    const controlInRange = hasControl
        ? (controlMfi as number) >= minMfi && (controlMfi as number) <= maxMfi
        : null;
    if (!sampleInRange) {
        flags.push({
            level: 'critical',
            message: `Sample MFI (${formatNumber(sample.mfi)}) lies outside the calibrated range (${formatNumber(minMfi)}–${formatNumber(maxMfi)}).`,
            remedy: 'The value is extrapolated beyond the standard and is not quantitative. Add a bead population that brackets this signal, or restain at a dilution that brings the sample inside the range. Do not report this figure.',
        });
    }
    const grossAbc = mfiToAbc(sample.mfi, curve, options);
    const controlAbc = hasControl ? mfiToAbc(controlMfi as number, curve, options) : null;
    if (grossAbc === null)
        return base;
    const backgroundFraction = controlAbc !== null && grossAbc > 0 ? controlAbc / grossAbc : null;
    const measured: SampleResult = {
        ...base,
        grossAbc,
        controlAbc,
        backgroundFraction,
        sampleInRange,
        controlInRange,
    };
    const useMfiSubtraction = options.backgroundMode === 'mfi' && hasControl;
    const effectiveMfi = useMfiSubtraction ? sample.mfi - (controlMfi as number) : sample.mfi;
    let netAbc: number | null;
    if (useMfiSubtraction) {
        netAbc = effectiveMfi > 0 ? mfiToAbc(effectiveMfi, curve, options) : null;
    }
    else if (options.backgroundMode === 'abc' && controlAbc !== null) {
        netAbc = grossAbc - controlAbc;
    }
    else {
        netAbc = grossAbc;
    }
    if (netAbc === null || netAbc <= 0) {
        flags.push({
            level: 'critical',
            message: useMfiSubtraction
                ? 'Control MFI equals or exceeds sample MFI. No specific signal is detectable.'
                : 'Background density equals or exceeds sample density. No specific binding is detectable.',
            remedy: 'Confirm the correct control was used and that the stained and control tubes were not transposed. A genuinely negative result is a valid finding and should be reported as below detection rather than as a density.',
        });
        return { ...measured, flags };
    }
    if (backgroundFraction !== null && backgroundFraction >= DETECTION_FLOOR) {
        flags.push({
            level: 'critical',
            message: `Background accounts for ${(backgroundFraction * 100).toFixed(1)}% of gross density. The sample is not meaningfully above its control.`,
            remedy: 'Report this as below detection under these staining conditions. Improving it means raising specific signal rather than refining the arithmetic: check the antibody concentration, the fluorophore brightness, and whether the target is expressed on this population at all.',
        });
        return { ...measured, flags };
    }
    if (backgroundFraction !== null && backgroundFraction >= MATERIAL_BACKGROUND) {
        if (controlInRange === false) {
            flags.push({
                level: 'critical',
                message: `Background is ${(backgroundFraction * 100).toFixed(1)}% of gross density, and the control MFI (${formatNumber(controlMfi as number)}) lies below the calibrated range (${formatNumber(minMfi)}–${formatNumber(maxMfi)}).`,
                remedy: 'Most of this result is an extrapolated quantity subtracted from a measured one. Add a bead population dim enough to bracket the control, or acquire the control under conditions that bring it into range. Do not report this figure.',
            });
        }
        else if (backgroundFraction >= DOMINANT_BACKGROUND) {
            flags.push({
                level: 'critical',
                message: `Background accounts for ${(backgroundFraction * 100).toFixed(1)}% of gross density. The net value is smaller than the background subtracted to obtain it.`,
                remedy: 'No density band is shown and no figure is reported, because the measurement does not support either. Gross and background densities are shown so the reason can be checked. Before reporting this sample, confirm the control is appropriate for this panel, an FMO rather than an isotype, and raise specific signal rather than refining the arithmetic: check antibody concentration, fluorophore brightness, and whether the target is expressed on this population at all.',
            });
        }
        else {
            flags.push({
                level: 'warning',
                message: `Background accounts for ${(backgroundFraction * 100).toFixed(1)}% of gross density.`,
                remedy: 'The reported value is a small difference between larger numbers, so it carries the uncertainty of both. Consider whether an FMO rather than an isotype is the appropriate control for this panel.',
            });
        }
    }
    const implausible = netAbc > MAX_PLAUSIBLE_DENSITY;
    const withheld = invalidating.length > 0 || implausible || flags.some((f) => f.level === 'critical');
    let modeDivergence: number | null = null;
    if (hasControl && controlAbc !== null) {
        const densityNet = grossAbc - controlAbc;
        const mfiNet = sample.mfi - (controlMfi as number) > 0
            ? mfiToAbc(sample.mfi - (controlMfi as number), curve, options)
            : null;
        if (densityNet > 0 && mfiNet !== null && mfiNet > 0) {
            modeDivergence = Math.abs(densityNet - mfiNet) / Math.max(densityNet, mfiNet);
            if (modeDivergence > MODE_DIVERGENCE) {
                const percent = (modeDivergence * 100).toFixed(0);
                flags.push({
                    level: 'warning',
                    message: withheld
                        ? `Density-space and MFI-space subtraction differ by ${percent}% for this sample.`
                        : `Density-space and MFI-space subtraction differ by ${percent}% for this sample (${formatNumber(densityNet)} against ${formatNumber(mfiNet)}).`,
                    remedy: 'The two modes agree only where the log-log slope is near unity and the background is small. Neither is a correction of the other, so state which mode was used when reporting this value.',
                });
            }
        }
    }
    const interval = meanResponseInterval(curve.fit, Math.log10(effectiveMfi), options.confidenceLevel);
    const factor = 10 ** interval.halfWidth;
    const [minAssigned] = curve.assignedRange;
    const minAbc = options.standardKind === 'pe-molecules' ? minAssigned / options.fpRatio : minAssigned;
    if (!withheld && netAbc < minAbc) {
        flags.push({
            level: 'warning',
            message: `Result (${formatNumber(netAbc)}) lies below the lowest bead standard (${formatNumber(minAbc)}).`,
            remedy: 'The standard has no population this dim, so how well the curve quantifies at this density has not been established. State that when reporting the value, or add a dimmer bead population.',
        });
    }
    if (implausible) {
        flags.push({
            level: 'critical',
            message: `The computed result exceeds any physically plausible antigen density (${formatNumber(MAX_PLAUSIBLE_DENSITY)} ABC). A cell surface accommodates on the order of 10⁷ antibody footprints.`,
            remedy: 'Check the entered MFI for a transcription error, particularly a misplaced decimal point or an exponent. This figure is not a measurement.',
        });
    }
    if (withheld) {
        return { ...measured, modeDivergence, withheld: true, flags };
    }
    const sitesLow = netAbc;
    const sitesHigh = options.valency === 'bivalent' ? netAbc * 2 : netAbc;
    return {
        ...measured,
        netAbc,
        modeDivergence,
        lower: netAbc / factor,
        upper: netAbc * factor,
        sitesLow,
        sitesHigh,
        flags,
    };
}
export function quantifyWithCalibration(sample: Sample, curve: CurveResult, options: QuantifyOptions, extraCalibrationFlags: readonly Flag[] = []): SampleResult {
    const invalidating = [...extraCalibrationFlags, ...curve.flags].filter((f) => f.level === 'critical');
    return { ...quantifySample(sample, curve, options, invalidating), calibrationFlags: invalidating };
}
export function calibrationValid(result: SampleResult): boolean {
    return result.calibrationFlags.length === 0;
}
export function resultStatus(flags: readonly Flag[]): 'ok' | 'caution' | 'do_not_report' {
    if (flags.some((f) => f.level === 'critical'))
        return 'do_not_report';
    if (flags.length > 0)
        return 'caution';
    return 'ok';
}
export interface DensityBand {
    id: string;
    min: number;
    max: number;
    label: string;
    note: string;
}
export const DENSITY_BANDS: DensityBand[] = [
    {
        id: 'subthreshold',
        min: 0,
        max: 100,
        label: 'Sub-threshold',
        note: 'Commonly below the activation threshold of conventional CARs; associated with antigen-low escape.',
    },
    {
        id: 'low',
        min: 100,
        max: 1000,
        label: 'Low',
        note: 'Published CARs have shown cytotoxicity in vitro at densities in this range more often than cytokine release or proliferation; thresholds are construct-specific.',
    },
    {
        id: 'intermediate',
        min: 1000,
        max: 10000,
        label: 'Intermediate',
        note: 'Within the range at which published conventional CARs have commonly shown cytotoxicity in vitro; thresholds are construct-specific.',
    },
    {
        id: 'high',
        min: 10000,
        max: Infinity,
        label: 'High',
        note: 'Above the densities at which published CARs have shown full activity in vitro; thresholds are construct-specific. If measured on normal tissue, a density in this range would be a substantial on-target, off-tumour concern.',
    },
];
export function bandFor(abc: number): DensityBand {
    return DENSITY_BANDS.find((b) => abc >= b.min && abc < b.max) ?? DENSITY_BANDS[0];
}
export function confidenceLabel(level: number): string {
    const percent = level * 100;
    const rounded = Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
    return `${rounded}% CI`;
}
export const MAX_PLAUSIBLE_DENSITY = 2e7;
export { formatNumber };
