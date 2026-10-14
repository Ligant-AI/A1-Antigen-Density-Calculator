function logGamma(x: number): number {
    const g = 7;
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    if (x < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++)
        a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function betaContinuedFraction(a: number, b: number, x: number): number {
    const FPMIN = 1e-300;
    const EPS = 3e-16;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN)
        d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN)
            d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN)
            c = FPMIN;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN)
            d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN)
            c = FPMIN;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS)
            break;
    }
    return h;
}
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
    if (x <= 0)
        return 0;
    if (x >= 1)
        return 1;
    const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
        return (front * betaContinuedFraction(a, b, x)) / a;
    }
    return 1 - (Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + b * Math.log(1 - x) + a * Math.log(x)) * betaContinuedFraction(b, a, 1 - x)) / b;
}
export function studentTCdf(t: number, df: number): number {
    const x = df / (df + t * t);
    const p = 0.5 * regularizedIncompleteBeta(df / 2, 0.5, x);
    return t > 0 ? 1 - p : p;
}
export function studentTInv(p: number, df: number): number {
    if (p <= 0 || p >= 1)
        throw new Error('studentTInv: p must be in (0, 1)');
    if (df <= 0)
        throw new Error('studentTInv: df must be positive');
    if (p === 0.5)
        return 0;
    let lo = 0;
    let hi = 1e4;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (studentTCdf(mid, df) < p)
            lo = mid;
        else
            hi = mid;
    }
    return (lo + hi) / 2;
}
export function tCritical(level: number, df: number): number {
    return studentTInv(1 - (1 - level) / 2, df);
}
export interface LinearFit {
    slope: number;
    intercept: number;
    r2: number;
    residualSE: number;
    df: number;
    n: number;
    meanX: number;
    sxx: number;
    skew: number;
}
export function linearRegression(xs: number[], ys: number[]): LinearFit {
    if (xs.length !== ys.length)
        throw new Error('linearRegression: length mismatch');
    const n = xs.length;
    if (n < 3)
        throw new Error('linearRegression: need at least 3 points');
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let sxx = 0;
    let sxy = 0;
    for (let i = 0; i < n; i++) {
        sxx += (xs[i] - meanX) ** 2;
        sxy += (xs[i] - meanX) * (ys[i] - meanY);
    }
    if (sxx === 0)
        throw new Error('linearRegression: all x values identical');
    const slope = sxy / sxx;
    const intercept = meanY - slope * meanX;
    let sse = 0;
    let sst = 0;
    for (let i = 0; i < n; i++) {
        sse += (ys[i] - (slope * xs[i] + intercept)) ** 2;
        sst += (ys[i] - meanY) ** 2;
    }
    const m2 = sxx / n;
    const m3 = xs.reduce((a, x) => a + (x - meanX) ** 3, 0) / n;
    const skew = m3 / m2 ** 1.5;
    const df = n - 2;
    return {
        slope,
        intercept,
        r2: sst === 0 ? 1 : 1 - sse / sst,
        residualSE: Math.sqrt(sse / df),
        df,
        n,
        meanX,
        sxx,
        skew,
    };
}
export function meanResponseInterval(fit: LinearFit, x0: number, level = 0.95): {
    fitted: number;
    lower: number;
    upper: number;
    halfWidth: number;
} {
    const fitted = fit.slope * x0 + fit.intercept;
    const se = fit.residualSE * Math.sqrt(1 / fit.n + (x0 - fit.meanX) ** 2 / fit.sxx);
    const halfWidth = tCritical(level, fit.df) * se;
    return { fitted, lower: fitted - halfWidth, upper: fitted + halfWidth, halfWidth };
}
export interface CurvatureTest {
    quadratic: number;
    standardError: number;
    t: number;
    df: number;
    p: number;
    slopeAtLow: number;
    slopeAtHigh: number;
    slopeDrift: number;
}
export function quadraticCurvature(xs: number[], ys: number[]): CurvatureTest | null {
    const n = xs.length;
    if (n !== ys.length || n < 4)
        return null;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const centred = xs.map((x) => x - meanX);
    const s2 = centred.reduce((a, x) => a + x * x, 0);
    const s3 = centred.reduce((a, x) => a + x * x * x, 0);
    const s4 = centred.reduce((a, x) => a + x * x * x * x, 0);
    const t0 = ys.reduce((a, y) => a + y, 0);
    const t1 = centred.reduce((a, x, i) => a + x * ys[i], 0);
    const t2 = centred.reduce((a, x, i) => a + x * x * ys[i], 0);
    const s4c = s4 - (s2 * s2) / n;
    const t2c = t2 - (s2 * t0) / n;
    const determinant = s2 * s4c - s3 * s3;
    if (!(s2 > 0) || !(Math.abs(determinant) > 0))
        return null;
    const linear = (t1 * s4c - s3 * t2c) / determinant;
    const quadratic = (s2 * t2c - s3 * t1) / determinant;
    const constant = (t0 - s2 * quadratic) / n;
    const df = n - 3;
    const sse = centred.reduce((acc, x, i) => {
        const residual = ys[i] - (constant + linear * x + quadratic * x * x);
        return acc + residual * residual;
    }, 0);
    const variance = ((sse / df) * s2) / determinant;
    if (!(variance > 0)) {
        return {
            quadratic,
            standardError: 0,
            t: quadratic === 0 ? 0 : Infinity,
            df,
            p: quadratic === 0 ? 1 : 0,
            slopeAtLow: linear + 2 * quadratic * (Math.min(...centred)),
            slopeAtHigh: linear + 2 * quadratic * (Math.max(...centred)),
            slopeDrift: 2 * quadratic * (Math.max(...xs) - Math.min(...xs)),
        };
    }
    const standardError = Math.sqrt(variance);
    const t = quadratic / standardError;
    return {
        quadratic,
        standardError,
        t,
        df,
        p: 2 * (1 - studentTCdf(Math.abs(t), df)),
        slopeAtLow: linear + 2 * quadratic * Math.min(...centred),
        slopeAtHigh: linear + 2 * quadratic * Math.max(...centred),
        slopeDrift: 2 * quadratic * (Math.max(...xs) - Math.min(...xs)),
    };
}
