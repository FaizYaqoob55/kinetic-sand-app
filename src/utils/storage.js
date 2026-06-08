// src/utils/storage.js
// Centralized AsyncStorage helpers

import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async get(key, fallback = null) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val === null) return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  async multiGet(keys) {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result = {};
      pairs.forEach(([key, val]) => {
        try {
          result[key] = val !== null ? JSON.parse(val) : null;
        } catch {
          result[key] = val;
        }
      });
      return result;
    } catch {
      return {};
    }
  },
};

// ─── KEYS ────────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ONBOARDED:      'onboarded',
  TABLE_DATA:     'tableData',
  SETTINGS:       'appSettings',
  SCHEDULE:       'scheduleSettings',
  FAVORITES:      'patternFavorites',
};

export default Storage;
