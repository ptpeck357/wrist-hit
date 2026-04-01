/**
 * WristHit - Side Service
 *
 * Runs on the phone via the Zepp companion app.
 * Receives the transferred audio file path, calls the Shazam API,
 * and returns the result to the watch.
 *
 * Setup:
 *   1. Get a free API key from https://rapidapi.com/apidojo/api/shazam
 *   2. Copy side-service/config.example.js to side-service/config.js
 *   3. Replace YOUR_RAPIDAPI_KEY in config.js with your actual key
 */

import { MessageBuilder } from '@zos/router';
import { readFileSync } from '@zos/fs';
import { log } from '@zos/utils';
import { RAPIDAPI_KEY } from './config.js';

const messageBuilder = new MessageBuilder();

const SHAZAM_API_URL = 'https://shazam.p.rapidapi.com/songs/detect';
const ALLOWED_FILE_PATH = /^wristhit_sample\.opus$/;
const MAX_SONG_LENGTH = 255;
const RATE_LIMIT_MS = 8000; // minimum ms between identify requests

if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY') {
	throw new Error(
		'WristHit: RAPIDAPI_KEY is not configured. Copy side-service/config.example.js to config.js and add your key.',
	);
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
let lastRequestTime = 0;

function isRateLimited() {
	const now = Date.now();
	if (now - lastRequestTime < RATE_LIMIT_MS) return true;
	lastRequestTime = now;
	return false;
}

// ─── Listen for messages from the watch ─────────────────────────────────────
messageBuilder.on('request', async (ctx) => {
	const { action, filePath } = ctx.request.payload;

	if (action !== 'identify') return;

	if (isRateLimited()) {
		log.warn('WristHit: rate limit hit, ignoring request');
		ctx.response({ data: { error: 'Too many requests' } });
		return;
	}

	// Validate file path — only allow the expected filename, no traversal
	if (typeof filePath !== 'string' || !ALLOWED_FILE_PATH.test(filePath.split('/').pop())) {
		log.error('WristHit: rejected invalid file path');
		ctx.response({ data: { error: 'Invalid request' } });
		return;
	}

	log.debug('WristHit: received identify request');

	try {
		const result = await identifySong(filePath);
		ctx.response({ data: result });
	} catch (err) {
		log.error('WristHit: identification failed:', err.message);
		ctx.response({ data: { error: 'Identification failed' } });
	}
});

// ─── Core identification function ────────────────────────────────────────────
async function identifySong(filePath) {
	const fileData = readFileSync({ path: filePath });

	if (!fileData) {
		throw new Error('Could not read audio file');
	}

	const base64Audio = arrayBufferToBase64(fileData);

	log.debug('WristHit: audio encoded, sending to API');

	const response = await fetch(SHAZAM_API_URL, {
		method: 'POST',
		headers: {
			'content-type': 'text/plain',
			'X-RapidAPI-Key': RAPIDAPI_KEY,
			'X-RapidAPI-Host': 'shazam.p.rapidapi.com',
		},
		body: base64Audio,
	});

	if (!response.ok) {
		log.error('WristHit: API returned', response.status);
		throw new Error('API request failed');
	}

	const data = await response.json();

	log.debug('WristHit: API response received, track found:', !!data.track);

	if (data && data.track) {
		const song = sanitizeString(data.track.title);
		const artist = sanitizeString(data.track.subtitle);

		if (!song) throw new Error('Invalid API response');

		return { song, artist };
	}

	return { song: null, artist: null };
}

// ─── Sanitize a string from the API response ─────────────────────────────────
function sanitizeString(value) {
	if (typeof value !== 'string') return null;
	return value.trim().slice(0, MAX_SONG_LENGTH) || null;
}

// ─── Utility: ArrayBuffer → base64 string ───────────────────────────────────
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
