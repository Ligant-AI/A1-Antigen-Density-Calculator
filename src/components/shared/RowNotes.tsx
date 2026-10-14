import type { Severity } from '../../lib/validate';
export interface RowNote {
    row: string;
    severity: Severity;
    message: string;
    remedy?: string;
}
export function RowNotes({ notes }: {
    notes: readonly RowNote[];
}) {
    if (notes.length === 0)
        return null;
    return (<ul className="row-notes" role="status">
      {notes.map((note, i) => (<li key={i} className={note.severity === 'error' ? 'row-note-error' : undefined}>
          <strong>{note.row}</strong> {note.message}
          {note.remedy && <span className="row-note-remedy">{note.remedy}</span>}
        </li>))}
    </ul>);
}
