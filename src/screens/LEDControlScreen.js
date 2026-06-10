// src/screens/LEDControlScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, PanResponder, Animated, Platform, Image
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
const SLIDER_W = CONTENT_W - 130;

// ── CONSTANTS ───────────────────────────────────────────────────────────────
const SWATCHES = [
  { id: 'white',   hex: '#FFF3E0' },
  { id: 'gold',    hex: '#FFB347' },
  { id: 'yellow',  hex: '#FFD54F' },
  { id: 'green',   hex: '#81C784' },
  { id: 'cyan',    hex: '#4DD0E1' },
  { id: 'purple',  hex: '#7E57C2' },
  { id: 'pink',    hex: '#F06292' },
];

const EFFECTS = [
  { id: 'solid',     name: 'Steady',    icon: 'sparkles' },
  { id: 'breathing', name: 'Breathing', icon: 'water-outline' },
  { id: 'pulse',     name: 'Pulse',     icon: 'pulse' },
  { id: 'wave',      name: 'Wave',      icon: 'analytics-outline' },
  { id: 'rainbow',   name: 'Rainbow',   icon: 'radio-outline' },
  { id: 'flow',      name: 'Flow',      icon: 'swap-horizontal-outline' },
];

const SCENES = [
  { id: 'warm',     name: 'Warm Relax', icon: 'bonfire',    color: '#FFB347' },
  { id: 'focus',    name: 'Focus',      icon: 'disc',       color: '#4DD0E1' },
  { id: 'energize', name: 'Energize',   icon: 'flash',      color: '#81C784' },
  { id: 'sleep',    name: 'Sleep',      icon: 'moon',       color: '#7E57C2' },
  { id: 'romance',  name: 'Romance',    icon: 'heart',      color: '#F06292' },
];

