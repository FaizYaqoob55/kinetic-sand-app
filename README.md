# SandTable App 🌀
### World-Class React Native App for Kinetic Sand Tables

---

## Features

- ✅ QR Code table connect (one scan!)
- ✅ Auto network discovery
- ✅ 500+ bundled patterns (offline)
- ✅ Full RGB LED control with effects
- ✅ Real-time progress via WebSocket
- ✅ Speed control slider
- ✅ Playlist with shuffle + repeat
- ✅ Sleep timer + daily schedule
- ✅ Beautiful dark premium UI
- ✅ Onboarding flow
- ✅ Redux state management
- ✅ FluidNC ESP32 full API support

---

## Folder Structure

```
SandTableApp/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── package.json                    # Dependencies
└── src/
    ├── constants/
    │   ├── colors.js               # Premium dark theme colors
    │   └── patterns.js             # 500+ patterns data
    ├── navigation/
    │   └── AppNavigator.js         # Stack + Tab navigation
    ├── screens/
    │   ├── SplashScreen.js         # Animated splash
    │   ├── OnboardingScreen.js     # First-time onboarding
    │   ├── ConnectScreen.js        # QR scan + manual connect
    │   ├── HomeScreen.js           # Main dashboard
    │   ├── PatternLibraryScreen.js # 500+ patterns grid/list
    │   ├── PatternDetailScreen.js  # Pattern detail + play
    │   ├── NowPlayingScreen.js     # Live playback controls
    │   ├── PlaylistScreen.js       # Queue management
    │   ├── LEDControlScreen.js     # RGB color + effects
    │   ├── ScheduleScreen.js       # Timer + daily schedule
    │   └── SettingsScreen.js       # App + table settings
    ├── services/
    │   ├── FluidNCService.js       # ESP32 HTTP API
    │   └── WebSocketService.js     # Real-time WS connection
    └── store/
        ├── index.js                # Redux store
        ├── tableSlice.js           # Table state
        └── patternSlice.js         # Pattern state
```

---

## Setup Instructions

### 1. Install Node.js
Download from nodejs.org

### 2. Install Expo CLI
```bash
npm install -g expo-cli
```

### 3. Install dependencies
```bash
cd SandTableApp
npm install
```

### 4. Run the app
```bash
npx expo start
```

### 5. On your phone
- Install "Expo Go" from Play Store
- Scan the QR code in terminal
- App opens on your phone!

---

## How App Connects to ESP32

```
Customer scans QR code on table bottom
        ↓
App reads: { ip: "192.168.1.100", name: "SandTable" }
        ↓
App connects via HTTP to FluidNC API
        ↓
App connects via WebSocket for real-time
        ↓
Customer selects pattern → App uploads .gcode → ESP32 runs it
        ↓
Motors move → Ball draws in sand! 🎉
```

---

## FluidNC API Used

| Action | API Call |
|--------|----------|
| Ping/check | GET / |
| Run pattern | GET /command?cmd=[ESP220]/file.gcode |
| Pause | GET /command?cmd=! |
| Resume | GET /command?cmd=~ |
| Stop | GET /command?cmd=\x18 |
| Upload file | POST /upload |
| LED color | GET /command?cmd=M150 R G B |
| Speed | GET /command?cmd=F{value} |
| Home | GET /command?cmd=$H |
| Status | WebSocket ws://ip:81/ |

---

## Build for Play Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview

# Build for Play Store
eas build --platform android --profile production
```

---

## Made in Pakistan 🇵🇰
SandTable — Bringing kinetic art to life
