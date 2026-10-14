import { parseNum, readPaste } from '../../lib/paste';
import type { Severity } from '../../lib/validate';
export { parseNum };
export function parseClipboardGrid(text: string): string[][] {
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/\n+$/, '')
        .split('\n')
        .map((line) => (line.includes('\t') ? line.split('\t') : line.split(',')));
}
interface Props {
    value: number | null;
    onChange: (v: number | null) => void;
    onPasteGrid: (grid: string[][], notices: string[]) => void;
    placeholder?: string;
    ariaLabel: string;
    calibration?: boolean;
    issue?: Severity | null;
}
export function NumericCell({ value, onChange, onPasteGrid, placeholder, ariaLabel, calibration, issue, }: Props) {
    const className = [value !== null ? 'filled' : '', issue ? `cell-${issue}` : ''].filter(Boolean).join(' ') ||
        undefined;
    return (<input type="text" inputMode="decimal" className={className} aria-invalid={issue === 'error' || undefined} value={value === null ? '' : String(value)} placeholder={placeholder} aria-label={ariaLabel} onChange={(e) => onChange(parseNum(e.target.value))} onPaste={(e) => {
            const { grid, notices } = readPaste(e.clipboardData.getData('text/plain'), {
                calibration,
            });
            if (grid.length > 1 || grid[0]?.length > 1) {
                e.preventDefault();
                onPasteGrid(grid, notices);
            }
        }}/>);
}
