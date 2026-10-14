export function PasteNotices({ notices, onDismiss, }: {
    notices: readonly string[];
    onDismiss: () => void;
}) {
    if (notices.length === 0)
        return null;
    return (<div className="paste-notice" role="status">
      <div>
        {notices.map((notice, i) => (<p key={i}>{notice}</p>))}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss paste notes">
        ✕
      </button>
    </div>);
}
