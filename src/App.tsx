import { useMemo, useState } from 'react';
import { BEAD_KITS, standardsForKit, type BeadKit } from './lib/kits';
import { DEFAULT_OPTIONS, captureCompatibilityFlags, fitStandardCurve, quantifyWithCalibration, type BeadStandard, type CurveResult, type HostSpecies, type QuantifyOptions, type Sample, } from './lib/quantify';
import { APP_VERSION } from './lib/site';
import { exportChartSvg, exportResultsCsv } from './lib/export';
import { formatR2 } from './lib/format';
import { StandardCurve } from './components/StandardCurve';
import { Results, FlagList } from './components/Results';
import { StandardsTable, SamplesTable } from './components/Tables';
import { Method } from './components/Method';
import { CalibrationVerdict } from './components/CalibrationVerdict';
import { LigantMark, SuiteFooter, SuiteHeader } from '@ligant/bench-chrome/react';
import { FOOTER, HEADER } from './lib/chrome';
import { SkipLink } from './components/shared/SkipLink';
import { GuidanceProvider } from './components/guidance/GuidanceProvider';
import { GuidancePin } from './components/guidance/GuidancePin';
import { ANTIGEN_DENSITY_GUIDANCE } from './lib/guidance/corpus/antigen-density';
import { SHARED_GUIDANCE } from './lib/guidance/corpus/shared';
import type { ToolContext } from './lib/guidance/types';
const CORPUS = [...ANTIGEN_DENSITY_GUIDANCE, ...SHARED_GUIDANCE];
interface ToolState {
    kitId: string;
    lotId: string;
    standards: BeadStandard[];
    samples: Sample[];
    options: QuantifyOptions;
}
function demoState(): ToolState {
    return {
        kitId: 'qsc-mouse',
        lotId: '',
        standards: [
            { id: 'd0', label: 'Blank', mfi: 210, assigned: null, included: false },
            { id: 'd1', label: 'Population 1', mfi: 2050, assigned: 8300, included: true },
            { id: 'd2', label: 'Population 2', mfi: 12900, assigned: 51000, included: true },
            { id: 'd3', label: 'Population 3', mfi: 39500, assigned: 175000, included: true },
            { id: 'd4', label: 'Population 4', mfi: 121000, assigned: 512000, included: true },
        ],
        samples: [
            { id: 'ds1', label: 'CD19 (NALM-6)', mfi: 8900, controlMfi: 240 },
            { id: 'ds2', label: 'HER2 (SK-BR-3)', mfi: 62000, controlMfi: 310 },
            { id: 'ds3', label: 'HER2 (primary keratinocyte)', mfi: 420, controlMfi: 260 },
        ],
        options: { ...DEFAULT_OPTIONS, antibodyHost: 'mouse', saturationConfirmed: true },
    };
}
function emptyState(kit: BeadKit): ToolState {
    return {
        kitId: kit.id,
        lotId: '',
        standards: standardsForKit(kit),
        samples: [
            { id: 'e1', label: 'Sample 1', mfi: null, controlMfi: null },
            { id: 'e2', label: 'Sample 2', mfi: null, controlMfi: null },
        ],
        options: { ...DEFAULT_OPTIONS, standardKind: kit.standardKind },
    };
}
export default function App() {
    const [state, setState] = useState<ToolState>(() => emptyState(BEAD_KITS[0]));
    const [undoState, setUndoState] = useState<{
        state: ToolState;
        label: string;
    } | null>(null);
    const kit = BEAD_KITS.find((k) => k.id === state.kitId) ?? BEAD_KITS[0];
    const { standards, samples, options, lotId } = state;
    const curveResult = useMemo(() => fitStandardCurve(standards), [standards]);
    const usableStandards = standards.filter((s) => s.included && s.mfi !== null && s.mfi > 0 && s.assigned !== null && s.assigned > 0).length;
    const missing = [
        usableStandards < 3 &&
            `Enter an MFI and an assigned value for at least 3 bead populations (${usableStandards} so far).`,
        !samples.some((s) => s.mfi !== null) && 'Enter the stained MFI for at least one sample.',
    ].filter((m): m is string => typeof m === 'string');
    const curve: CurveResult | null = 'error' in curveResult ? null : curveResult;
    const captureFlags = useMemo(() => captureCompatibilityFlags(kit.captureHost, options.antibodyHost), [kit, options.antibodyHost]);
    const curveFlags = useMemo(() => [...captureFlags, ...(curve?.flags ?? [])], [captureFlags, curve]);
    const entries = useMemo(() => {
        if (!curve)
            return [];
        return samples.map((sample) => ({
            sample,
            result: quantifyWithCalibration(sample, curve, options, captureFlags),
        }));
    }, [samples, curve, options, captureFlags]);
    const guidanceContext: ToolContext = useMemo(() => ({
        tool: 'antigen-density',
        facts: {
            slope: curve?.fit.slope ?? null,
            intercept: curve?.fit.intercept ?? null,
            r2: curve?.fit.r2 ?? null,
            beadCount: curve?.fit.n ?? 0,
            standardKind: options.standardKind,
            backgroundMode: options.backgroundMode,
            valency: options.valency,
            confidenceLevel: options.confidenceLevel,
            sampleCount: entries.length,
            hasCriticalFlag: entries.some((e) => e.result.flags.some((f) => f.level === 'critical')),
        },
        flags: [...curveFlags, ...entries.flatMap((e) => e.result.flags)],
    }), [curve, curveFlags, options, entries]);
    const setOptions = (patch: Partial<QuantifyOptions>) => setState((s) => ({ ...s, options: { ...s.options, ...patch } }));
    const changeKit = (kitId: string) => {
        const next = BEAD_KITS.find((k) => k.id === kitId);
        if (!next)
            return;
        setState((s) => {
            setUndoState({ state: s, label: 'Undo kit change' });
            return {
                ...s,
                kitId,
                standards: standardsForKit(next),
                options: { ...s.options, standardKind: next.standardKind },
            };
        });
    };
    const isPe = options.standardKind === 'pe-molecules';
    return (<GuidanceProvider corpus={CORPUS} context={guidanceContext}>
    <div className="app">
      <SkipLink />
      <SuiteHeader {...HEADER}/>

      <main id="main">
      <div className="layout">
        
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div className="titles">
                <span className="step">1</span>
                <h2>Calibration standard</h2>
              </div>
            </div>
            <div className="panel-body" style={{ paddingBottom: 12 }}>
              <div className="field">
                <label htmlFor="kit">Bead kit<GuidancePin anchor="ad.bead-kit"/></label>
                <select id="kit" value={kit.id} onChange={(e) => changeKit(e.target.value)}>
                  {BEAD_KITS.map((k) => (<option key={k.id} value={k.id}>
                      {k.name}{k.vendor && ` (${k.vendor})`}
                    </option>))}
                </select>
              </div>
              <p className="hint" style={{ marginTop: 9 }}>{kit.note}</p>
              <div className="field" style={{ marginTop: 10 }}>
                <label htmlFor="lot">Bead lot<GuidancePin anchor="ad.lot"/></label>
                <input id="lot" type="text" value={lotId} placeholder="from the vial or certificate, optional" onChange={(e) => setState((st) => ({ ...st, lotId: e.target.value }))}/>
              </div>
              <p className="hint" style={{ marginTop: 7 }}>
                <strong>Assigned values are lot-specific.</strong> Transcribe them from the vial or the
                lot certificate of analysis. No assigned values are hard-coded in this tool. Recording
                which lot they came from is the only mitigation for the one failure this tool cannot
                detect, and it travels with the export.
              </p>
            </div>
            <StandardsTable standards={standards} assignedLabel={kit.assignedLabel} onChange={(next) => setState((s) => ({ ...s, standards: next }))}/>
            
            <CalibrationVerdict curve={curve} error={'error' in curveResult ? curveResult.error : undefined} flags={curveFlags}/>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="titles">
                <span className="step">2</span>
                <h2>Samples</h2>
              </div>
            </div>
            <div className="panel-body" style={{ paddingBottom: 0 }}>
              <p className="hint">
                Take each MFI from a viability-gated, singlet-gated live population. Dead and dying
                cells bind antibody non-specifically and inflate the stained and control channels
                alike, which subtraction does not remove.
              </p>
            </div>
            <SamplesTable samples={samples} showControl={options.backgroundMode !== 'none'} onChange={(next) => setState((s) => ({ ...s, samples: next }))}/>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="titles">
                <span className="step">3</span>
                <h2>Analysis settings</h2>
              </div>
            </div>
            <div className="panel-body stack" style={{ gap: 14 }}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="bg">Background subtraction<GuidancePin anchor="ad.background"/></label>
                  <select id="bg" value={options.backgroundMode} onChange={(e) => setOptions({ backgroundMode: e.target.value as QuantifyOptions['backgroundMode'] })}>
                    <option value="abc">Density space</option>
                    <option value="mfi">MFI space</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="valency">Detection antibody<GuidancePin anchor="ad.valency"/></label>
                  <select id="valency" value={options.valency} onChange={(e) => setOptions({ valency: e.target.value as QuantifyOptions['valency'] })}>
                    <option value="bivalent">Whole IgG (bivalent)</option>
                    <option value="monovalent">Fab / scFv (1:1)</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="host">
                    Antibody host species<GuidancePin anchor="ad.host"/>
                  </label>
                  <select id="host" value={options.antibodyHost} onChange={(e) => setOptions({ antibodyHost: e.target.value as HostSpecies })}>
                    <option value="unstated">Not stated</option>
                    <option value="mouse">Mouse</option>
                    <option value="rat">Rat</option>
                    <option value="human">Human or humanised</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="sat">
                    Stain titration<GuidancePin anchor="ad.saturation"/>
                  </label>
                  <select id="sat" value={options.saturationConfirmed ? 'yes' : 'no'} onChange={(e) => setOptions({ saturationConfirmed: e.target.value === 'yes' })}>
                    <option value="no">Not confirmed</option>
                    <option value="yes">Titrated to saturation</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                {isPe && (<div className="field">
                    <label htmlFor="fp">Fluorophore:protein ratio</label>
                    <input id="fp" type="number" min="0.1" step="0.1" value={options.fpRatio} onChange={(e) => setOptions({ fpRatio: Number(e.target.value) || 1 })}/>
                  </div>)}
                <div className="field">
                  <label htmlFor="conf">Confidence level<GuidancePin anchor="shared.confidence"/></label>
                  <select id="conf" value={options.confidenceLevel} onChange={(e) => setOptions({ confidenceLevel: Number(e.target.value) })}>
                    <option value={0.9}>90%</option>
                    <option value={0.95}>95%</option>
                    <option value={0.99}>99%</option>
                  </select>
                </div>
              </div>

              <p className="hint">
                {options.backgroundMode === 'abc' &&
            'Stained and control MFI are converted to densities independently, then subtracted. Preferred where the log-log slope departs from unity, since the MFI to ABC mapping is then non-proportional.'}
                {options.backgroundMode === 'mfi' &&
            'Control MFI is subtracted before conversion, which reflects the physical fact that autofluorescence and non-specific binding add in fluorescence units. Neither mode is a correction of the other.'}
                {options.backgroundMode === 'none' &&
            'No background correction applied. The reported density includes non-specific binding and autofluorescence.'}
                {options.backgroundMode !== 'none' &&
            ' The two agree closely where the slope is near unity and the background is small, and diverge where it is not. Report which mode was used.'}
              </p>

              <div className="button-row">
                <button onClick={() => {
            setUndoState(null);
            setState(demoState());
        }}>
                  Load worked example
                </button>
                <button onClick={() => {
            setUndoState({ state, label: 'Undo clear' });
            setState(emptyState(kit));
        }}>
                  Clear all
                </button>
                {undoState && (<button className="primary" onClick={() => {
                setState(undoState.state);
                setUndoState(null);
            }}>
                    {undoState.label}
                  </button>)}
              </div>
              <p className="hint">
                This is a worked example on a Quantum Simply Cellular standard, with three samples.
                Illustrative values constructed to demonstrate the tool, not a measured run. The
                keratinocyte sample is deliberately under-range, so you can see what the tool does
                with a measurement that should not be reported.
              </p>
            </div>
          </section>

          
          <Method />

        </div>

        
        <div className="rail">
          <section className="panel">
            <div className="panel-head">
              <div className="titles"><h2>Standard curve</h2><GuidancePin anchor="ad.curve"/></div>
              {curve && (<button onClick={() => exportChartSvg('standard-curve-svg', 'standard-curve.svg')}>
                  Export SVG
                </button>)}
            </div>
            {curve ? (<>
                <StandardCurve curve={curve} samples={entries} assignedLabel={isPe ? 'PE molecules per bead' : 'ABC (antibody binding capacity)'} confidenceLevel={options.confidenceLevel} lotId={lotId}/>
                <div className="fit-stats">
                  <span>Slope <b>{curve.fit.slope.toFixed(3)}</b></span>
                  <span>Intercept <b>{curve.fit.intercept.toFixed(3)}</b></span>
                  <span>R² <b>{formatR2(curve.fit.r2)}</b></span>
                  <span>n <b>{curve.fit.n}</b></span>
                </div>
                <div className="residual-strip">
                  <span className="label">Residual</span>
                  {curve.residuals.map((r) => (<span key={r.label}>
                      <span className="label">{r.label}</span>{' '}
                      <b>
                        {r.percent >= 0 ? '+' : ''}
                        {r.percent.toFixed(1)}%
                      </b>
                    </span>))}
                </div>
                {curveFlags.length > 0 && (<div className="panel-body" style={{ paddingTop: 4 }}>
                    <FlagList flags={curveFlags}/>
                  </div>)}
              </>) : (<div className="empty">
                {'error' in curveResult ? curveResult.error : 'Enter calibration standards to fit a curve.'}
              </div>)}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="titles"><h2>Antigen density</h2><GuidancePin anchor="ad.result"/></div>
              {curve && entries.length > 0 && (<button className="primary" onClick={() => exportResultsCsv({
                kitName: kit.name,
                lotId,
                assignedLabel: kit.assignedLabel,
                options,
                standards,
                curve,
                samples: entries,
                appVersion: APP_VERSION,
            }, 'antigen-density-results.csv')}>
                  Export CSV
                </button>)}
            </div>
            <div className="panel-body">
              {curve ? (<Results entries={entries} valency={options.valency} confidenceLevel={options.confidenceLevel} saturationConfirmed={options.saturationConfirmed}/>) : (<div className="state-block incomplete">
                  <h3>No result yet: declarations incomplete</h3>
                  <ul>
                    
                    {(missing.length ? missing : ['error' in curveResult ? curveResult.error : '']).map((m) => (<li key={m}>{m}</li>))}
                  </ul>
                </div>)}
            </div>
          </section>
        </div>
      </div>

      </main>

      <SuiteFooter {...FOOTER}/>

      <p className="disclaimer">
        <strong>Research use only. Not qualified for GxP decision-making.</strong>{' '}
        This tool determines antibody binding capacity from flow cytometry median fluorescence
        intensity, by calibration against a certified bead standard. It does not verify the standard
        or its lot, does not observe how the beads and cells were acquired, and cannot detect beads
        and cells acquired under different cytometer settings. Antibody binding capacity is not
        antigen copy number: epitope accessibility, binding valency, conjugate performance and
        antigen internalisation all intervene between the two. All computation is performed locally
        in this browser. Nothing you enter into the calculator is transmitted.
      </p>

      <div className="colophon">
        <LigantMark size={16}/>
        <span>Ligant · Antigen Density Calculator {APP_VERSION}</span>
      </div>
    </div>
    </GuidanceProvider>);
}