// ── CUSTOM SLIDER ────────────────────────────────────────────────────────
const BrightnessSlider = ({ value, onRelease }) => {
  const anim = useRef(new Animated.Value((value / 255) * SLIDER_W)).current;
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
    Animated.timing(anim, {
      toValue: (value / 255) * SLIDER_W,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const x = Math.max(0, Math.min(SLIDER_W, gs.moveX - 60));
      anim.setValue(x);
      setLocal(Math.round((x / SLIDER_W) * 255));
    },
    onPanResponderRelease: () => {
      HapticService.light();
      onRelease(local);
    },
  });

  return (
    <View style={s.sliderContainer}>
      <Ionicons name="sunny-outline" size={16} color="#555" />
      <View style={s.sliderTrackWrap}>
        <View style={s.sliderTrack} {...pan.panHandlers}>
          <LinearGradient
            colors={['#333', '#FFB347']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Animated.View style={[s.sliderThumb, { left: anim }]} />
        </View>
      </View>
      <Ionicons name="sunny" size={16} color="#A0A0A0" style={{ marginLeft: 8 }} />
      <Text style={s.sliderVal}>{Math.round((local / 255) * 100)}%</Text>
    </View>
  );
};

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function LEDControlScreen({ navigation }) {
  const dispatch = useDispatch();
  const { ledColor, ledBrightness, ledEffect, ledEnabled } = useSelector(s => s.table);

  const [brightness, setBrightness] = useState(ledBrightness);
  const [activeTab, setActiveTab] = useState('ambient');

  const hexStr = `#${ledColor.r.toString(16).padStart(2,'0')}${ledColor.g.toString(16).padStart(2,'0')}${ledColor.b.toString(16).padStart(2,'0')}`.toUpperCase();

  const applyColor = async (hex) => {
    HapticService.light();
    const nr = parseInt(hex.slice(1, 3), 16);
    const ng = parseInt(hex.slice(3, 5), 16);
    const nb = parseInt(hex.slice(5, 7), 16);
    dispatch(setLEDColor({ r: nr, g: ng, b: nb }));
    try { await FluidNCService.setLEDColor(nr, ng, nb); } catch {}
  };

  const applyBrightness = async (val) => {
    setBrightness(val);
    dispatch(setLEDBrightness(val));
    try { await FluidNCService.setLEDBrightness(val); } catch {}
  };

  const applyEffect = async (effectId) => {
    HapticService.light();
    dispatch(setLEDEffect(effectId));
    try { await FluidNCService.setLEDEffect(effectId); } catch {}
  };

  const applyScene = async (sceneHex) => {
    HapticService.light();
    applyColor(sceneHex);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0A0A0F', '#08080C']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Lights</Text>
            <Text style={s.subtitle}>Customize your ambiance</Text>
          </View>
          <TouchableOpacity style={s.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#D0D0D0" />
          </TouchableOpacity>
        </View>

        {/* ── DEVICE CARD ── */}
        <View style={s.deviceCard}>
          <View style={s.deviceInfo}>
            <View style={s.deviceImageHolder}>
              {/* Fallback to simple icon if image fails to load */}
              <Ionicons name="disc-outline" size={40} color={Colors.primary} />
            </View>
            <View style={s.deviceDetails}>
              <Text style={s.deviceName}>Oasis Mini</Text>
              <View style={s.statusRow}>
                <View style={s.statusDot} />
                <Text style={s.statusTxt}>Connected</Text>
              </View>
              <TouchableOpacity style={s.deviceSettingsBtn}>
                <Text style={s.deviceSettingsTxt}>Device Settings</Text>
                <Ionicons name="chevron-forward" size={14} color="#D0D0D0" />
              </TouchableOpacity>
            </View>
            <View style={s.batteryRow}>
              <Ionicons name="battery-half" size={20} color="#81C784" />
              <Text style={s.batteryTxt}>80%</Text>
            </View>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={s.tabsRow}>
          {['Ambient', 'Effects', 'Scenes', 'Sync'].map((tab) => {
            const isActive = activeTab === tab.toLowerCase();
            return (
              <TouchableOpacity 
                key={tab} 
                style={[s.tabPill, isActive && s.tabPillActive]}
                onPress={() => { HapticService.light(); setActiveTab(tab.toLowerCase()); }}
              >
                {isActive && <Ionicons name="sunny-outline" size={14} color="#000" style={{ marginRight: 4 }} />}
                {!isActive && tab === 'Effects' && <Ionicons name="sparkles-outline" size={14} color="#888" style={{ marginRight: 4 }} />}
                {!isActive && tab === 'Scenes' && <Ionicons name="image-outline" size={14} color="#888" style={{ marginRight: 4 }} />}
                {!isActive && tab === 'Sync' && <Ionicons name="musical-notes-outline" size={14} color="#888" style={{ marginRight: 4 }} />}
                <Text style={[s.tabTxt, isActive && s.tabTxtActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── COLOR PALETTE ── */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionTitle}>Color</Text>
          <View style={s.swatchRow}>
            {SWATCHES.map(swatch => {
              const isActive = hexStr === swatch.hex && ledEffect === 'solid';
              return (
                <TouchableOpacity
                  key={swatch.id}
                  style={[s.swatch, { backgroundColor: swatch.hex }, isActive && s.swatchActive]}
                  onPress={() => { applyColor(swatch.hex); applyEffect('solid'); }}
                />
              );
            })}
            {/* Rainbow Wheel Button */}
            <TouchableOpacity 
              style={[s.swatch, s.rainbowSwatch, ledEffect === 'rainbow' && s.swatchActive]}
              onPress={() => applyEffect('rainbow')}
            >
              <LinearGradient
                colors={['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff']}
                style={StyleSheet.absoluteFill}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              />
            </TouchableOpacity>
          </View>
          <BrightnessSlider value={brightness} onRelease={applyBrightness} />
        </View>

        {/* ── EFFECTS ── */}
        <View style={s.sectionBlock}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Effects</Text>
            <TouchableOpacity><Text style={s.viewAllTxt}>View All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {EFFECTS.map(effect => {
              const isActive = ledEffect === effect.id;
              return (
                <TouchableOpacity
                  key={effect.id}
                  style={[s.effectCard, isActive && s.effectCardActive]}
                  onPress={() => applyEffect(effect.id)}
                >
                  <Ionicons name={effect.icon} size={26} color={isActive ? Colors.primary : '#888'} style={{ marginBottom: 12 }} />
                  <Text style={[s.effectName, isActive && s.effectNameActive]}>{effect.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── QUICK SCENES ── */}
        <View style={s.sectionBlock}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Quick Scenes</Text>
            <TouchableOpacity><Text style={s.viewAllTxt}>Edit</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {SCENES.map(scene => (
              <TouchableOpacity
                key={scene.id}
                style={s.sceneCard}
                onPress={() => applyScene(scene.color)}
              >
                <Ionicons name={scene.icon} size={28} color={scene.color} style={{ marginBottom: 10 }} />
                <Text style={s.sceneName}>{scene.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── AUTO OFF ── */}
        <View style={s.autoOffCard}>
          <Ionicons name="time-outline" size={24} color="#888" style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.autoOffLabel}>Set Auto Off</Text>
            <Text style={s.autoOffValue}>Off</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#555" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { paddingTop: 60, paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#F0F0F0', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: '#222', backgroundColor: '#13131A',
    alignItems: 'center', justifyContent: 'center'
  },

  // Device Card
  deviceCard: {
    backgroundColor: '#161620',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#222',
    marginBottom: 24,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'flex-start' },
  deviceImageHolder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10,
  },
  deviceDetails: { flex: 1, justifyContent: 'center' },
  deviceName: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ED573', marginRight: 6 },
  statusTxt: { fontSize: 12, color: '#2ED573' },
  deviceSettingsBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#252530', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, alignSelf: 'flex-start',
  },
  deviceSettingsTxt: { fontSize: 11, color: '#D0D0D0', marginRight: 4 },
  batteryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  batteryTxt: { fontSize: 12, color: '#D0D0D0', marginLeft: 4, fontWeight: '600' },

  // Tabs
  tabsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#12121A', borderRadius: 16, padding: 6,
    marginBottom: 24,
  },
  tabPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12,
  },
  tabPillActive: { backgroundColor: '#CD9B55' },
  tabTxt: { fontSize: 12, color: '#888', fontWeight: '500' },
  tabTxtActive: { color: '#0A0A0F', fontWeight: '700' },

  // Sections
  sectionBlock: {
    backgroundColor: '#13131A', borderRadius: 20,
    padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: '#222',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F0F0F0', marginBottom: 16 },
  viewAllTxt: { fontSize: 12, color: '#CD9B55', fontWeight: '600' },

  // Color Swatches
  swatchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  swatch: {
    width: 32, height: 32, borderRadius: 16,
  },
  swatchActive: {
    borderWidth: 2, borderColor: '#FFF',
    transform: [{ scale: 1.15 }],
  },
  rainbowSwatch: {
    overflow: 'hidden',
  },

  // Custom Slider
  sliderContainer: {
    flexDirection: 'row', alignItems: 'center',
  },
  sliderTrackWrap: {
    flex: 1, marginHorizontal: 12, height: 16, justifyContent: 'center',
  },
  sliderTrack: {
    height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative',
    backgroundColor: '#333'
  },
  sliderThumb: {
    position: 'absolute', top: -5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFF',
  },
  sliderVal: { width: 40, fontSize: 13, color: '#D0D0D0', textAlign: 'right', fontWeight: '600' },

  // Horiz Scroll (Effects/Scenes)
  hScroll: { gap: 12 },

  // Effect Card
  effectCard: {
    width: 80, height: 90, borderRadius: 16,
    backgroundColor: '#1A1A24',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A34',
  },
  effectCardActive: {
    borderColor: '#CD9B55', backgroundColor: '#CD9B5511',
  },
  effectName: { fontSize: 11, color: '#A0A0A0', fontWeight: '500' },
  effectNameActive: { color: '#F0F0F0', fontWeight: '600' },

  // Scene Card
  sceneCard: {
    width: 85, height: 95, borderRadius: 16,
    backgroundColor: '#1A1A24',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A34',
  },
  sceneName: { fontSize: 11, color: '#D0D0D0', fontWeight: '500' },

  // Auto Off
  autoOffCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#13131A', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#222',
  },
  autoOffLabel: { fontSize: 14, color: '#A0A0A0', marginBottom: 2 },
  autoOffValue: { fontSize: 14, color: '#CD9B55', fontWeight: '600' },
});
