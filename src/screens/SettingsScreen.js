// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import { setDisconnected } from '../store/tableSlice';
import WebSocketService from '../services/WebSocketService';
import FluidNCService from '../services/FluidNCService';
import Storage, { STORAGE_KEYS } from '../utils/storage';
import HapticService from '../services/HapticService';

const SettingRow = ({ icon, iconColor, title, subtitle, right, onPress, danger }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
    <View style={[styles.settingIcon, { backgroundColor: (iconColor || Colors.primary) + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor || Colors.primary} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingTitle, danger && { color: Colors.error }]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingRight}>
      {right || (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />)}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isConnected, tableName, tableIP } = useSelector(s => s.table);
  const [autoConnect, setAutoConnect] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await Storage.get(STORAGE_KEYS.SETTINGS);
        if (settings) {
          if (settings.autoConnect !== undefined) setAutoConnect(settings.autoConnect);
          if (settings.notifications !== undefined) setNotifications(settings.notifications);
          if (settings.haptics !== undefined) {
            setHaptics(settings.haptics);
            HapticService.setEnabled(settings.haptics);
          }
        }
      } catch (err) {
        console.log('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings when any of them change
  useEffect(() => {
    if (loading) return;
    const saveSettings = async () => {
      await Storage.set(STORAGE_KEYS.SETTINGS, { autoConnect, notifications, haptics });
      HapticService.setEnabled(haptics);
    };
    saveSettings();
  }, [autoConnect, notifications, haptics, loading]);

  const handleDisconnect = async () => {
    HapticService.heavy();
    Alert.alert('Disconnect Table', 'Disconnect from your SandTable?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          HapticService.heavy();
          WebSocketService.disconnect();
          FluidNCService.disconnect();
          dispatch(setDisconnected());
          await Storage.remove(STORAGE_KEYS.TABLE_DATA);
          navigation.replace('Connect');
        },
      },
    ]);
  };

  const handleHome = async () => {
    HapticService.light();
    try {
      await FluidNCService.home();
      Alert.alert('Homing', 'Table is returning to home position...');
    } catch {
      HapticService.error();
      Alert.alert('Error', 'Could not home table. Check connection.');
    }
  };

  const handleToggleAutoConnect = (val) => {
    HapticService.medium();
    setAutoConnect(val);
  };

  const handleToggleNotifications = (val) => {
    HapticService.medium();
    setNotifications(val);
  };

  const handleToggleHaptics = (val) => {
    HapticService.medium();
    setHaptics(val);
  };

  const handleRate = () => {
    HapticService.light();
    Alert.alert('Thank You! ⭐', 'Opening App Store...');
  };

  const handleSupport = () => {
    HapticService.light();
    Alert.alert('Support', 'Email: support@sandtable.pk');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Table Status */}
        <View style={styles.tableCard}>
          <LinearGradient
            colors={isConnected ? ['#0F1A0F', '#0A0A0F'] : ['#1A0A0A', '#0A0A0F']}
            style={styles.tableCardGrad}
          >
            <View style={styles.tableCardLeft}>
              <View style={[styles.tableIcon, {
                backgroundColor: isConnected ? Colors.success + '20' : Colors.error + '20'
              }]}>
                <Text style={{ fontSize: 28 }}>◉</Text>
              </View>
              <View>
                <Text style={styles.tableCardName}>{tableName}</Text>
                <Text style={[styles.tableCardStatus, {
                  color: isConnected ? Colors.success : Colors.error,
                }]}>
                  {isConnected ? `● Connected — ${tableIP}` : '○ Disconnected'}
                </Text>
              </View>
            </View>
            {isConnected && (
              <TouchableOpacity style={styles.homeBtn} onPress={handleHome}>
                <Ionicons name="home" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONNECTION</Text>
          <View style={styles.card}>
            <SettingRow
              icon="wifi"
              title={isConnected ? 'Reconnect' : 'Connect Table'}
              subtitle="Scan or enter IP"
              onPress={() => {
                HapticService.light();
                navigation.navigate('Connect');
              }}
            />
            <SettingRow
              icon="refresh"
              iconColor={Colors.accent}
              title="Auto Connect"
              subtitle="Connect automatically on app open"
              right={
                <Switch
                  value={autoConnect}
                  onValueChange={handleToggleAutoConnect}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
            {isConnected && (
              <SettingRow
                icon="log-out"
                iconColor={Colors.error}
                title="Disconnect"
                subtitle={`Disconnect from ${tableName}`}
                onPress={handleDisconnect}
                danger
              />
            )}
          </View>
        </View>

        {/* Table Controls */}
        {isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TABLE CONTROL</Text>
            <View style={styles.card}>
              <SettingRow
                icon="home"
                iconColor={Colors.accent}
                title="Home Table"
                subtitle="Return ball to center position"
                onPress={handleHome}
              />
              <SettingRow
                icon="alarm"
                iconColor={Colors.success}
                title="Schedule"
                subtitle="Set wake/sleep times"
                onPress={() => {
                  HapticService.light();
                  navigation.navigate('Schedule');
                }}
              />
              <SettingRow
                icon="color-palette"
                iconColor="#FF6B9D"
                title="LED Control"
                subtitle="Adjust lighting effects"
                onPress={() => {
                  HapticService.light();
                  navigation.navigate('LEDControl');
                }}
              />
            </View>
          </View>
        )}

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications"
              iconColor={Colors.warning}
              title="Notifications"
              subtitle="Pattern complete alerts"
              right={
                <Switch
                  value={notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
            <SettingRow
              icon="phone-portrait"
              iconColor={Colors.accent}
              title="Haptic Feedback"
              subtitle="Vibration on actions"
              right={
                <Switch
                  value={haptics}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                />
              }
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle"
              iconColor={Colors.accent}
              title="App Version"
              subtitle="SandTable v1.0.0"
            />
            <SettingRow
              icon="star"
              iconColor={Colors.primary}
              title="Rate the App"
              subtitle="Love it? Give us 5 stars!"
              onPress={handleRate}
            />
            <SettingRow
              icon="mail"
              iconColor={Colors.success}
              title="Contact Support"
              subtitle="Get help with your SandTable"
              onPress={handleSupport}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SandTable — Made in Pakistan 🇵🇰</Text>
          <Text style={styles.footerSub}>Bringing kinetic art to life</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: Colors.textSecondary, fontSize: 16 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },

  tableCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  tableCardGrad: { padding: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: 16 },
  tableCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  tableIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  tableCardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  tableCardStatus: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  homeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, color: Colors.textTertiary,
    fontWeight: '700', letterSpacing: 1,
    marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  settingRight: {},

  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 14, color: Colors.textTertiary, fontWeight: '500' },
  footerSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
});
