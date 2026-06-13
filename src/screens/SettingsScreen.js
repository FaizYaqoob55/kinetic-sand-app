// src/screens/SettingsScreen.js — Settings (matches Timer/Lights design)
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { setDisconnected } from '../store/tableSlice';
import WebSocketService from '../services/WebSocketService';
import FluidNCService from '../services/FluidNCService';
import Storage, { STORAGE_KEYS } from '../utils/storage';
import HapticService from '../services/HapticService';

const AMBER = '#F0A030';
const GOLD = '#D4A373';
const BG = '#000000';
const CARD = '#0D0D0D';
const CARD_BORDER = '#1E1E1E';

const SettingRow = ({ icon, iconColor, title, subtitle, right, onPress, danger, isLast }) => (
  <TouchableOpacity
    style={[st.row, isLast && st.rowLast]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[st.rowIcon, { backgroundColor: `${iconColor || AMBER}18` }]}>
      <Ionicons name={icon} size={18} color={iconColor || AMBER} />
    </View>
    <View style={st.rowBody}>
      <Text style={[st.rowTitle, danger && { color: '#FF7B7B' }]}>{title}</Text>
      {subtitle ? <Text style={st.rowSub}>{subtitle}</Text> : null}
    </View>
    <View style={st.rowRight}>
      {right || (onPress && <Ionicons name="chevron-forward" size={16} color="#555" />)}
    </View>
  </TouchableOpacity>
);

