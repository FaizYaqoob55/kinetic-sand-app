// src/screens/LEDControlScreen.js — Lights (reference design match)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, PanResponder, Animated, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import FluidNCService from '../services/FluidNCService';
import { setLEDColor, setLEDBrightness, setLEDEffect } from '../store/tableSlice';
import HapticService from '../services/HapticService';
import ColorWheelPicker from '../components/ColorWheelPicker';
import Storage from '../utils/storage';

const { width } = Dimensions.get('window');
const CONTENT_W = Platform.OS === 'web' ? Math.min(width, 460) : width;
const H_PAD = 20;
const GOLD = '#D4A373';
const BG = '#000000';
const CARD = '#141414';
const CARD_BORDER = '#242424';

const SWATCHES = ['#F5E6C8', '#FF8C00', '#FFD700', '#2ECC71', '#00BCD4', '#3B5BDB', '#E91E8C'];

const EFFECTS = [
  { id: 'solid', name: 'Steady', icon: 'sparkles', iconOff: 'sparkles-outline' },
  { id: 'breathing', name: 'Breathing', icon: 'water-outline', iconOff: 'water-outline' },
  { id: 'pulse', name: 'Pulse', icon: 'pulse', iconOff: 'pulse-outline' },
  { id: 'wave', name: 'Wave', icon: 'analytics-outline', iconOff: 'analytics-outline' },
  { id: 'rainbow', name: 'Rainbow', icon: 'color-filter-outline', iconOff: 'color-filter-outline' },
  { id: 'flow', name: 'Flow', icon: 'reorder-two-outline', iconOff: 'reorder-two-outline' },
];

const SCENES = [
  { id: 'warm', name: 'Warm Relax', icon: 'flame', color: '#FF8C00', r: 255, g: 140, b: 0 },
  { id: 'focus', name: 'Focus', icon: 'radio-button-on-outline', color: '#00BCD4', r: 0, g: 188, b: 212 },
  { id: 'energize', name: 'Energize', icon: 'flash', color: '#2ECC71', r: 46, g: 204, b: 113 },
  { id: 'sleep', name: 'Sleep', icon: 'moon', color: '#9B59B6', r: 126, g: 87, b: 194 },
  { id: 'romance', name: 'Romance', icon: 'heart', color: '#E91E63', r: 233, g: 30, b: 140 },
];

const HW_EFFECT = { solid: 'solid', breathing: 'pulse', pulse: 'pulse', wave: 'cycle', rainbow: 'rainbow', flow: 'cycle' };
const SLEEP_LABELS = { 0: 'Off', 15: '15 min', 30: '30 min', 45: '45 min', 60: '1 hour', 120: '2 hours', 240: '4 hours' };

const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const BrightnessSlider = ({ value, onRelease }) => {
  const trackW = useRef(CONTENT_W - H_PAD * 2 - 96);
  const thumbX = useRef(new Animated.Value((value / 255) * trackW.current)).current;
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
    thumbX.setValue((value / 255) * trackW.current);
  }, [value, thumbX]);

  const update = (x) => {
    const c = Math.max(0, Math.min(trackW.current, x));
    thumbX.setValue(c);
    setLocal(Math.round((c / trackW.current) * 255));
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
    onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    onPanResponderRelease: () => { HapticService.light(); onRelease(local); },
  })).current;

  return (
    <View style={sl.row}>
      <Ionicons name="sunny-outline" size={16} color="#555" />
      <View
        style={sl.trackWrap}
        onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
        {...pan.panHandlers}
      >
        <View style={sl.trackBg} />
        <Animated.View style={[sl.trackFill, { width: thumbX }]}>
          <LinearGradient
            colors={['#2A1A08', '#8A6030', GOLD]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>
        <Animated.View style={[sl.thumb, { left: thumbX }]} />
      </View>
      <Ionicons name="sunny" size={18} color="#AAA" />
      <Text style={sl.pct}>{Math.round((local / 255) * 100)}%</Text>
    </View>
  );
};

