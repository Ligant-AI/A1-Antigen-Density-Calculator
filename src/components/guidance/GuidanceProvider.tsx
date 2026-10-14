import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnchorId, GuidanceEntry, ToolContext } from '../../lib/guidance/types';
import { buildIndex, search, type Match } from '../../lib/guidance/retrieval';
export interface Exchange {
    id: string;
    question: string;
    matches: Match[];
}
interface GuidanceValue {
    corpus: readonly GuidanceEntry[];
    context: ToolContext;
    exchanges: Readonly<Record<AnchorId, Exchange[]>>;
    ask: (anchor: AnchorId, question: string) => void;
    forget: (anchor: AnchorId) => void;
}
const Ctx = createContext<GuidanceValue | null>(null);
interface Props {
    corpus: readonly GuidanceEntry[];
    context: ToolContext;
    children: ReactNode;
}
export function GuidanceProvider({ corpus, context, children }: Props) {
    const [exchanges, setExchanges] = useState<Record<AnchorId, Exchange[]>>({});
    const sequence = useRef(0);
    const index = useMemo(() => buildIndex(corpus), [corpus]);
    const ask = useCallback((anchor: AnchorId, question: string) => {
        const trimmed = question.trim();
        if (trimmed.length === 0)
            return;
        const matches = search(index, trimmed, { context, anchor });
        sequence.current += 1;
        const entry: Exchange = { id: `ask-${sequence.current}`, question: trimmed, matches };
        setExchanges((current) => ({ ...current, [anchor]: [...(current[anchor] ?? []), entry] }));
    }, [index, context]);
    const forget = useCallback((anchor: AnchorId) => {
        setExchanges((current) => {
            const next = { ...current };
            delete next[anchor];
            return next;
        });
    }, []);
    const value = useMemo<GuidanceValue>(() => ({
        corpus,
        context,
        exchanges,
        ask,
        forget,
    }), [corpus, context, exchanges, ask, forget]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useGuidance(): GuidanceValue {
    const value = useContext(Ctx);
    if (!value)
        throw new Error('useGuidance must be used inside a GuidanceProvider');
    return value;
}
