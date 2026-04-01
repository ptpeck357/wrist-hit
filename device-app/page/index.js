import { createWidget, widget, align, text_style, event, prop } from '@zos/ui';
import { removeFile } from '@zos/fs';
import { create, id, codec } from '@zos/media';
import { createTimer } from '@zos/timer';
import { MessageBuilder, push } from '@zos/router';
import { localStorage } from '@zos/storage';
import { TransferFile } from '@zos/ble';
import { vibrate } from '@zos/interaction';
import { queryPermission, requestPermission } from '@zos/permission';

const messageBuilder = new MessageBuilder();

// ─── Layout constants for GTR 4 (466×466 round display) ───────────────────
const SCREEN_W = 466;
const SCREEN_H = 466;
const CENTER_X = SCREEN_W / 2;
const CENTER_Y = SCREEN_H / 2;

// ─── State ─────────────────────────────────────────────────────────────────
let state = 'idle'; // idle | recording | waiting | result | nomatch | error
let recorder = null;
let statusText = null;
let countdownText = null;
let songText = null;
let artistText = null;
let tapBtn = null;

// ─── UI Setup ──────────────────────────────────────────────────────────────
Page({
	onInit() {
		buildUI();
	},

	onDestroy() {
		if (recorder) {
			try {
				recorder.stop();
			} catch {}
		}
	},
});

function buildUI() {
	// Background
	createWidget(widget.FILL_RECT, {
		x: 0,
		y: 0,
		w: SCREEN_W,
		h: SCREEN_H,
		color: 0x0a0a0a,
	});

	// App title
	createWidget(widget.TEXT, {
		x: 0,
		y: 60,
		w: SCREEN_W,
		h: 50,
		text: 'WristHit',
		text_size: 32,
		color: 0xffffff,
		align_h: align.CENTER_H,
	});

	// History button (top-right)
	const historyBtn = createWidget(widget.TEXT, {
		x: SCREEN_W - 70,
		y: 68,
		w: 50,
		h: 34,
		text: '≡',
		text_size: 24,
		color: 0x888888,
		align_h: align.CENTER_H,
	});
	historyBtn.addEventListener(event.CLICK_DOWN, () => {
		push({ url: 'device-app/page/history' });
	});

	// Big tap button (circle)
	tapBtn = createWidget(widget.FILL_RECT, {
		x: CENTER_X - 80,
		y: CENTER_Y - 80,
		w: 160,
		h: 160,
		radius: 80,
		color: 0x1db954, // Spotify green — feels music-y
	});

	// Button label
	createWidget(widget.TEXT, {
		x: CENTER_X - 80,
		y: CENTER_Y - 20,
		w: 160,
		h: 40,
		text: 'TAP',
		text_size: 28,
		color: 0xffffff,
		align_h: align.CENTER_H,
	});

	// Status text (below button)
	statusText = createWidget(widget.TEXT, {
		x: 20,
		y: CENTER_Y + 100,
		w: SCREEN_W - 40,
		h: 40,
		text: 'Tap to identify a song',
		text_size: 18,
		color: 0x888888,
		align_h: align.CENTER_H,
	});

	// Countdown text (shown during recording, overlaid on button)
	countdownText = createWidget(widget.TEXT, {
		x: CENTER_X - 80,
		y: CENTER_Y - 24,
		w: 160,
		h: 48,
		text: '',
		text_size: 36,
		color: 0xffffff,
		align_h: align.CENTER_H,
	});

	// Song title (shown after match)
	songText = createWidget(widget.TEXT, {
		x: 20,
		y: CENTER_Y + 100,
		w: SCREEN_W - 40,
		h: 44,
		text: '',
		text_size: 22,
		color: 0xffffff,
		align_h: align.CENTER_H,
		text_style: text_style.WRAP,
	});

	// Artist name (shown after match)
	artistText = createWidget(widget.TEXT, {
		x: 20,
		y: CENTER_Y + 148,
		w: SCREEN_W - 40,
		h: 36,
		text: '',
		text_size: 18,
		color: 0x1db954,
		align_h: align.CENTER_H,
		text_style: text_style.WRAP,
	});

	// Make the button tappable
	tapBtn.addEventListener(event.CLICK_DOWN, () => {
		if (state === 'idle' || state === 'result' || state === 'nomatch' || state === 'error') {
			startRecording();
		}
	});
}

