export const MFI_CEILING = 1e7;
export const MFI_IMPOSSIBLE = 2 ** 32;
export const MFI_IMPOSSIBLE_LOW = 2 ** -32;
const MFI_SUBCHANNEL = 1;
const ASSIGNED_FLOOR = 1e2;
const ASSIGNED_CEILING = 1e7;
export const ASSIGNED_IMPOSSIBLE = 1e9;
import { formatNumber } from './format';
export type Severity = 'error' | 'warning';
export interface FieldIssue {
    severity: Severity;
    message: string;
}
export function checkMfi(mfi: number | null): FieldIssue | null {
    if (mfi === null)
        return null;
    if (!Number.isFinite(mfi)) {
        return {
            severity: 'error',
            message: 'This is not a number the tool can read.',
        };
    }
    if (mfi <= 0) {
        return {
            severity: 'error',
            message: 'A fluorescence intensity is greater than zero. A value at or below zero is excluded from the fit.',
        };
    }
    if (mfi >= MFI_IMPOSSIBLE) {
        return {
            severity: 'error',
            message: 'No cytometer digitises above 32 bit, so a value this large is not a reading on any scale. Check for a pasted exponent or a formula result.',
        };
    }
    if (mfi < MFI_IMPOSSIBLE_LOW) {
        return {
            severity: 'error',
            message: 'No digitiser resolves a positive reading this small on any scale, so this is not an intensity. Check for a pasted exponent or a formula result.',
        };
    }
    if (mfi < MFI_SUBCHANNEL) {
        return {
            severity: 'warning',
            message: 'This is below a single digitiser channel. That is legitimate for rescaled or derived values, and a misplaced decimal point otherwise.',
        };
    }
    if (mfi > MFI_CEILING) {
        return {
            severity: 'warning',
            message: 'This is beyond what a cytometer reports on any scale in ordinary use. Check for a stray digit.',
        };
    }
    return null;
}
export function checkAssigned(assigned: number | null, options: {
    included: boolean;
    started?: boolean;
}): FieldIssue | null {
    if (!options.included)
        return null;
    if (assigned === null) {
        if (options.started === false)
            return null;
        return {
            severity: 'error',
            message: 'A population in the fit needs a certified value. Untick it to leave it out, as a blank population is left out.',
        };
    }
    if (!Number.isFinite(assigned) || assigned <= 0) {
        return {
            severity: 'error',
            message: 'A certified value is greater than zero. Untick this population to leave it out of the fit.',
        };
    }
    if (assigned < MFI_IMPOSSIBLE_LOW) {
        return {
            severity: 'error',
            message: 'No certificate carries a capacity this small, so this is not a certified value. Check for a pasted exponent or a formula result.',
        };
    }
    if (assigned >= ASSIGNED_IMPOSSIBLE) {
        return {
            severity: 'error',
            message: 'This is orders of magnitude beyond the capacity of any bead, so it is not a certified value. Check for a pasted exponent or a formula result.',
        };
    }
    if (assigned < ASSIGNED_FLOOR || assigned > ASSIGNED_CEILING) {
        return {
            severity: 'warning',
            message: `Certified capacities in these kits fall roughly between ${formatNumber(ASSIGNED_FLOOR)} and ${formatNumber(ASSIGNED_CEILING)}. Check this against the certificate of analysis.`,
        };
    }
    return null;
}
export function checkControl(control: number | null, stained: number | null): FieldIssue | null {
    if (control === null || stained === null)
        return null;
    if (!(control > 0) || !(stained > 0))
        return null;
    if (control <= stained)
        return null;
    return {
        severity: 'warning',
        message: 'The control is brighter than the stained sample. Check the two columns are not the other way round. A genuinely negative population can read this way, and is reported as below detection.',
    };
}
