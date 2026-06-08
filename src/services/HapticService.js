// src/services/HapticService.js
// Haptic feedback wrapper — respects user preference

import * as Haptics from 'expo-haptics';
import Storage, { STORAGE_KEYS } from '../utils/storage';

let hapticsEnabled = true;

// Load preference once on startup
Storage.get(STORAGE_KEYS.SETTINGS, {}).then(s => {
  hapticsEnabled = s?.haptics !== false; // default true
});

const HapticService = {
  setEnabled(val) {
    hapticsEnabled = val;
  },

  // Light tap — for selections, toggles
  light() {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium tap — for primary actions
  medium() {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy — for destructive / stop actions
  heavy() {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success notification
  success() {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Error notification
  error() {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Warning
  warning() {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
};

export default HapticService;
