import { useState } from 'react';
import { checkStandardConsistency, type BeadStandard, type Sample } from '../lib/quantify';
import { nextId, nextStandardLabel } from '../lib/kits';
import { checkAssigned, checkControl, checkMfi } from '../lib/validate';
import { NumericCell as NumCell, parseNum } from './shared/NumericCell';
import { PasteNotices } from './shared/PasteNotices';
import { RowNotes, type RowNote } from './shared/RowNotes';
import { PasteDecision, nameList } from './shared/PasteDecision';
import { GuidancePin } from './guidance/GuidancePin';
export { parseNum, parseClipboardGrid } from './shared/NumericCell';
interface StandardsTableProps {
    standards: BeadStandard[];
    assignedLabel: string;
    onChange: (next: BeadStandard[]) => void;
}
export function StandardsTable({ standards, assignedLabel, onChange }: StandardsTableProps) {
    const [notices, setNotices] = useState<string[]>([]);
    const [pastedTo, setPastedTo] = useState<number | null>(null);
    const notes: RowNote[] = [];
    const consistency = checkStandardConsistency(standards);
    const outlierFor = new Map(consistency.outliers.map((o) => [o.id, o]));
    if (consistency.wholeTable) {
        notes.push({
            row: 'These populations',
            severity: 'error',
            message: 'disagree with one another, so the problem is the table rather than any one row.',
            remedy: 'Check the certified values against the certificate of analysis before reading any result. A column pasted into the wrong place, or values from a different lot, are the usual causes.',
        });
    }
    const anyComplete = standards.some((s) => s.mfi !== null && s.assigned !== null);
    const update = (i: number, patch: Partial<BeadStandard>) => onChange(standards.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    const pasteFrom = (row: number, col: 0 | 1, grid: string[][], from: string[]) => {
        setNotices(from);
        setPastedTo(row + grid.length - 1);
        const next = standards.map((s) => ({ ...s }));
        grid.forEach((cells, r) => {
            const target = row + r;
            while (next.length <= target) {
                next.push({
                    id: nextId('bead'),
                    label: nextStandardLabel(next),
                    mfi: null,
                    assigned: null,
                    included: true,
                });
            }
            cells.forEach((cell, c) => {
                const field = col + c;
                const value = parseNum(cell);
                if (field === 0)
                    next[target].mfi = value;
                else if (field === 1)
                    next[target].assigned = value;
            });
        });
        onChange(next);
    };
    const leftBehind = pastedTo === null
        ? []
        : standards.filter((s, i) => i > pastedTo && (s.mfi !== null || s.assigned !== null));
    const pastedRows = pastedTo === null ? 0 : pastedTo + 1;
    return (<>
      <table>
        <caption>Calibration bead standards</caption>
        <thead>
          <tr>
            <th style={{ width: '1%' }}>
              <span className="visually-hidden">Include in fit</span>
            </th>
            <th>Population</th>
            <th className="num">MFI<GuidancePin anchor="ad.mfi"/></th>
            <th className="num">{assignedLabel}<GuidancePin anchor="ad.assigned"/></th>
            <th className="shrink"/>
          </tr>
        </thead>
        <tbody>
          {standards.flatMap((s, i) => {
            const mfiIssue = checkMfi(s.mfi);
            const assignedIssue = checkAssigned(s.assigned, {
                included: s.included,
                started: s.mfi !== null && anyComplete,
            });
            const outlier = consistency.wholeTable ? undefined : outlierFor.get(s.id);
            const name = s.label || `Standard ${i + 1}`;
            for (const issue of [mfiIssue, assignedIssue]) {
                if (issue)
                    notes.push({ row: name, ...issue });
            }
            if (outlier) {
                notes.push({
                    row: name,
                    severity: 'error',
                    message: outlier.message,
                    remedy: outlier.remedy,
                });
            }
            return [
                <tr key={s.id} className={[s.included ? '' : 'excluded', outlier ? 'inconsistent' : '']
                        .filter(Boolean)
                        .join(' ') || undefined}>
                <td className="shrink" style={{ paddingLeft: 12 }}>
                  <input type="checkbox" checked={s.included} aria-label={`Include ${s.label} in the fit`} onChange={(e) => update(i, { included: e.target.checked })}/>
                </td>
                <td>
                  <input type="text" value={s.label} aria-label={`Label for standard ${i + 1}`} onChange={(e) => update(i, { label: e.target.value })}/>
                </td>
                <td className="num">
                  <NumCell value={s.mfi} ariaLabel={`MFI for ${s.label}`} onChange={(v) => update(i, { mfi: v })} calibration issue={mfiIssue?.severity} onPasteGrid={(g, n) => pasteFrom(i, 0, g, n)}/>
                </td>
                <td className="num">
                  <NumCell value={s.assigned} ariaLabel={`Assigned value for ${s.label}`} onChange={(v) => update(i, { assigned: v })} calibration issue={assignedIssue?.severity} onPasteGrid={(g, n) => pasteFrom(i, 1, g, n)}/>
                </td>
                <td className="shrink">
                  <button className="icon" aria-label={`Remove ${s.label}`} onClick={() => onChange(standards.filter((_, idx) => idx !== i))}>
                    ✕
                  </button>
                </td>
              </tr>,
            ];
        })}
        </tbody>
      </table>
      <RowNotes notes={notes}/>
      {leftBehind.length > 0 && (<PasteDecision message={`${pastedRows} populations were pasted over a table of ${standards.length}. ` +
                `${nameList(leftBehind.map((s) => s.label || 'an unnamed population'))} still ` +
                `${leftBehind.length === 1 ? 'holds its previous values' : 'hold their previous values'}` +
                `${leftBehind.some((s) => s.included) ? ' and are still in the fit.' : '.'}`} onRemove={() => {
                setPastedTo(null);
                onChange(standards.filter((_, i) => i <= (pastedTo as number)));
            }} onKeep={() => setPastedTo(null)}/>)}
      <PasteNotices notices={notices} onDismiss={() => setNotices([])}/>
      <div className="table-foot">
        <button onClick={() => onChange([
            ...standards,
            {
                id: nextId('bead'),
                label: nextStandardLabel(standards),
                mfi: null,
                assigned: null,
                included: true,
            },
        ])}>
          + Add population
        </button>
        <span className="hint">Paste tab or comma delimited values into any MFI cell.</span>
      </div>
    </>);
}
interface SamplesTableProps {
    samples: Sample[];
    showControl: boolean;
    onChange: (next: Sample[]) => void;
}
export function SamplesTable({ samples, showControl, onChange }: SamplesTableProps) {
    const [notices, setNotices] = useState<string[]>([]);
    const [pastedTo, setPastedTo] = useState<number | null>(null);
    const notes: RowNote[] = [];
    const update = (i: number, patch: Partial<Sample>) => onChange(samples.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    const pasteFrom = (row: number, col: 0 | 1, grid: string[][], from: string[]) => {
        setNotices(from);
        setPastedTo(row + grid.length - 1);
        const next = samples.map((s) => ({ ...s }));
        grid.forEach((cells, r) => {
            const target = row + r;
            while (next.length <= target) {
                next.push({
                    id: nextId('sample'),
                    label: `Sample ${next.length + 1}`,
                    mfi: null,
                    controlMfi: null,
                });
            }
            cells.forEach((cell, c) => {
                const field = col + c;
                const value = parseNum(cell);
                if (field === 0)
                    next[target].mfi = value;
                else if (field === 1)
                    next[target].controlMfi = value;
            });
        });
        onChange(next);
    };
    const leftBehind = pastedTo === null
        ? []
        : samples.filter((s, i) => i > pastedTo && (s.mfi !== null || s.controlMfi !== null));
    const pastedRows = pastedTo === null ? 0 : pastedTo + 1;
    return (<>
      <table>
        <caption>Samples and their control readings</caption>
        <thead>
          <tr>
            <th>Sample</th>
            <th className="num">Stained MFI<GuidancePin anchor="ad.mfi"/></th>
            {showControl && <th className="num">Control MFI<GuidancePin anchor="ad.control"/></th>}
            <th className="shrink"/>
          </tr>
        </thead>
        <tbody>
          {samples.flatMap((s, i) => {
            const mfiIssue = checkMfi(s.mfi);
            const controlIssue = showControl ? checkControl(s.controlMfi, s.mfi) : null;
            const name = s.label || `Sample ${i + 1}`;
            for (const issue of [mfiIssue, controlIssue]) {
                if (issue)
                    notes.push({ row: name, ...issue });
            }
            return [
                <tr key={s.id}>
                <td>
                  <input type="text" value={s.label} aria-label={`Label for sample ${i + 1}`} onChange={(e) => update(i, { label: e.target.value })}/>
                </td>
                <td className="num">
                  <NumCell value={s.mfi} ariaLabel={`Stained MFI for ${s.label}`} onChange={(v) => update(i, { mfi: v })} issue={mfiIssue?.severity} onPasteGrid={(g, n) => pasteFrom(i, 0, g, n)}/>
                </td>
                {showControl && (<td className="num">
                    <NumCell value={s.controlMfi} placeholder="isotype / FMO" ariaLabel={`Control MFI for ${s.label}`} onChange={(v) => update(i, { controlMfi: v })} issue={controlIssue?.severity} onPasteGrid={(g, n) => pasteFrom(i, 1, g, n)}/>
                  </td>)}
                <td className="shrink">
                  <button className="icon" aria-label={`Remove ${s.label}`} onClick={() => onChange(samples.filter((_, idx) => idx !== i))}>
                    ✕
                  </button>
                </td>
              </tr>,
            ];
        })}
        </tbody>
      </table>
      <RowNotes notes={notes}/>
      {leftBehind.length > 0 && (<PasteDecision message={`${pastedRows} samples were pasted over a table of ${samples.length}. ` +
                `${nameList(leftBehind.map((s) => s.label || 'an unnamed sample'))} still ` +
                `${leftBehind.length === 1 ? 'holds its previous readings' : 'hold their previous readings'}` +
                ', and a density is reported for each.'} onRemove={() => {
                setPastedTo(null);
                onChange(samples.filter((_, i) => i <= (pastedTo as number)));
            }} onKeep={() => setPastedTo(null)}/>)}
      <PasteNotices notices={notices} onDismiss={() => setNotices([])}/>
      <div className="table-foot">
        <button onClick={() => onChange([
            ...samples,
            {
                id: nextId('sample'),
                label: `Sample ${samples.length + 1}`,
                mfi: null,
                controlMfi: null,
            },
        ])}>
          + Add sample
        </button>
        <span className="hint">Paste a column of MFI values.</span>
      </div>
    </>);
}
