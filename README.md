# WristHit

Identify any song playing around you — straight from your wrist. A Shazam-powered mini app for the **Amazfit GTR 4** running Zepp OS 3.x.

Tap the button, hold your watch near the music for 6 seconds, and get the song name and artist back on your watch.

## Features

- One-tap song identification via the [Shazam API](https://rapidapi.com/apidojo/api/shazam)
- Live 6-second countdown during recording
- Haptic feedback when a match is found
- Song history — browse your last 10 identified tracks
- Handles "no match" and connection errors with distinct UI states
- Auto-resets to idle after showing a result

## Requirements

- Amazfit GTR 4 running Zepp OS 3.0 or later
- [Zepp app](https://www.zepp.com/) installed on your phone (Android or iOS)
- [Zeus CLI](https://docs.zepp.com/docs/guides/tools/cli/) for building and sideloading
- Node.js 16+
- A free [RapidAPI](https://rapidapi.com/apidojo/api/shazam) account (500 requests/month on the free tier)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-username/wrist-hit.git
cd wrist-hit
npm install
npm install -g @zeppos/zeus-cli
```

### 2. Add your Shazam API key

```bash
cp side-service/config.example.js side-service/config.js
```

Open `side-service/config.js` and replace `YOUR_RAPIDAPI_KEY` with your key from RapidAPI. This file is gitignored and will never be committed.

### 3. Enable Developer Mode on your watch

In the Zepp app on your phone, go to **Profile → Amazfit GTR 4 → Device Info** and tap the firmware version 7 times.

### 4. Install on your watch

```bash
zeus preview   # sideload directly to the watch
# or
zeus build     # produce a .zpk package
```

## How it works

```
Tap watch button
      │
      ▼
Watch records 6s of audio (OPUS via @zos/media)
      │
      ▼
Audio transferred to phone over BLE (@zos/ble TransferFile)
      │
      ▼
Phone-side service base64-encodes the file,
POSTs it to the Shazam API (RapidAPI)
      │
      ▼
API returns song title + artist
      │
      ▼
Result sent back to watch via MessageBuilder
Watch displays the match and vibrates
```

## Project structure

```
wristhit/
├── app.json                    # App manifest — ID, permissions, target device
├── device-app/
│   └── page/
│       ├── index.js            # Watch UI, recording logic, state machine
│       └── history.js          # Song history page (last 10 matches)
├── side-service/
│   ├── index.js                # Phone-side Shazam API integration
│   └── config.example.js       # API key template — copy to config.js
└── assets/
    └── icon.png                # App icon (80×80 PNG)
```

## Contributing

```bash
npm run fix          # Autofix ESLint + Prettier issues
npm run lint:eslint  # ESLint check only
npm run lint:prettier # Prettier check only
```

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) format — this is enforced by commitlint on every commit.

## License

MIT