// ─── Recording ─────────────────────────────────────────────────────────────
function startRecording() {
	const permStatus = queryPermission({ permissions: ['device:os.media'] });
	if (permStatus[0] !== 2) {
		// Permission not granted — request it; user must tap again after granting
		requestPermission({ permissions: ['device:os.media'] });
		showError('Mic permission needed');
		return;
	}

	setState('recording');

	recorder = create(id.RECORDER);
	recorder.setFormat(codec.OPUS, {
		target_file: 'data://wristhit_sample.opus',
	});

	recorder.addEventListener(recorder.event.RECORD_COMPLETE, () => {
		sendToPhone();
	});

	recorder.addEventListener(recorder.event.ERROR, () => {
		showError('Mic error');
	});

	recorder.start();

	// Countdown from 6 to 0, updating every second
	let secondsLeft = 6;
	countdownText.setProperty(prop.TEXT, String(secondsLeft));
	createTimer({
		repeat: true,
		timeout: 1000,
		callback: () => {
			secondsLeft -= 1;
			countdownText.setProperty(prop.TEXT, secondsLeft > 0 ? String(secondsLeft) : '');
		},
	});

	// Stop recording after 6 seconds
	createTimer({
		repeat: false,
		timeout: 6000,
		callback: () => {
			if (recorder) recorder.stop();
		},
	});
}

// ─── Send audio to Side Service on phone ────────────────────────────────────
function sendToPhone() {
	setState('waiting');

	const transfer = TransferFile.getFileTransferInstance();
	transfer.transferFile(
		{ localPath: 'data://wristhit_sample.opus', remoteName: 'wristhit_sample.opus' },
		{
			onComplete(remoteFilePath) {
				messageBuilder
					.request({ action: 'identify', filePath: remoteFilePath }, { timeout: 30000 })
					.then((result) => {
						const song = typeof result?.song === 'string' ? result.song.slice(0, 255) : null;
						const artist = typeof result?.artist === 'string' ? result.artist.slice(0, 255) : '';
						if (song) {
							showResult(song, artist);
						} else {
							showNoMatch();
						}
					})
					.catch(() => {
						showError('Check phone connection');
					});
			},
			onError() {
				showError('Transfer failed');
			},
		},
	);
}

// ─── Display result ─────────────────────────────────────────────────────────
function saveToHistory(song, artist) {
	let history = [];
	try {
		const raw = localStorage.getItem('wristhit_history');
		if (raw) history = JSON.parse(raw);
	} catch {}
	history.unshift({ song, artist });
	if (history.length > 10) history = history.slice(0, 10);
	localStorage.setItem('wristhit_history', JSON.stringify(history));
}

function showResult(song, artist) {
	removeFile({ path: 'data://wristhit_sample.opus' });
	vibrate({ type: 'short' });
	saveToHistory(song, artist);
	setState('result');
	statusText.setProperty(prop.TEXT, '');
	songText.setProperty(prop.TEXT, song || 'Unknown');
	artistText.setProperty(prop.TEXT, artist || '');
	createTimer({ repeat: false, timeout: 5000, callback: () => setState('idle') });
}

function showNoMatch() {
	removeFile({ path: 'data://wristhit_sample.opus' });
	setState('nomatch');
	songText.setProperty(prop.TEXT, 'No match');
	createTimer({ repeat: false, timeout: 5000, callback: () => setState('idle') });
}

function showError(msg) {
	removeFile({ path: 'data://wristhit_sample.opus' });
	setState('error');
	statusText.setProperty(prop.TEXT, msg);
	songText.setProperty(prop.TEXT, '');
	artistText.setProperty(prop.TEXT, '');
	createTimer({ repeat: false, timeout: 5000, callback: () => setState('idle') });
}

// ─── State machine ──────────────────────────────────────────────────────────
function setState(newState) {
	state = newState;

	// Reset display
	statusText.setProperty(prop.TEXT, '');
	countdownText.setProperty(prop.TEXT, '');
	songText.setProperty(prop.TEXT, '');
	artistText.setProperty(prop.TEXT, '');

	switch (newState) {
		case 'idle':
			statusText.setProperty(prop.TEXT, 'Tap to identify a song');
			tapBtn.setProperty(prop.COLOR, 0x1db954);
			break;
		case 'recording':
			statusText.setProperty(prop.TEXT, 'Listening...');
			tapBtn.setProperty(prop.COLOR, 0xe53935); // red while recording
			break;
		case 'waiting':
			statusText.setProperty(prop.TEXT, 'Identifying...');
			tapBtn.setProperty(prop.COLOR, 0xffa000); // amber while waiting
			break;
		case 'result':
			tapBtn.setProperty(prop.COLOR, 0x1db954);
			break;
		case 'nomatch':
			songText.setProperty(prop.COLOR, 0x888888); // softer colour vs error red
			tapBtn.setProperty(prop.COLOR, 0x1db954);
			break;
		case 'error':
			tapBtn.setProperty(prop.COLOR, 0xe53935); // red to signal a real problem
			break;
	}
}
