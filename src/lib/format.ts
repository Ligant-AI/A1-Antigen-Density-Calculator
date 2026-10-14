export function formatR2(v: number): string {
    if (!Number.isFinite(v))
        return 'n/a';
    if (v >= 1)
        return '1.0000';
    const fixed = v.toFixed(4);
    if (Number(fixed) >= 1)
        return '> 0.9999';
    return fixed;
}
export const SCIENTIFIC_ABOVE = 1e9;
const SIGNIFICANT_BELOW = 0.01;
export function formatNumber(v: number): string {
    if (!Number.isFinite(v))
        return 'n/a';
    if (Math.abs(v) >= SCIENTIFIC_ABOVE)
        return v.toExponential(2);
    if (Math.round(v) >= 10000)
        return Math.round(v).toLocaleString('en-US');
    if (v >= 100)
        return v.toFixed(0);
    if (v >= 10)
        return v.toFixed(1);
    const magnitude = Math.abs(v);
    if (magnitude > 0 && magnitude < SIGNIFICANT_BELOW) {
        return Number(v.toPrecision(3)).toString();
    }
    return v.toFixed(2);
}
