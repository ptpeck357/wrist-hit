import { createWidget, widget, align, text_style, event } from '@zos/ui'
import { create, id } from '@zos/media'
import { messageBuilder } from '@zos/router'

// ─── Layout constants for GTR 4 (466×466 round display) ───────────────────
const SCREEN_W = 466
const SCREEN_H = 466
const CENTER_X = SCREEN_W / 2
const CENTER_Y = SCREEN_H / 2

// ─── State ─────────────────────────────────────────────────────────────────
let state = 'idle'   // idle | recording | waiting | result | error
let recorder = null
let statusText = null
let songText = null
let artistText = null
let tapBtn = null

// ─── UI Setup ──────────────────────────────────────────────────────────────
Page({
  onInit() {
    buildUI()
  },

  onDestroy() {
    if (recorder) {
      try { recorder.stop() } catch (e) {}
    }
  }
})

function buildUI() {
  // Background
  createWidget(widget.FILL_RECT, {
    x: 0, y: 0,
    w: SCREEN_W, h: SCREEN_H,
    color: 0x0a0a0a
  })

  // App title
  createWidget(widget.TEXT, {
    x: 0, y: 60,
    w: SCREEN_W, h: 50,
    text: 'WristHit',
    text_size: 32,
    color: 0xffffff,
    align_h: align.CENTER_H
  })

  // Big tap button (circle)
  tapBtn = createWidget(widget.FILL_RECT, {
    x: CENTER_X - 80, y: CENTER_Y - 80,
    w: 160, h: 160,
    radius: 80,
    color: 0x1db954   // Spotify green — feels music-y
  })

  // Button label
  createWidget(widget.TEXT, {
    x: CENTER_X - 80, y: CENTER_Y - 20,
    w: 160, h: 40,
    text: 'TAP',
    text_size: 28,
    color: 0xffffff,
    align_h: align.CENTER_H
  })

  // Status text (below button)
  statusText = createWidget(widget.TEXT, {
    x: 20, y: CENTER_Y + 100,
    w: SCREEN_W - 40, h: 40,
    text: 'Tap to identify a song',
    text_size: 18,
    color: 0x888888,
    align_h: align.CENTER_H
  })

  // Song title (shown after match)
  songText = createWidget(widget.TEXT, {
    x: 20, y: CENTER_Y + 100,
    w: SCREEN_W - 40, h: 44,
    text: '',
    text_size: 22,
    color: 0xffffff,
    align_h: align.CENTER_H,
    text_style: text_style.WRAP
  })

  // Artist name (shown after match)
  artistText = createWidget(widget.TEXT, {
    x: 20, y: CENTER_Y + 148,
    w: SCREEN_W - 40, h: 36,
    text: '',
    text_size: 18,
    color: 0x1db954,
    align_h: align.CENTER_H,
    text_style: text_style.WRAP
  })

  // Make the button tappable
  tapBtn.addEventListener(event.CLICK_DOWN, () => {
    if (state === 'idle' || state === 'result' || state === 'error') {
      startRecording()
    }
  })
}

// ─── Recording ─────────────────────────────────────────────────────────────
function startRecording() {
  setState('recording')

  recorder = create(id.RECORDER)
  recorder.setFormat(1 /* codec.OPUS */, {
    target_file: 'data://wristhit_sample.opus'
  })

  recorder.addEventListener(recorder.event.RECORD_COMPLETE, () => {
    sendToPhone()
  })

  recorder.start()

  // Record for 6 seconds then stop
  timer.createTimer(
    6000,
    0,
    () => {
      if (recorder) recorder.stop()
    },
    {}
  )
}

// ─── Send audio to Side Service on phone ────────────────────────────────────
function sendToPhone() {
  setState('waiting')

  messageBuilder.request(
    { action: 'identify', filePath: 'data://wristhit_sample.opus' },
    { timeout: 30000 }
  ).then(result => {
    if (result && result.song) {
      showResult(result.song, result.artist)
    } else {
      showError('No match found')
    }
  }).catch(err => {
    showError('Check phone connection')
  })
}

// ─── Display result ─────────────────────────────────────────────────────────
function showResult(song, artist) {
  setState('result')
  statusText.setProperty(prop.TEXT, '')
  songText.setProperty(prop.TEXT, song || 'Unknown')
  artistText.setProperty(prop.TEXT, artist || '')
}

function showError(msg) {
  setState('error')
  statusText.setProperty(prop.TEXT, msg)
  songText.setProperty(prop.TEXT, '')
  artistText.setProperty(prop.TEXT, '')
}

// ─── State machine ──────────────────────────────────────────────────────────
function setState(newState) {
  state = newState

  // Reset display
  statusText.setProperty(prop.TEXT, '')
  songText.setProperty(prop.TEXT, '')
  artistText.setProperty(prop.TEXT, '')

  switch (newState) {
    case 'idle':
      statusText.setProperty(prop.TEXT, 'Tap to identify a song')
      tapBtn.setProperty(prop.COLOR, 0x1db954)
      break
    case 'recording':
      statusText.setProperty(prop.TEXT, 'Listening...')
      tapBtn.setProperty(prop.COLOR, 0xe53935)  // red while recording
      break
    case 'waiting':
      statusText.setProperty(prop.TEXT, 'Identifying...')
      tapBtn.setProperty(prop.COLOR, 0xffa000)  // amber while waiting
      break
    case 'result':
      tapBtn.setProperty(prop.COLOR, 0x1db954)
      break
    case 'error':
      tapBtn.setProperty(prop.COLOR, 0x1db954)
      break
  }
}
