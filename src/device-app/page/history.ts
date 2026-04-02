import { createWidget, widget, align, text_style, event } from '@zos/ui';
import { localStorage } from '@zos/storage';
import { back } from '@zos/router';
import type { HistoryEntry } from '../../types/index.js';

const SCREEN_W = 466;
const SCREEN_H = 466;

Page({
	onInit() {
		buildUI();
	},
});

function getHistory(): HistoryEntry[] {
	try {
		const raw = localStorage.getItem('wristhit_history');
		return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
	} catch {
		return [];
	}
}

function buildUI(): void {
	const history = getHistory();

	// Background
	createWidget(widget.FILL_RECT, {
		x: 0,
		y: 0,
		w: SCREEN_W,
		h: SCREEN_H,
		color: 0x0a0a0a,
	});

	// Title
	createWidget(widget.TEXT, {
		x: 0,
		y: 60,
		w: SCREEN_W,
		h: 50,
		text: 'History',
		text_size: 32,
		color: 0xffffff,
		align_h: align.CENTER_H,
	});

	// Back button (top-left)
	const backBtn = createWidget(widget.TEXT, {
		x: 20,
		y: 68,
		w: 50,
		h: 34,
		text: '←',
		text_size: 24,
		color: 0x888888,
		align_h: align.CENTER_H,
	});
	backBtn.addEventListener(event.CLICK_DOWN, () => {
		back();
	});

	if (history.length === 0) {
		createWidget(widget.TEXT, {
			x: 20,
			y: SCREEN_H / 2 - 20,
			w: SCREEN_W - 40,
			h: 40,
			text: 'No songs identified yet',
			text_size: 18,
			color: 0x888888,
			align_h: align.CENTER_H,
		});
		return;
	}

	createWidget(widget.SCROLL_LIST, {
		x: 0,
		y: 120,
		w: SCREEN_W,
		h: SCREEN_H - 120,
		item_height: 80,
		item_count: history.length,
		render_func: (index: number, item: { createWidget: typeof createWidget }) => {
			const entry = history[index];

			item.createWidget(widget.TEXT, {
				x: 20,
				y: 10,
				w: SCREEN_W - 40,
				h: 36,
				text: entry.song || 'Unknown',
				text_size: 20,
				color: 0xffffff,
				text_style: text_style.ELLIPSIS,
			});

			item.createWidget(widget.TEXT, {
				x: 20,
				y: 46,
				w: SCREEN_W - 40,
				h: 26,
				text: entry.artist || '',
				text_size: 16,
				color: 0x1db954,
				text_style: text_style.ELLIPSIS,
			});
		},
	});
}
