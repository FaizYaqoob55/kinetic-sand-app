// App.js — Main Entry Point
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import FluidNCService from './src/services/FluidNCService';
import WebSocketService from './src/services/WebSocketService';
import { BUNDLED_PATTERNS, BUNDLED_META } from './src/utils/patternManifest';
import PatternRemoteService from './src/services/PatternRemoteService';
import Storage, { STORAGE_KEYS } from './src/utils/storage';
import { setConnected } from './src/store/tableSlice';
import { setSyncLoading, setRemotePatterns, setSyncError } from './src/store/patternSlice';

// ── Sync patterns from GitHub repo ───────────────────────────────────────────
async function hydratePatterns() {
  const cached = await PatternRemoteService.getCachedManifest();
  if (cached?.patterns?.length) {
    store.dispatch(setRemotePatterns({
      patterns: cached.patterns,
      version: cached.version,
      updatedAt: cached.updatedAt,
      newCount: cached.newCount || 0,
      lastSyncAt: cached.lastSyncAt || Date.now(),
    }));
    return;
  }
  store.dispatch(setRemotePatterns({
    patterns: BUNDLED_PATTERNS,
    version: BUNDLED_META.version,
    updatedAt: BUNDLED_META.updatedAt,
    newCount: 0,
    lastSyncAt: null,
  }));
}

async function syncPatterns({ force = false } = {}) {
  try {
    store.dispatch(setSyncLoading());
    const result = await PatternRemoteService.sync({ force });
    if (result?.patterns?.length) {
      store.dispatch(setRemotePatterns({
        patterns: result.patterns,
        version: result.version,
        updatedAt: result.updatedAt,
        newCount: result.newCount,
        lastSyncAt: Date.now(),
      }));
      if (result.newCount > 0) {
        Toast.show({
          type: 'success',
          text1: `${result.newCount} new pattern${result.newCount > 1 ? 's' : ''}`,
          text2: 'Fresh designs from Zanvora Sand',
          visibilityTime: 3500,
        });
      }
    }
  } catch (err) {
    const cached = await PatternRemoteService.getCachedManifest();
    if (cached?.patterns?.length) {
      store.dispatch(setRemotePatterns({
        patterns: cached.patterns,
        version: cached.version,
        updatedAt: cached.updatedAt,
        newCount: 0,
        lastSyncAt: cached.lastSyncAt || Date.now(),
      }));
    } else {
      store.dispatch(setRemotePatterns({
        patterns: BUNDLED_PATTERNS,
        version: BUNDLED_META.version,
        updatedAt: BUNDLED_META.updatedAt,
        newCount: 0,
        lastSyncAt: null,
      }));
      store.dispatch(setSyncError(err?.message || 'Pattern sync failed'));
    }
  }
}

// ── Auto-connect on app start ─────────────────────────────────────────────────
async function tryAutoConnect() {
  try {
    const settings = await Storage.get(STORAGE_KEYS.SETTINGS, {});
    if (settings?.autoConnect === false) return; // user turned it off

    const tableData = await Storage.get(STORAGE_KEYS.TABLE_DATA, null);
    if (!tableData?.ip) return;

    FluidNCService.setIP(tableData.ip);
    const alive = await FluidNCService.ping();
    if (alive) {
      WebSocketService.connect(tableData.ip);
      store.dispatch(setConnected({
        connected: true,
        ip:        tableData.ip,
        name:      tableData.name || 'My SandTable',
        id:        tableData.id   || tableData.ip,
      }));
    }
  } catch {
    // Silent fail — ConnectScreen handles manual connect
  }
}

export default function App() {
  useEffect(() => {
    hydratePatterns().then(() => syncPatterns());
    tryAutoConnect();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#020204' }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#0A0A0F" />
          <View style={Platform.OS === 'web' ? styles.webWrapper : styles.mobileWrapper}>
            <AppNavigator />
          </View>
          <Toast />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: '#080808',
    // Elegant border shadow for the mobile card preview on web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mobileWrapper: {
    flex: 1,
  },
});