const Section = ({ label, children }) => (
  <View style={st.section}>
    <Text style={st.sectionLabel}>{label}</Text>
    <View style={st.card}>{children}</View>
  </View>
);

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { isConnected, tableName, tableIP } = useSelector((s) => s.table);

  const [autoConnect, setAutoConnect] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [loading, setLoading] = useState(true);

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
      } catch {}
      finally { setLoading(false); }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (loading) return;
    const saveSettings = async () => {
      await Storage.set(STORAGE_KEYS.SETTINGS, { autoConnect, notifications, haptics });
      HapticService.setEnabled(haptics);
    };
    saveSettings();
  }, [autoConnect, notifications, haptics, loading]);

  const handleDisconnect = () => {
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

  if (loading) {
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.loadingTxt}>Loading...</Text>
      </View>
    );
  }

  const switchTrack = { false: '#2A2A2A', true: 'rgba(240,160,48,0.35)' };

  return (
    <View style={st.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
      >
        <View style={st.header}>
          <View>
            <Text style={st.title}>Settings</Text>
            <Text style={st.subtitle}>Manage your device & app</Text>
          </View>
          <TouchableOpacity style={st.gearBtn} onPress={() => navigation.navigate('Connect')}>
            <Ionicons name="wifi-outline" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={st.heroWrap}>
          <Image
            source={require('../assets/settings-hero.png')}
            style={st.heroImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', '#000']}
            style={st.heroFade}
            pointerEvents="none"
          />
        </View>

        <View style={st.statusCard}>
          <View style={st.statusTop}>
            <Text style={st.statusName}>{tableName || 'Oasis Mini'}</Text>
            {isConnected && (
              <TouchableOpacity style={st.homeBtn} onPress={handleHome}>
                <Ionicons name="home-outline" size={18} color={AMBER} />
              </TouchableOpacity>
            )}
          </View>
          <View style={st.statusRow}>
            <View style={[st.statusDot, !isConnected && st.statusDotOff]} />
            <Text style={[st.statusTxt, !isConnected && st.statusTxtOff]}>
              {isConnected ? `Connected · ${tableIP || 'Local'}` : 'Not connected'}
            </Text>
          </View>
          {!isConnected && (
            <TouchableOpacity
              style={st.connectBtn}
              onPress={() => { HapticService.light(); navigation.navigate('Connect'); }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#FFB84D', AMBER, '#C07A20']} style={st.connectGrad}>
                <Ionicons name="wifi" size={16} color="#1A1208" />
                <Text style={st.connectTxt}>Connect Table</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <Section label="Connection">
          <SettingRow
            icon="scan-outline"
            iconColor={AMBER}
            title={isConnected ? 'Reconnect' : 'Connect Table'}
            subtitle="Scan or enter IP address"
            onPress={() => { HapticService.light(); navigation.navigate('Connect'); }}
          />
          <SettingRow
            icon="refresh-outline"
            iconColor={GOLD}
            title="Auto Connect"
            subtitle="Connect automatically on app open"
            right={
              <Switch
                value={autoConnect}
                onValueChange={(v) => { HapticService.medium(); setAutoConnect(v); }}
                trackColor={switchTrack}
                thumbColor={autoConnect ? AMBER : '#666'}
              />
            }
            isLast={!isConnected}
          />
          {isConnected && (
            <SettingRow
              icon="log-out-outline"
              iconColor="#FF7B7B"
              title="Disconnect"
              subtitle={`Disconnect from ${tableName || 'table'}`}
              onPress={handleDisconnect}
              danger
              isLast
            />
          )}
        </Section>

        {isConnected && (
          <Section label="Table Control">
            <SettingRow
              icon="home-outline"
              iconColor={AMBER}
              title="Home Table"
              subtitle="Return ball to center position"
              onPress={handleHome}
            />
            <SettingRow
              icon="time-outline"
              iconColor={GOLD}
              title="Timer"
              subtitle="Set auto-off schedule"
              onPress={() => { HapticService.light(); navigation.navigate('Schedule'); }}
            />
            <SettingRow
              icon="sunny-outline"
              iconColor="#FFB84D"
              title="Lights"
              subtitle="Adjust lighting & effects"
              onPress={() => { HapticService.light(); navigation.navigate('LEDControl'); }}
              isLast
            />
          </Section>
        )}

        <Section label="App">
          <SettingRow
            icon="notifications-outline"
            iconColor="#FFA726"
            title="Notifications"
            subtitle="Pattern complete alerts"
            right={
              <Switch
                value={notifications}
                onValueChange={(v) => { HapticService.medium(); setNotifications(v); }}
                trackColor={switchTrack}
                thumbColor={notifications ? AMBER : '#666'}
              />
            }
          />
          <SettingRow
            icon="phone-portrait-outline"
            iconColor={GOLD}
            title="Haptic Feedback"
            subtitle="Vibration on actions"
            right={
              <Switch
                value={haptics}
                onValueChange={(v) => { HapticService.medium(); setHaptics(v); }}
                trackColor={switchTrack}
                thumbColor={haptics ? AMBER : '#666'}
              />
            }
            isLast
          />
        </Section>

        <Section label="About">
          <SettingRow
            icon="information-circle-outline"
            iconColor={GOLD}
            title="App Version"
            subtitle="SandTable v1.0.0"
          />
          <SettingRow
            icon="star-outline"
            iconColor={AMBER}
            title="Rate the App"
            subtitle="Love it? Give us 5 stars!"
            onPress={() => { HapticService.light(); Alert.alert('Thank You', 'Opening App Store...'); }}
          />
          <SettingRow
            icon="mail-outline"
            iconColor="#2ECC71"
            title="Contact Support"
            subtitle="support@sandtable.pk"
            onPress={() => { HapticService.light(); Alert.alert('Support', 'Email: support@sandtable.pk'); }}
            isLast
          />
        </Section>

        <View style={st.footer}>
          <Text style={st.footerTxt}>SandTable</Text>
          <Text style={st.footerSub}>Bringing kinetic art to life</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: '#666', fontSize: 14 },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  title: { fontSize: 34, fontWeight: '700', color: '#FFF', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#777' },
  gearBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },

  heroWrap: {
    width: '100%', aspectRatio: 842 / 288,
    borderRadius: 18, overflow: 'hidden', marginBottom: 14, backgroundColor: '#0A0A0A',
  },
  heroImg: { width: '100%', height: '100%' },
  heroFade: { ...StyleSheet.absoluteFillObject },

  statusCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 24,
  },
  statusTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  statusName: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  homeBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(240,160,48,0.1)',
    borderWidth: 1, borderColor: 'rgba(240,160,48,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2ECC71', marginRight: 8 },
  statusDotOff: { backgroundColor: '#E74C3C' },
  statusTxt: { fontSize: 13, color: '#2ECC71', fontWeight: '500' },
  statusTxtOff: { color: '#E74C3C' },
  connectBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  connectGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  connectTxt: { fontSize: 15, fontWeight: '700', color: '#1A1208' },

  section: { marginBottom: 22 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 10 },
  card: {
    backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: CARD_BORDER, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#EEE' },
  rowSub: { fontSize: 12, color: '#555', marginTop: 2 },
  rowRight: {},

  footer: { alignItems: 'center', paddingVertical: 20 },
  footerTxt: { fontSize: 14, color: '#444', fontWeight: '600' },
  footerSub: { fontSize: 12, color: '#333', marginTop: 4 },
});
