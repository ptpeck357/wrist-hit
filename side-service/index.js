/**
 * WristHit - Side Service
 *
 * This runs on the phone (via the Zepp companion app).
 * It receives the recorded audio file path from the watch,
 * reads it, sends it to the Shazam-compatible API,
 * and returns the result back to the watch.
 *
 * Setup:
 *   1. Get a free API key from https://rapidapi.com/apidojo/api/shazam
 *   2. Replace YOUR_RAPIDAPI_KEY below with your key
 */

import { messageBuilder } from '@zos/router'
import { readFileSync } from '@zos/fs'
import { log } from '@zos/utils'

const RAPIDAPI_KEY = 'YOUR_RAPIDAPI_KEY'   // ← replace this
const SHAZAM_API_URL = 'https://shazam.p.rapidapi.com/songs/detect'

// ─── Listen for messages from the watch ─────────────────────────────────────
messageBuilder.on('request', async (ctx) => {
  const { action, filePath } = ctx.request.payload

  if (action !== 'identify') return

  log.debug('WristHit: received identify request, file:', filePath)

  try {
    const result = await identifySong(filePath)
    ctx.response({ data: result })
  } catch (err) {
    log.error('WristHit: identification failed:', err)
    ctx.response({ data: { error: err.message } })
  }
})

// ─── Core identification function ────────────────────────────────────────────
async function identifySong(filePath) {
  // Read the recorded OPUS file from watch storage
  const fileData = readFileSync({ path: filePath })

  if (!fileData) {
    throw new Error('Could not read audio file')
  }

  // Convert to base64 — Shazam API expects base64-encoded audio
  const base64Audio = arrayBufferToBase64(fileData)

  log.debug('WristHit: audio file read, size (base64):', base64Audio.length)

  // Call the Shazam API
  const response = await fetch(SHAZAM_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
    },
    body: base64Audio
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  log.debug('WristHit: API response:', JSON.stringify(data))

  // Parse the response
  if (data && data.track) {
    return {
      song: data.track.title || 'Unknown',
      artist: data.track.subtitle || 'Unknown Artist',
      albumArt: data.track.images?.coverart || null,
      shazamUrl: data.track.url || null
    }
  }

  // No match
  return { song: null, artist: null }
}

// ─── Utility: ArrayBuffer → base64 string ───────────────────────────────────
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
