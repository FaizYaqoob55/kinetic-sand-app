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
    sortBy: 'name', // name, duration, newest
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const id = action.payload;
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(f => f !== id);
      } else {
        state.favorites.push(id);
      }
      const pattern = state.patterns.find(p => p.id === id);
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
  },
});

export const {
  toggleFavorite, addDownloaded,
  setSearchQuery, setSelectedCategory, setSortBy,
} = patternSlice.actions;

export default patternSlice.reducer;
