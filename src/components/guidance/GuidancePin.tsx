import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { entriesFor, type AnchorId } from '../../lib/guidance/types';
import { useGuidance } from './GuidanceProvider';
import { BlockView } from './GuidanceBlocks';
import { AskPanel } from './AskPanel';
const OFFSET = 7;
const MARGIN = 12;
export function GuidancePin({ anchor, label }: {
    anchor: AnchorId;
    label?: string;
}) {
    const { corpus, context, exchanges } = useGuidance();
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();
    useLayoutEffect(() => {
        if (!open) {
            setPlacement(null);
            return;
        }
        const place = () => {
            const pin = buttonRef.current?.getBoundingClientRect();
            const panel = panelRef.current?.getBoundingClientRect();
            if (!pin || !panel)
                return;
            let left = pin.left;
            if (left + panel.width > window.innerWidth - MARGIN) {
                left = window.innerWidth - panel.width - MARGIN;
            }
            left = Math.max(MARGIN, left);
            let top = pin.bottom + OFFSET;
            if (top + panel.height > window.innerHeight - MARGIN) {
                const above = pin.top - panel.height - OFFSET;
                top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - panel.height - MARGIN);
            }
            setPlacement({ top, left });
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open, exchanges[anchor]?.length]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        const onPointer = (e: MouseEvent) => {
            const target = e.target as Node;
            if (buttonRef.current?.contains(target) || panelRef.current?.contains(target))
                return;
            setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onPointer);
        };
    }, [open]);
    const entries = entriesFor(corpus, anchor, context);
    if (entries.length === 0)
        return null;
    const title = label ?? entries[0].title;
    return (<span className="guidance-pin">
      <button ref={buttonRef} type="button" className="guidance-pin-button" aria-expanded={open} aria-controls={open ? panelId : undefined} aria-label={`Guidance: ${title}`} onClick={() => setOpen((v) => !v)}>
        ?
      </button>

      {open &&
            createPortal(<div ref={panelRef} id={panelId} role="group" aria-label={`Guidance: ${title}`} className="guidance-panel" style={{
                    top: placement?.top ?? 0,
                    left: placement?.left ?? 0,
                    visibility: placement ? 'visible' : 'hidden',
                }}>
            {entries.map((entry) => (<div className="guidance-entry" key={entry.id}>
                <h4>{entry.title}</h4>
                {entry.body.map((block, i) => (<BlockView block={block} key={i}/>))}
              </div>))}
            <AskPanel anchor={anchor} shown={entries.map((e) => e.id)}/>
          </div>, document.body)}
    </span>);
}
