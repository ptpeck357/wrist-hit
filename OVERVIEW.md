# WristHit — Project Overview

## What it is
A Zepp OS mini app for the **Amazfit GTR 4** that lets you identify any song
playing around you by tapping your watch. Think Shazam, but from your wrist
without touching your phone.

## How it works (end to end)

```
User taps watch
      │
      ▼
Watch records 6s of audio via built-in mic
(Zepp OS @zos/media recorder → saves as .opus file)
      │
      ▼
Audio file transferred to phone over Bluetooth
(@zos/ble TransferFile API)
      │
      ▼
Side Service on phone reads the file,
base64-encodes it, POSTs to Shazam API (RapidAPI)
      │
      ▼
API returns: song title, artist, album art URL
      │
      ▼
Result sent back to watch via MessageBuilder
      │
      ▼
Watch displays: song name + artist
```

## File structure

```
wristhit/
├── app.json                  # App manifest — ID, permissions, device targets
├── device-app/
│   └── page/
│       └── index.js          # Everything that runs ON the watch:
│                             #   - UI (466×466 round display)
│                             #   - Microphone recording
│                             #   - State machine (idle/recording/waiting/result/error)
│                             #   - Sends audio + receives result via MessageBuilder
├── side-service/
│   └── index.js              # Everything that runs on the PHONE:
│                             #   - Listens for messages from watch
│                             #   - Reads transferred audio file
│                             #   - Calls Shazam API
│                             #   - Returns song data to watch
├── assets/
│   └── icon.png              # App icon (80×80, not yet created)
├── TODO.md                   # Remaining work items for Claude Code
├── README.md                 # Setup and install instructions
└── LICENSE                   # MIT
```

## Key technologies

| What | How |
|---|---|
| Watch UI | Zepp OS widget API (`@zos/ui`) — absolute pixel layout |
| Audio recording | `@zos/media` recorder → OPUS format |
| Watch↔Phone comms | `@zos/router` MessageBuilder over Bluetooth |
| File transfer | `@zos/ble` TransferFile API |
| Song identification | Shazam API via RapidAPI (free: 500 req/month) |
| Language | JavaScript (ES modules) |
| Build tool | Zeus CLI (`zeus preview` / `zeus build`) |

## Current status

The starter code establishes the full architecture and UI structure, but has
several bugs that prevent it from compiling and running. See **TODO.md** for
the complete list. The Critical items (items 1–6) must be fixed before the app
will build. Items 7–11 are needed for it to work reliably. Items 12–15 are
polish.

## What's working in the starter

- Full UI layout for 466×466 round screen
- State machine (idle → recording → waiting → result/error)
- Button colour changes per state (green/red/amber)
- Recording logic skeleton
- Side service API call structure
- Base64 encoding utility
- App manifest with correct GTR 4 device ID

## What still needs to be done

See TODO.md — short version:
1. Fix several missing/wrong imports
2. Wire up the manifest to register both the page and side service
3. Fix file transfer (can't pass a file path across BT — must use TransferFile)
4. Add countdown timer UI during recording
5. Error handling for mic and network failures
6. Auto-reset after result is shown
7. App icon
8. Haptic feedback on match
