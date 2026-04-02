export type AppState = 'idle' | 'recording' | 'waiting' | 'result' | 'nomatch' | 'error';

export interface SongResult {
	song: string | null;
	artist: string | null;
}

export interface HistoryEntry {
	song: string;
	artist: string;
}

export interface IdentifyPayload {
	action: string;
	filePath: string;
}
