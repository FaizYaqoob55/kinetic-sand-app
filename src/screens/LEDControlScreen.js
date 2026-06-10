// src/screens/LEDControlScreen.js — Pixel-perfect reference match
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, PanResponder, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import { setLEDColor, setLEDBrightness, setLEDEffect, toggleLED } from '../store/tableSlice';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CONTENT_W = isWeb ? Math.min(width, 460) : width;
const SLIDER_W = CONTENT_W - 88; // full card width minus padding

// ── DATA ────────────────────────────────────────────────────────────────────
const SWATCHES = [
  '#F5E6C8', // warm white/cream
  '#FF8C00', // orange
  '#FFD700', // yellow
  '#2ECC71', // green
  '#00BCD4', // cyan
  '#7E57C2', // purple
  '#E91E8C', // pink
  // rainbow handled separately
];

const EFFECTS = [
  { id: 'solid',     name: 'Steady',    icon: 'sparkles-outline' },
  { id: 'breathing', name: 'Breathing', icon: 'reorder-three-outline' },
  { id: 'pulse',     name: 'Pulse',     icon: 'pulse-outline' },
  { id: 'wave',      name: 'Wave',      icon: 'analytics-outline' },
  { id: 'rainbow',   name: 'Rainbow',   icon: 'color-filter-outline' },
  { id: 'flow',      name: 'Flow',      icon: 'reorder-two-outline' },
];

const SCENES = [
  { id: 'warm',     name: 'Warm Relax', icon: 'flame',      iconColor: '#FF8C00', r: 255, g: 140, b: 0   },
  { id: 'focus',    name: 'Focus',      icon: 'radio-button-on', iconColor: '#00BCD4', r: 0,   g: 188, b: 212 },
  { id: 'energize', name: 'Energize',   icon: 'flash',      iconColor: '#2ECC71', r: 46,  g: 204, b: 113 },
  { id: 'sleep',    name: 'Sleep',      icon: 'moon-outline', iconColor: '#9B59B6', r: 126, g: 87,  b: 194 },
  { id: 'romance',  name: 'Romance',    icon: 'heart-outline', iconColor: '#E91E63', r: 233, g: 30,  b: 140 },
];

