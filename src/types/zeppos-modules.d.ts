/**
 * Custom module declarations for @zos/* APIs as used by this project.
 * @zeppos/device-types v3 has mismatches with the actual runtime API,
 * so we declare the exact shapes we rely on here.
 */

declare module '@zos/fs' {
	export function readFileSync(opts: { path: string }): ArrayBuffer | null;
	export function removeFile(opts: { path: string }): void;
}

declare module '@zos/media' {
	interface Recorder {
		setFormat(codec: number, opts: { target_file: string }): void;
		addEventListener(eventType: number, callback: () => void): void;
		start(): void;
		stop(): void;
		event: { RECORD_COMPLETE: number; ERROR: number };
	}
	export function create(type: number): Recorder;
	export const id: { RECORDER: number };
	export const codec: { OPUS: number };
}

declare module '@zos/timer' {
	export function createTimer(opts: { repeat: boolean; timeout: number; callback: () => void }): number;
}

declare module '@zos/router' {
	export class MessageBuilder {
		on(event: 'request', handler: (ctx: MessageContext) => void): void;
		request(payload: object, opts?: { timeout?: number }): Promise<unknown>;
	}
	export function push(opts: { url: string }): void;
	export function back(): void;

	interface MessageContext {
		request: { payload: unknown };
		response(data: { data: unknown }): void;
	}
}

declare module '@zos/storage' {
	interface ZeppStorage {
		getItem(key: string): string | null;
		setItem(key: string, value: string): void;
		removeItem(key: string): void;
	}
	export const localStorage: ZeppStorage;
}

declare module '@zos/ble' {
	interface FileTransfer {
		transferFile(
			file: { localPath: string; remoteName: string },
			callbacks: { onComplete: (remotePath: string) => void; onError: () => void },
		): void;
	}
	export const TransferFile: {
		getFileTransferInstance(): FileTransfer;
	};
}

declare module '@zos/interaction' {
	export function vibrate(opts: { type: string }): void;
}

declare module '@zos/permission' {
	export function queryPermission(opts: { permissions: string[] }): number[];
	export function requestPermission(opts: { permissions: string[] }): void;
}

declare module '@zos/utils' {
	interface Logger {
		debug(...args: unknown[]): void;
		info(...args: unknown[]): void;
		warn(...args: unknown[]): void;
		error(...args: unknown[]): void;
	}
	export const log: Logger;
}
