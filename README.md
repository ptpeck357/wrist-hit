# WristHit 🎵

Identify songs from your wrist. A Shazam-like mini app for the **Amazfit GTR 4** (Zepp OS 3.x).

## How it works

1. Tap the button on your watch
2. WristHit records 6 seconds of audio via the built-in mic
3. The audio is sent to your phone over Bluetooth
4. Your phone calls the Shazam API and gets the song name
5. The result appears on your watch in seconds

## Requirements

- Amazfit GTR 4 running Zepp OS 3.0 or later
- [Zepp app](https://www.zepp.com/) on your phone (Android or iOS)
- [Zeus CLI](https://docs.zepp.com/docs/guides/tools/cli/) installed on your computer
- Node.js 16+
- A free [RapidAPI](https://rapidapi.com/apidojo/api/shazam) account for the Shazam API key

## Setup

### 1. Install Zeus CLI

```bash
npm install -g @zeppos/zeus-cli
```

### 2. Get your API key

- Sign up at [rapidapi.com](https://rapidapi.com/apidojo/api/shazam)
- Subscribe to the **Shazam** API (free tier: 500 requests/month)
- Copy your API key

### 3. Add your API key

Open `side-service/index.js` and replace:

```js
const RAPIDAPI_KEY = 'YOUR_RAPIDAPI_KEY'
```

with your actual key.

### 4. Enable Developer Mode on your watch

In the **Zepp app** on your phone:
- Go to **Profile → Amazfit GTR 4 → Device Info**
- Tap the firmware version 7 times to enable developer mode

### 5. Build and install

```bash
# Preview on device (watch must be connected via Zepp app)
zeus preview

# Or build a .zpk package
zeus build
```

## Project structure

```
wristhit/
├── app.json                  # App manifest (ID, permissions, target device)
├── device-app/
│   └── page/
│       └── index.js          # Watch UI + recording logic
├── side-service/
│   └── index.js              # Phone-side API calls to Shazam
└── assets/
    └── icon/                 # Place your app icon here (80×80 PNG)
```

## Customisation ideas

- Show album art (the API returns a cover art URL)
- Save a history of identified songs
- Add haptic feedback when a match is found
- Support longer recordings for harder-to-identify tracks

## License

MIT — do whatever you want with it.
