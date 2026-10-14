export function PasteDecision({ message, onRemove, onKeep, }: {
    message: string;
    onRemove: () => void;
    onKeep: () => void;
}) {
    return (<div className="paste-notice paste-decision" role="alert">
      <div>
        <p>{message}</p>
        
        <div className="paste-decision-actions">
          <button type="button" onClick={onRemove}>
            Remove them
          </button>
          <button type="button" className="ghost" onClick={onKeep}>
            Keep them
          </button>
        </div>
      </div>
    </div>);
}
export function nameList(names: readonly string[]): string {
    if (names.length === 1)
        return names[0];
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
