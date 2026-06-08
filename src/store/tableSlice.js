// src/store/tableSlice.js
import { createSlice } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'table',
  initialState: {
    // Connection
    isConnected: false,
    tableIP: null,
    tableName: 'My SandTable',
    tableId: null,

    // Playback
    isPlaying: false,
    isPaused: false,
    currentPattern: null,
    progress: 0,
    timeRemaining: 0,
    timeElapsed: 0,

    // LED
    ledColor: { r: 255, g: 200, b: 100 },
    ledBrightness: 200,
    ledEffect: 'solid',
    ledEnabled: true,

    // Speed
    speed: 50, // 0-100%

    // Schedule
    sleepTimer: null,
    wakeTime: null,

    // Status
    status: 'Idle', // Idle, Run, Hold, Alarm
    machinePosition: { x: 0, y: 0 },

    // Playlist
    playlist: [],
    currentPlaylistIndex: 0,
    isPlaylistMode: false,
    repeatPlaylist: false,
    shufflePlaylist: false,
  },

  reducers: {
    // Connection
    setConnected: (state, action) => {
      state.isConnected = action.payload.connected;
      state.tableIP = action.payload.ip;
      state.tableId = action.payload.id;
      state.tableName = action.payload.name || 'My SandTable';
    },
    setDisconnected: (state) => {
      state.isConnected = false;
      state.tableIP = null;
      state.isPlaying = false;
      state.isPaused = false;
      state.progress = 0;
    },

    // Playback
    setPlaying: (state, action) => {
      state.isPlaying = true;
      state.isPaused = false;
      state.currentPattern = action.payload;
      state.progress = 0;
      state.timeElapsed = 0;
    },
    setPaused: (state) => {
      state.isPaused = true;
      state.isPlaying = false;
    },
    setResumed: (state) => {
      state.isPaused = false;
      state.isPlaying = true;
    },
    setStopped: (state) => {
      state.isPlaying = false;
      state.isPaused = false;
      state.currentPattern = null;
      state.progress = 0;
      state.timeElapsed = 0;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setTimeElapsed: (state, action) => {
      state.timeElapsed = action.payload;
      if (state.currentPattern) {
        state.timeRemaining = (state.currentPattern.duration * 60) - action.payload;
      }
    },

    // LED
    setLEDColor: (state, action) => {
      state.ledColor = action.payload;
    },
    setLEDBrightness: (state, action) => {
      state.ledBrightness = action.payload;
    },
    setLEDEffect: (state, action) => {
      state.ledEffect = action.payload;
    },
    toggleLED: (state) => {
      state.ledEnabled = !state.ledEnabled;
    },

    // Speed
    setSpeed: (state, action) => {
      state.speed = action.payload;
    },

    // Status
    setStatus: (state, action) => {
      state.status = action.payload.state;
      if (action.payload.position) {
        state.machinePosition = action.payload.position;
      }
    },

    // Schedule
    setSleepTimer: (state, action) => {
      state.sleepTimer = action.payload;
    },
    setWakeTime: (state, action) => {
      state.wakeTime = action.payload;
    },

    // Playlist
    setPlaylist: (state, action) => {
      state.playlist = action.payload;
      state.currentPlaylistIndex = 0;
      state.isPlaylistMode = true;
    },
    clearPlaylist: (state) => {
      state.playlist = [];
      state.currentPlaylistIndex = 0;
      state.isPlaylistMode = false;
    },
    addToPlaylist: (state, action) => {
      state.playlist.push(action.payload);
    },
    removeFromPlaylist: (state, action) => {
      state.playlist = state.playlist.filter((_, i) => i !== action.payload);
    },
    setPlaylistIndex: (state, action) => {
      state.currentPlaylistIndex = action.payload;
    },
    nextInPlaylist: (state) => {
      if (state.shufflePlaylist) {
        state.currentPlaylistIndex = Math.floor(Math.random() * state.playlist.length);
      } else if (state.currentPlaylistIndex < state.playlist.length - 1) {
        state.currentPlaylistIndex++;
      } else if (state.repeatPlaylist) {
        state.currentPlaylistIndex = 0;
      }
    },
    toggleRepeat: (state) => {
      state.repeatPlaylist = !state.repeatPlaylist;
    },
    toggleShuffle: (state) => {
      state.shufflePlaylist = !state.shufflePlaylist;
    },
    reorderPlaylist: (state, action) => {
      state.playlist = action.payload;
    },
  },
});

export const {
  setConnected, setDisconnected,
  setPlaying, setPaused, setResumed, setStopped,
  setProgress, setTimeElapsed,
  setLEDColor, setLEDBrightness, setLEDEffect, toggleLED,
  setSpeed, setStatus,
  setSleepTimer, setWakeTime,
  setPlaylist, clearPlaylist, addToPlaylist, removeFromPlaylist,
  setPlaylistIndex, nextInPlaylist, toggleRepeat, toggleShuffle, reorderPlaylist,
} = tableSlice.actions;

export default tableSlice.reducer;