export default function LEDControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { ledColor, ledBrightness, ledEffect, isConnected, tableName, sleepTimer } = useSelector((s) => s.table);

  const [brightness, setBrightness] = useState(ledBrightness ?? 255);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [pickingColor, setPickingColor] = useState(null);
  const [autoOffLabel, setAutoOffLabel] = useState('Off');

  const displayColor = pickingColor ?? ledColor;
  const displayHex = rgbToHex(displayColor.r, displayColor.g, displayColor.b);
  const isPresetSelected = SWATCHES.some((hex) => hex.toUpperCase() === displayHex);
  const showCustomSwatch = !!pickingColor || (!isPresetSelected && ledEffect !== 'rainbow');

  useEffect(() => {
    setAutoOffLabel(SLEEP_LABELS[sleepTimer] ?? (sleepTimer ? `${sleepTimer} min` : 'Off'));
  }, [sleepTimer]);

  useEffect(() => {
    const loadSleep = async () => {
      try {
        const schedule = await Storage.get('schedule');
        if (schedule?.selectedSleep !== undefined && sleepTimer == null) {
          setAutoOffLabel(SLEEP_LABELS[schedule.selectedSleep] ?? 'Off');
        }
      } catch {}
    };
    loadSleep();
  }, [sleepTimer]);

  const applyColor = (hex) => {
    HapticService.light();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    dispatch(setLEDColor({ r, g, b }));
    dispatch(setLEDEffect('solid'));
    setPickingColor(null);
    if (isConnected) try { FluidNCService.setLEDColor(r, g, b); } catch {}
  };

  const applyBrightness = (val) => {
    setBrightness(val);
    dispatch(setLEDBrightness(val));
    if (isConnected) try { FluidNCService.setLEDBrightness(val); } catch {}
  };

  const applyEffect = (id) => {
    HapticService.light();
    dispatch(setLEDEffect(id));
    if (isConnected) try { FluidNCService.setLEDEffect(HW_EFFECT[id] || 'solid'); } catch {}
  };

  const applyScene = (scene) => {
    HapticService.light();
    dispatch(setLEDColor({ r: scene.r, g: scene.g, b: scene.b }));
    dispatch(setLEDEffect('solid'));
    setPickingColor(null);
    if (isConnected) try { FluidNCService.setLEDColor(scene.r, scene.g, scene.b); } catch {}
  };

  const applyCustomColor = ({ r, g, b }) => {
    dispatch(setLEDColor({ r, g, b }));
    dispatch(setLEDEffect('solid'));
    setPickingColor(null);
    if (isConnected) try { FluidNCService.setLEDColor(r, g, b); } catch {}
  };

  const closeColorWheel = () => {
    setShowColorWheel(false);
    setPickingColor(null);
  };

  const activeSceneId = SCENES.find(
    (sc) => sc.r === ledColor.r && sc.g === ledColor.g && sc.b === ledColor.b && ledEffect === 'solid',
  )?.id;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
      >
        <View style={s.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => { HapticService.light(); navigation.goBack(); }}
            >
              <Ionicons name="chevron-back" size={22} color="#CCC" />
            </TouchableOpacity>
          )}
          <View style={s.headerText}>
            <Text style={s.title}>Lights</Text>
            <Text style={s.subtitle}>Customize your ambiance</Text>
          </View>
          {!navigation.canGoBack() ? (
            <TouchableOpacity style={s.gearBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={18} color="#CCC" />
            </TouchableOpacity>
          ) : (
            <View style={s.headerSpacer} />
          )}
        </View>

        <View style={s.heroWrap}>
          <Image
            source={require('../assets/lights-hero.png')}
            style={s.heroImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', '#000']}
            style={s.heroFade}
            pointerEvents="none"
          />
        </View>

        <View style={s.deviceCard}>
          <View style={s.deviceInfo}>
            <View style={s.deviceTopRow}>
              <Text style={s.deviceName}>{tableName || 'Oasis Mini'}</Text>
              <View style={s.battery}>
                <Ionicons name="battery-half" size={18} color="#2ECC71" />
                <Text style={s.batteryTxt}>80%</Text>
              </View>
            </View>

            <View style={s.connRow}>
              <View style={[s.connDot, !isConnected && s.connDotOff]} />
              <Text style={[s.connTxt, !isConnected && s.connTxtOff]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>

            <TouchableOpacity style={s.devBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.85}>
              <Text style={s.devBtnTxt}>Device Settings</Text>
              <Ionicons name="chevron-forward" size={14} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionLabel}>Color</Text>
        <View style={s.swatchRow}>
          {SWATCHES.map((hex) => (
            <TouchableOpacity
              key={hex}
              onPress={() => applyColor(hex)}
              style={[s.swatch, { backgroundColor: hex }, !showCustomSwatch && displayHex === hex.toUpperCase() && s.swatchOn]}
            />
          ))}
          <TouchableOpacity
            style={[s.swatch, s.swatchRainbow, showCustomSwatch && s.swatchOn]}
            onPress={() => { HapticService.light(); setShowColorWheel(true); }}
          >
            {showCustomSwatch ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: displayHex }]} />
            ) : (
              <LinearGradient
                colors={['#FF0000', '#FF8C00', '#FFD700', '#2ECC71', '#00BCD4', '#7E57C2', '#E91E8C']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
          </TouchableOpacity>
        </View>

        <BrightnessSlider value={brightness} onRelease={applyBrightness} />

        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>Effects</Text>
          <Text style={s.link}>View All</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hRow}>
          {EFFECTS.map((fx) => {
            const on = ledEffect === fx.id;
            return (
              <TouchableOpacity key={fx.id} style={[s.effectCard, on && s.effectOn]} onPress={() => applyEffect(fx.id)}>
                <Ionicons name={on ? fx.icon : fx.iconOff} size={22} color={on ? GOLD : '#666'} />
                <Text style={[s.effectTxt, on && s.effectTxtOn]}>{fx.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>Quick Scenes</Text>
          <Text style={s.link}>Edit</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hRow}>
          {SCENES.map((sc) => {
            const on = activeSceneId === sc.id;
            return (
              <TouchableOpacity key={sc.id} style={[s.sceneCard, on && s.sceneOn]} onPress={() => applyScene(sc)}>
                <Ionicons name={sc.icon} size={28} color={sc.color} />
                <Text style={[s.sceneTxt, on && s.sceneTxtOn]}>{sc.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={s.autoOff} onPress={() => navigation.navigate('Schedule')} activeOpacity={0.85}>
          <Ionicons name="time-outline" size={26} color="#777" />
          <View style={s.autoOffMid}>
            <Text style={s.autoOffTitle}>Set Auto Off</Text>
            <Text style={s.autoOffVal}>{autoOffLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#444" />
        </TouchableOpacity>
      </ScrollView>

      <ColorWheelPicker
        visible={showColorWheel}
        initialRgb={ledColor}
        onClose={closeColorWheel}
        onApply={applyCustomColor}
        onColorChange={setPickingColor}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: H_PAD },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, gap: 8,
  },
  headerText: { flex: 1 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },
  headerSpacer: { width: 42 },
  title: { fontSize: 34, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#777777', fontWeight: '400' },
  gearBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#111111',
    borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },

  heroWrap: {
    width: '100%',
    aspectRatio: 842 / 288,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0A0A0A',
  },
  heroImg: { width: '100%', height: '100%' },
  heroFade: { ...StyleSheet.absoluteFillObject },

  deviceCard: {
    backgroundColor: CARD,
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: CARD_BORDER,
    marginBottom: 24,
  },
  deviceInfo: { flex: 1 },
  deviceTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  deviceName: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  connRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  connDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2ECC71', marginRight: 6 },
  connDotOff: { backgroundColor: '#E74C3C' },
  connTxt: { fontSize: 13, color: '#2ECC71', fontWeight: '500' },
  connTxtOff: { color: '#E74C3C' },
  devBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1C1C', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'stretch',
  },
  devBtnTxt: { fontSize: 13, color: '#DDDDDD', fontWeight: '500' },
  battery: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  batteryTxt: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginLeft: 3 },

  sectionLabel: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 26, marginBottom: 14,
  },
  link: { fontSize: 14, color: GOLD, fontWeight: '500' },

  swatchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, marginBottom: 18,
  },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchOn: {
    borderWidth: 2.5, borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOpacity: 0.45, shadowRadius: 6, elevation: 4,
  },
  swatchRainbow: { overflow: 'hidden' },

  hRow: { gap: 10, paddingRight: 4, marginBottom: 4 },

  effectCard: {
    width: 62, height: 84, backgroundColor: '#1A1A1A', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  effectOn: { borderColor: GOLD, borderWidth: 1.5, backgroundColor: '#1A1510' },
  effectTxt: { fontSize: 10, color: '#666666', fontWeight: '500' },
  effectTxtOn: { color: '#DDDDDD', fontWeight: '600' },

  sceneCard: {
    width: 76, height: 88, backgroundColor: '#1A1A1A', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2A2A2A',
  },
  sceneTxt: { fontSize: 10, color: '#999999', fontWeight: '500', textAlign: 'center' },
  sceneTxtOn: { color: GOLD, fontWeight: '700' },
  sceneOn: { borderColor: GOLD, borderWidth: 1.5, backgroundColor: '#1A1510' },

  autoOff: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD,
    borderRadius: 20, padding: 20, marginTop: 26, borderWidth: 1, borderColor: CARD_BORDER, gap: 14,
  },
  autoOffMid: { flex: 1 },
  autoOffTitle: { fontSize: 15, color: '#999999', fontWeight: '500' },
  autoOffVal: { fontSize: 15, color: GOLD, fontWeight: '600', marginTop: 2 },
});

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  trackWrap: { flex: 1, height: 6, borderRadius: 3, overflow: 'visible', position: 'relative' },
  trackBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1A1A1A', borderRadius: 3 },
  trackFill: { position: 'absolute', left: 0, top: 0, height: 6, borderRadius: 3, overflow: 'hidden' },
  thumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    top: -8, marginLeft: -11, borderWidth: 1, borderColor: '#E0E0E0', elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
  },
  pct: { fontSize: 14, color: '#CCCCCC', fontWeight: '600', width: 44, textAlign: 'right' },
});
