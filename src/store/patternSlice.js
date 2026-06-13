// src/store/patternSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { PATTERNS } from '../constants/patterns';

const patternSlice = createSlice({
  name: 'pattern',
  initialState: {
    patterns: PATTERNS,
    favorites: [],
    downloaded: [],
    searchQuery: '',
    selectedCategory: 'featured',
    sortBy: 'name',
    // Remote repo sync
    remoteVersion: null,
    remoteUpdatedAt: null,
    newCount: 0,
    syncStatus: 'idle', // idle | loading | ready | error
    syncError: null,
    lastSyncAt: null,
    useRemote: false,
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const id = action.payload;
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter((f) => f !== id);
      } else {
        state.favorites.push(id);
      }
      const pattern = state.patterns.find((p) => p.id === id);
      if (pattern) pattern.isFavorite = !pattern.isFavorite;
    },
    addDownloaded: (state, action) => {
      if (!state.downloaded.includes(action.payload)) {
        state.downloaded.push(action.payload);
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSyncLoading: (state) => {
      state.syncStatus = 'loading';
      state.syncError = null;
    },
    setRemotePatterns: (state, action) => {
      const { patterns, version, updatedAt, newCount, lastSyncAt } = action.payload;
      state.patterns = patterns;
      state.useRemote = true;
      state.remoteVersion = version;
      state.remoteUpdatedAt = updatedAt;
      state.newCount = newCount ?? 0;
      state.lastSyncAt = lastSyncAt;
      state.syncStatus = 'ready';
      state.syncError = null;
    },
    setSyncError: (state, action) => {
      state.syncStatus = 'error';
      state.syncError = action.payload;
    },
    clearNewCount: (state) => {
      state.newCount = 0;
      state.patterns = state.patterns.map((p) => ({ ...p, isNew: false }));
    },
  },
});

export const {
  toggleFavorite,
  addDownloaded,
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  setSyncLoading,
  setRemotePatterns,
  setSyncError,
  clearNewCount,
} = patternSlice.actions;

export default patternSlice.reducer;
