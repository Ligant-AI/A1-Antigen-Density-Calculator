export function parseNum(raw: string): number | null {
    const cleaned = raw.replace(/,/g, '').trim();
    if (cleaned === '')
        return null;
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : null;
}
const THOUSANDS_ONLY = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
const CHANNEL_CEILING = 1024;
const MIN_ROWS_FOR_PATTERN = 3;
export interface PasteResult {
    grid: string[][];
    notices: string[];
}
export function commasAreThousands(lines: readonly string[]): boolean {
    const candidates = lines.filter((line) => line.trim() !== '' && !line.includes('\t'));
    if (candidates.length === 0)
        return false;
    return candidates.every((line) => THOUSANDS_ONLY.test(line.trim()));
}
function splitLine(line: string, thousands: boolean): string[] {
    if (line.includes('\t'))
        return line.split('\t');
    return thousands ? [line] : line.split(',');
}
function numericCells(column: (string | undefined)[]): number[] {
    return column
        .map((cell) => (cell === undefined ? null : parseNum(cell)))
        .filter((v): v is number => v !== null);
}
export interface ReadOptions {
    calibration?: boolean;
}
export function readPaste(text: string, options: ReadOptions = {}): PasteResult {
    const notices: string[] = [];
    const lines = text
        .replace(/\r\n?/g, '\n')
        .replace(/\n+$/, '')
        .split('\n');
    const thousands = commasAreThousands(lines);
    let grid = lines.map((line) => splitLine(line, thousands));
    if (thousands && lines.some((line) => line.includes(','))) {
        notices.push('Commas in this block were read as thousands separators, so each line was taken as one value. Paste tab separated columns if you meant two.');
    }
    const first = grid[0];
    if (grid.length > 1 &&
        first.some((cell) => cell.trim() !== '') &&
        first.every((cell) => parseNum(cell) === null)) {
        notices.push(`A header row was ignored: ${first.join(', ').slice(0, 60)}.`);
        grid = grid.slice(1);
    }
    if (options.calibration) {
        const rows = grid.filter((cells) => cells.some((cell) => parseNum(cell) !== null));
        const firstColumn = numericCells(rows.map((cells) => cells[0]));
        const secondColumn = numericCells(rows.map((cells) => cells[1]));
        if (firstColumn.length >= MIN_ROWS_FOR_PATTERN &&
            firstColumn.every((v) => Number.isInteger(v) && v > 0 && v < CHANNEL_CEILING)) {
            notices.push(`Every pasted value is a whole number below ${CHANNEL_CEILING}, which suggests channel numbers from a 1024 resolution scale rather than linear fluorescence intensity. Channel values need converting before they can be calibrated.`);
        }
        if (firstColumn.length >= MIN_ROWS_FOR_PATTERN &&
            firstColumn.length === secondColumn.length &&
            firstColumn.every((v, i) => v === secondColumn[i])) {
            notices.push('Both pasted columns carry the same numbers. A certified value is not the intensity it was measured at, and a standard built this way fits perfectly while returning the intensity unchanged. Check that the second column came from the certificate of analysis.');
        }
        if (firstColumn.length >= MIN_ROWS_FOR_PATTERN &&
            firstColumn.length === secondColumn.length &&
            firstColumn.every((v, i) => v > secondColumn[i])) {
            notices.push('The first pasted column is larger than the second in every row. Certified values are normally several times the intensity, so check the columns are not the other way round. Nothing has been swapped.');
        }
    }
    return { grid, notices };
}
