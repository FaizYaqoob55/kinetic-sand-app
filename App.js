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
import Storage, { STORAGE_KEYS } from './src/utils/storage';
import { setConnected } from './src/store/tableSlice';

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

