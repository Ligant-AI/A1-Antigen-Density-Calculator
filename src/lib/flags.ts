export type FlagLevel = 'warning' | 'critical';
export interface Flag {
    level: FlagLevel;
    message: string;
    remedy?: string;
}
