# WristHit — TODO for Claude Code

This is a Zepp OS mini app for the Amazfit GTR 4 that records audio from the
watch microphone and identifies the song via the Shazam API (RapidAPI).

The starter code is functional in structure but has several bugs, missing
pieces, and polish items that need to be completed before it will build and run.
Work through these tasks in order — the Critical section must be done first.

---

## CRITICAL (app won't work without these)

### 1. Fix missing import in device-app/page/index.js
`timer` is used but never imported. Add the correct Zepp OS import:
```js
import { createTimer } from '@zos/timer'
```
Then replace all `timer.createTimer(...)` calls with `createTimer(...)`.
The Zepp OS timer API signature is:
```js
createTimer({ repeat: false, callback: fn, timeout: ms })
```

### 2. Fix `prop` references in device-app/page/index.js
`prop` is used (e.g. `prop.TEXT`, `prop.COLOR`) but never imported.
Import it from `@zos/ui`:
```js
import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
```

### 3. Fix codec import in device-app/page/index.js
The recorder uses a magic number `1` for the codec. Import and use the
constant instead:
```js
import { create, id, codec } from '@zos/media'
```
Then change:
```js
recorder.setFormat(1 /* codec.OPUS */, { ... })
```
to:
```js
recorder.setFormat(codec.OPUS, { ... })
```

### 4. Fix messageBuilder import in device-app/page/index.js
`messageBuilder` is imported from `@zos/router` but on the device side it
should come from `@zos/router`'s `MessageBuilder` class and be instantiated.
Replace:
```js
import { messageBuilder } from '@zos/router'
```
with:
```js
import { MessageBuilder } from '@zos/router'
const messageBuilder = new MessageBuilder()
```
Do the same fix in `side-service/index.js`.

### 5. Wire up the Side Service in app.json
The `app.json` manifest declares the device app but doesn't register the side
service. Add a `"module"` section:
```json
"module": {
  "page": {
    "pages": ["device-app/page/index"]
  },
  "app-side": {
    "path": "side-service/index"
  }
}
```
Add this inside the `"app"` object.

### 6. Fix file transfer — watch can't directly pass a file path to the phone
The current code sends a file path string to the side service, but the side
service can't read files from watch storage directly. The audio file needs to
be transferred using the Zepp OS `@zos/ble` TransferFile API before the
identify request is sent.

In `device-app/page/index.js`, update `sendToPhone()` to:
1. Use `TransferFile` from `@zos/ble` to push `data://wristhit_sample.opus`
   to the phone
2. Only after the transfer completes, send the `messageBuilder.request()`
   with the local phone-side file path

In `side-service/index.js`, update to receive the transferred file path
(it will land in a temp directory on the phone — log it to confirm the path
during testing).

---

## IMPORTANT (correctness and stability)

### 7. Add a countdown timer to the UI during recording
Right now the user just sees "Listening..." with no feedback on how long is
left. Add a text widget that counts down from 6 to 0 during recording.
Update it each second using `createTimer` with `repeat: true`.

### 8. Handle recorder errors
The recorder's `RECORD_COMPLETE` event doesn't distinguish success from
failure. Add a listener for recorder errors:
```js
recorder.addEventListener(recorder.event.ERROR, (err) => {
  showError('Mic error')
})
```

### 9. Clean up the temp audio file after use
After a successful or failed identification, delete the temp file so it
doesn't accumulate on the watch:
```js
import { removeFile } from '@zos/fs'
// after result received:
removeFile({ path: 'data://wristhit_sample.opus' })
```

### 10. Reset state after showing result
After showing a result or error for 5 seconds, automatically return to idle
so the user can tap again without having to know to tap the result screen.
Use `createTimer` with a 5000ms timeout after `showResult()` / `showError()`.

### 11. Validate API key at startup
In `side-service/index.js`, check if `RAPIDAPI_KEY` is still the placeholder
value and log a clear error if so — otherwise the failure message on the watch
will be confusing.

---

## NICE TO HAVE (polish)

### 12. Add an app icon
Create a 80×80 PNG icon and place it at `assets/icon.png`. The icon should be
referenced in `app.json` as `"icon": "assets/icon.png"`.
A simple music note or waveform on a dark background works well.

### 13. Add haptic feedback on result
When a song is found, trigger a vibration so the user knows to look at their
watch even if it's at their side:
```js
import { vibrate } from '@zos/interaction'
vibrate({ type: 'short' })
```

### 14. Show a "no match" state differently from an error
Currently both "no match" and "connection error" call `showError()` with
different messages. Create a distinct `showNoMatch()` function that displays
a music note emoji and "No match" in a softer colour, separate from the red
error state used for connection problems.

### 15. Add a history page (stretch goal)
Create a second page `device-app/page/history.js` that stores the last 10
identified songs using `@zos/storage` (localStorage equivalent) and displays
them in a scrollable list. Add navigation to it from the main page via a
small button in the top-right corner.

---

## NOTES FOR CLAUDE CODE

- Zepp OS docs: https://docs.zepp.com/docs/reference/device-app-api/newAPI/
- Target device: Amazfit GTR 4, screen 466×466 round AMOLED
- All UI coordinates are absolute pixels, no flex/grid layout available
- The app uses JavaScript (not TypeScript) — keep it that way
- Test with `zeus preview` after each change; the watch must be connected via
  the Zepp companion app on your phone
- The RapidAPI key goes in `side-service/index.js` — never commit it; add
  `side-service/config.js` to .gitignore and move the key there if needed
