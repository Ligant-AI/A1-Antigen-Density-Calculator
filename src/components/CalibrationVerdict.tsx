import { formatR2 } from '../lib/format';
import type { CurveResult, Flag } from '../lib/quantify';
export function CalibrationVerdict({ curve, error, flags, }: {
    curve: CurveResult | null;
    error?: string;
    flags: readonly Flag[];
}) {
    if (!curve) {
        return (<p className="verdict verdict-pending">
        {error ?? 'Enter calibration standards to fit a curve.'}
      </p>);
    }
    const invalidating = flags.filter((f) => f.level === 'critical');
    const caveats = flags.filter((f) => f.level === 'warning');
    const summary = `Slope ${curve.fit.slope.toFixed(2)}, R² ${formatR2(curve.fit.r2)}, ${curve.fit.n} populations`;
    if (invalidating.length > 0) {
        return (<p className="verdict verdict-invalid">
        <strong>Calibration not usable.</strong> {invalidating[0].message}
      </p>);
    }
    if (caveats.length > 0) {
        return (<p className="verdict verdict-caveat">
        <strong>Calibration usable with a caveat.</strong> {summary}. {caveats[0].message}
      </p>);
    }
    return (<p className="verdict verdict-valid">
      <strong>Calibration valid.</strong> {summary}.
    </p>);
}
