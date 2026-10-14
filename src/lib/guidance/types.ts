import type { Flag } from '../flags';
export type AnchorId = string;
export type Block = {
    kind: 'p';
    text: string;
} | {
    kind: 'list';
    items: string[];
} | {
    kind: 'note';
    text: string;
};
export type EntryKind = 'definition' | 'practice';
export interface GuidanceEntry {
    id: string;
    anchor: AnchorId;
    title: string;
    kind?: EntryKind;
    body: Block[];
    when?: (context: ToolContext) => boolean;
    priority?: number;
}
export type FactValue = number | string | boolean | null;
export interface ToolContext {
    tool: string;
    facts: Readonly<Record<string, FactValue>>;
    flags: readonly Flag[];
}
export function numberFact(context: ToolContext, key: string): number | null {
    const v = context.facts[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
export function boolFact(context: ToolContext, key: string): boolean {
    return context.facts[key] === true;
}
export function entriesFor(corpus: readonly GuidanceEntry[], anchor: AnchorId, context: ToolContext): GuidanceEntry[] {
    return corpus
        .filter((e) => e.anchor === anchor && (!e.when || e.when(context)))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
export function plainText(entry: GuidanceEntry): string {
    const parts = [entry.title];
    for (const block of entry.body) {
        if (block.kind === 'list')
            parts.push(...block.items);
        else
            parts.push(block.text);
    }
    return parts.join(' ').replace(/\*/g, '');
}