// ── BRIGHTNESS SLIDER ────────────────────────────────────────────────────────
const BrightnessSlider = ({ value, onRelease }) => {
  const anim = useRef(new Animated.Value((value / 255) * (CONTENT_W - 88))).current;
  const [local, setLocal] = useState(value);
  const SW = CONTENT_W - 88;

  useEffect(() => {
    setLocal(value);
    Animated.timing(anim, {
      toValue: (value / 255) * SW,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const x = Math.max(0, Math.min(SW, gs.moveX - 44));
      anim.setValue(x);
      setLocal(Math.round((x / SW) * 255));
    },
    onPanResponderRelease: () => { HapticService.light(); onRelease(local); },
  });

  const pct = Math.round((local / 255) * 100);

  return (
    <View style={sl.row}>
      <Ionicons name="sunny-outline" size={15} color="#666" />
      <View style={sl.trackWrap} {...pan.panHandlers}>
        <LinearGradient
          colors={['#1A1A1A', '#D4AA70']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Animated.View style={[sl.thumb, { left: anim }]} />
      </View>
      <Ionicons name="sunny" size={18} color="#AAAAAA" />
      <Text style={sl.pct}>{pct}%</Text>
    </View>
  );
};

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function LEDControlScreen({ navigation }) {
  const dispatch = useDispatch();
  const { ledColor, ledBrightness, ledEffect, ledEnabled } = useSelector(s => s.table);

  const [brightness, setBrightness] = useState(ledBrightness ?? 200);
  const [activeTab, setActiveTab] = useState('ambient');

  const hexStr = `#${ledColor.r.toString(16).padStart(2,'0')}${ledColor.g.toString(16).padStart(2,'0')}${ledColor.b.toString(16).padStart(2,'0')}`.toUpperCase();

  const applyColorHex = (hex) => {
    HapticService.light();
    const nr = parseInt(hex.slice(1, 3), 16);
    const ng = parseInt(hex.slice(3, 5), 16);
    const nb = parseInt(hex.slice(5, 7), 16);
    dispatch(setLEDColor({ r: nr, g: ng, b: nb }));
    try { FluidNCService.setLEDColor(nr, ng, nb); } catch {}
  };

  const applyBrightness = (val) => {
    setBrightness(val);
    dispatch(setLEDBrightness(val));
    try { FluidNCService.setLEDBrightness(val); } catch {}
  };

  const applyEffect = (eid) => {
    HapticService.light();
    dispatch(setLEDEffect(eid));
    try { FluidNCService.setLEDEffect(eid); } catch {}
  };

  const applyScene = (scene) => {
    HapticService.light();
    dispatch(setLEDColor({ r: scene.r, g: scene.g, b: scene.b }));
    try { FluidNCService.setLEDColor(scene.r, scene.g, scene.b); } catch {}
  };

  const TABS = [
    { id: 'ambient',  label: 'Ambient',  icon: 'sunny' },
    { id: 'effects',  label: 'Effects',  icon: 'sparkles-outline' },
    { id: 'scenes',   label: 'Scenes',   icon: 'image-outline' },
    { id: 'sync',     label: 'Sync',     icon: 'musical-notes-outline' },
  ];

  return (
    <View style={s.root}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={['#1C160E', '#0C0C0C', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Lights</Text>
            <Text style={s.subtitle}>Customize your ambiance</Text>
          </View>
          <TouchableOpacity style={s.gearBtn}>
            <Ionicons name="settings-outline" size={18} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* ── DEVICE CARD ── */}
        <View style={s.deviceCard}>
          {/* Left: device image simulation */}
          <View style={s.deviceImgWrap}>
            <LinearGradient
              colors={['#3A2800', '#1A1400']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            {/* Glow ring */}
            <View style={s.deviceGlowRing} />
            <Ionicons name="disc" size={32} color="#D4AA70" />
          </View>

          {/* Right: info */}
          <View style={s.deviceInfo}>
            <Text style={s.deviceName}>Oasis Mini</Text>
            <View style={s.connectedRow}>
              <View style={s.greenDot} />
              <Text style={s.connectedTxt}>Connected</Text>
            </View>
            <TouchableOpacity style={s.devSettingsBtn}>
              <Text style={s.devSettingsTxt}>Device Settings</Text>
              <Ionicons name="chevron-forward" size={13} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          {/* Battery */}
          <View style={s.batteryWrap}>
            <Ionicons name="battery-half" size={18} color="#2ECC71" />
            <Text style={s.batteryTxt}> 80%</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabsRow}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => { HapticService.light(); setActiveTab(tab.id); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#0A0A0A' : '#777777'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.tabTxt, isActive && s.tabTxtActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── COLOR SECTION ── */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Color</Text>

          {/* Swatches row */}
          <View style={s.swatchRow}>
            {SWATCHES.map((hex, i) => {
              const isActive = hexStr === hex;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => applyColorHex(hex)}
                  style={[s.swatch, { backgroundColor: hex }, isActive && s.swatchActive]}
                />
              );
            })}
            {/* Rainbow circle */}
            <TouchableOpacity
              style={[s.swatch, s.swatchRainbow, ledEffect === 'rainbow' && s.swatchActive]}
              onPress={() => applyEffect('rainbow')}
            >
              <LinearGradient
                colors={['#FF0000', '#FF8C00', '#FFD700', '#2ECC71', '#00BCD4', '#7E57C2', '#E91E8C', '#FF0000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
            </TouchableOpacity>
          </View>

          {/* Brightness slider */}
          <BrightnessSlider value={brightness} onRelease={applyBrightness} />
        </View>

        {/* ── EFFECTS ── */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardLabel}>Effects</Text>
            <TouchableOpacity>
              <Text style={s.goldLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hScrollContent}
          >
            {EFFECTS.map(fx => {
              const isActive = ledEffect === fx.id;
              return (
                <TouchableOpacity
                  key={fx.id}
                  style={[s.effectCard, isActive && s.effectCardActive]}
                  onPress={() => applyEffect(fx.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={fx.icon}
                    size={22}
                    color={isActive ? '#D4AA70' : '#777777'}
                  />
                  <Text style={[s.effectName, isActive && s.effectNameActive]}>
                    {fx.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── QUICK SCENES ── */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardLabel}>Quick Scenes</Text>
            <TouchableOpacity>
              <Text style={s.goldLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hScrollContent}
          >
            {SCENES.map(scene => (
              <TouchableOpacity
                key={scene.id}
                style={s.sceneCard}
                onPress={() => applyScene(scene)}
                activeOpacity={0.8}
              >
                <Ionicons name={scene.icon} size={28} color={scene.iconColor} />
                <Text style={s.sceneName}>{scene.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── AUTO OFF ── */}
        <View style={s.autoOffCard}>
          <Ionicons name="time-outline" size={26} color="#888" />
          <View style={s.autoOffText}>
            <Text style={s.autoOffLabel}>Set Auto Off</Text>
            <Text style={s.autoOffVal}>Off</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  title:    { fontSize: 30, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  subtitle: { fontSize: 13, color: '#888888' },
  gearBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },

  // Device Card
  deviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#181818', borderRadius: 18,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  deviceImgWrap: {
    width: 70, height: 70, borderRadius: 35,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#D4AA70', shadowOpacity: 0.3, shadowRadius: 10,
    elevation: 6,
  },
  deviceGlowRing: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 2, borderColor: '#D4AA7040',
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 5 },
  connectedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2ECC71', marginRight: 6 },
  connectedTxt: { fontSize: 13, color: '#2ECC71', fontWeight: '500' },
  devSettingsBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2A2A2A', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
  },
  devSettingsTxt: { fontSize: 12, color: '#CCCCCC', marginRight: 3 },
  batteryWrap: { flexDirection: 'row', alignItems: 'center' },
  batteryTxt: { fontSize: 12, fontWeight: '600', color: '#CCCCCC' },

  // Tabs
  tabsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, gap: 6,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: '#D4AA70' },
  tabTxt: { fontSize: 13, color: '#777777', fontWeight: '500' },
  tabTxtActive: { color: '#0A0A0A', fontWeight: '700' },

  // Card (Color / Effects / Scenes sections)
  card: {
    backgroundColor: '#181818',
    borderRadius: 18, padding: 18,
    marginBottom: 18,
    borderWidth: 1, borderColor: '#242424',
  },
  cardLabel: {
    fontSize: 16, fontWeight: '600', color: '#FFFFFF',
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  goldLink: { fontSize: 14, color: '#D4AA70', fontWeight: '500' },

  // Color swatches
  swatchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 22,
  },
  swatch: {
    width: 34, height: 34, borderRadius: 17,
  },
  swatchActive: {
    borderWidth: 2.5, borderColor: '#FFFFFF',
    shadowColor: '#FFF', shadowOpacity: 0.4, shadowRadius: 4,
  },
  swatchRainbow: { overflow: 'hidden' },

  // Horizontal scroll
  hScrollContent: { gap: 8, paddingRight: 4 },

  // Effect cards — compact like reference, all 6 visible
  effectCard: {
    width: 60, height: 80,
    backgroundColor: '#222222', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E2E2E', gap: 8,
  },
  effectCardActive: {
    borderWidth: 1.5, borderColor: '#D4AA70',
    backgroundColor: '#1E1A12',
  },
  effectName: { fontSize: 10, color: '#777777', fontWeight: '500' },
  effectNameActive: { color: '#DDDDDD', fontWeight: '600' },

  // Scene cards — 5 visible, square with big colored icon
  sceneCard: {
    width: 74, height: 82,
    backgroundColor: '#222222', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E2E2E', gap: 8,
  },
  sceneName: { fontSize: 10, color: '#AAAAAA', fontWeight: '500' },

  // Auto Off
  autoOffCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#181818', borderRadius: 18,
    padding: 20, borderWidth: 1, borderColor: '#242424',
    gap: 14,
  },
  autoOffText: { flex: 1 },
  autoOffLabel: { fontSize: 14, color: '#AAAAAA', fontWeight: '500' },
  autoOffVal: { fontSize: 14, color: '#D4AA70', fontWeight: '600', marginTop: 2 },
});

// Brightness slider styles
const sl = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  trackWrap: {
    flex: 1, height: 6, borderRadius: 3,
    overflow: 'hidden', justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF',
    top: -7, marginLeft: -10,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4,
    borderWidth: 2, borderColor: '#000',
  },
  pct: { fontSize: 13, color: '#CCCCCC', fontWeight: '600', width: 42, textAlign: 'right' },
});
