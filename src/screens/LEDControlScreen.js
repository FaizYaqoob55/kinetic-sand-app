import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, PanResponder, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import { setLEDColor, setLEDBrightness, setLEDEffect, toggleLED } from '../store/tableSlice';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const SLIDER_W = width - 88;

// ── PRESETS ─────────────────────────────────────────────────────────────────
const SCENES = [
  { id: 'warm',     name: 'Warm Sand',  colors: ['#FF8C00', '#FFB347'],       r: 255, g: 140, b: 0   },
  { id: 'ocean',    name: 'Ocean',      colors: ['#006994', '#00BFFF'],        r: 0,   g: 105, b: 148 },
  { id: 'forest',   name: 'Forest',     colors: ['#228B22', '#90EE90'],        r: 34,  g: 139, b: 34  },
  { id: 'sunset',   name: 'Sunset',     colors: ['#FF4500', '#FF8C00'],        r: 255, g: 69,  b: 0   },
  { id: 'lavender', name: 'Lavender',   colors: ['#9B59B6', '#D7BDE2'],        r: 155, g: 89,  b: 182 },
  { id: 'arctic',   name: 'Arctic',     colors: ['#87CEEB', '#E0F7FF'],        r: 135, g: 206, b: 235 },
  { id: 'rose',     name: 'Rose',       colors: ['#FF007F', '#FFB6C1'],        r: 255, g: 0,   b: 127 },
  { id: 'white',    name: 'Pure White', colors: ['#FFFFFF', '#F0F0F0'],        r: 255, g: 255, b: 255 },
  { id: 'gold',     name: 'Gold',       colors: ['#FFD700', '#FFA500'],        r: 255, g: 215, b: 0   },
  { id: 'teal',     name: 'Teal',       colors: ['#008080', '#00CED1'],        r: 0,   g: 128, b: 128 },
];

// ── EFFECTS ──────────────────────────────────────────────────────────────────
const EFFECTS = [
  { id: 'solid',     name: 'Solid',     icon: 'ellipse',              desc: 'Single steady color' },
  { id: 'pulse',     name: 'Pulse',     icon: 'radio-button-on',      desc: 'Gentle breathing glow' },
  { id: 'rainbow',   name: 'Rainbow',   icon: 'color-filter',         desc: 'Full spectrum cycle' },
  { id: 'chase',     name: 'Chase',     icon: 'arrow-forward-circle', desc: 'Running light effect' },
  { id: 'wave',      name: 'Wave',      icon: 'water',                desc: 'Smooth wave across LEDs' },
  { id: 'strobe',    name: 'Strobe',    icon: 'flash',                desc: 'Fast flicker effect' },
  { id: 'comet',     name: 'Comet',     icon: 'navigate',             desc: 'Trailing comet light' },
  { id: 'fire',      name: 'Fire',      icon: 'flame',                desc: 'Flickering fire effect' },
  { id: 'twinkle',   name: 'Twinkle',   icon: 'sparkles',             desc: 'Random twinkling stars' },
  { id: 'breathing', name: 'Breathing', icon: 'cellular',             desc: 'Slow meditative breath' },
];

// ── COLOR PALETTES ───────────────────────────────────────────────────────────
const PALETTE = [
  '#FF0000','#FF3D00','#FF6D00','#FF9100','#FFD600',
  '#AEEA00','#00E676','#00E5FF','#2979FF','#651FFF',
  '#D500F9','#FF1744','#FF6E40','#FFD740','#69F0AE',
  '#40C4FF','#7C4DFF','#E040FB','#FF80AB','#FFFFFF',
  '#BDBDBD','#757575','#424242','#FFF9C4','#B2EBF2',
];

// ── RGB SLIDER ───────────────────────────────────────────────────────────────
const RGBSlider = ({ label, value, gradColors, onRelease }) => {
  const sliderAnim = useRef(new Animated.Value((value / 255) * SLIDER_W)).current;
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
    Animated.timing(sliderAnim, {
      toValue: (value / 255) * SLIDER_W,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const x = Math.max(0, Math.min(SLIDER_W, gs.moveX - 44));
      sliderAnim.setValue(x);
      setLocal(Math.round((x / SLIDER_W) * 255));
    },
    onPanResponderRelease: () => {
      HapticService.light();
      onRelease(local);
    },
  });

  return (
    <View style={rgb.row}>
      <Text style={rgb.label}>{label}</Text>
      <View style={rgb.track} {...pan.panHandlers}>
        <LinearGradient
          colors={gradColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Animated.View style={[rgb.thumb, { left: sliderAnim }]} />
      </View>
      <Text style={rgb.val}>{local}</Text>
    </View>
  );
};

// ── BRIGHTNESS SLIDER ────────────────────────────────────────────────────────
const BrightnessSlider = ({ value, color, onRelease }) => {
  const anim  = useRef(new Animated.Value((value / 255) * SLIDER_W)).current;
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
      const x = Math.max(0, Math.min(SLIDER_W, gs.moveX - 44));
      anim.setValue(x);
      setLocal(Math.round((x / SLIDER_W) * 255));
    },
    onPanResponderRelease: () => {
      HapticService.light();
      onRelease(local);
    },
  });

  return (
    <View style={rgb.row}>
      <Ionicons name="sunny-outline" size={16} color="#555" style={{ width: 22 }} />
      <View style={rgb.track} {...pan.panHandlers}>
        <LinearGradient
          colors={['#000', color]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Animated.View style={[rgb.thumb, { left: anim }]} />
      </View>
      <Text style={rgb.val}>{Math.round((local / 255) * 100)}%</Text>
    </View>
  );
};

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function LEDControlScreen({ navigation }) {
  const dispatch = useDispatch();
  const { ledColor, ledBrightness, ledEffect, ledEnabled } = useSelector(s => s.table);

  const [r, setR] = useState(ledColor.r);
  const [g, setG] = useState(ledColor.g);
  const [b, setB] = useState(ledColor.b);
  const [brightness, setBrightness] = useState(ledBrightness);
  const [activeTab, setActiveTab] = useState('color'); // color | effects | scenes

  // Sync state if Redux changes externally (e.g. from scenes/palette)
  useEffect(() => {
    setR(ledColor.r);
    setG(ledColor.g);
    setB(ledColor.b);
  }, [ledColor]);

  const colorStr  = `rgb(${r},${g},${b})`;
  const hexStr    = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();

  const applyColor = async (nr, ng, nb) => {
    setR(nr); setG(ng); setB(nb);
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

  const applyScene = async (scene) => {
    HapticService.light();
    await applyColor(scene.r, scene.g, scene.b);
  };

  const applyPalette = (hex) => {
    HapticService.light();
    const nr = parseInt(hex.slice(1, 3), 16);
    const ng = parseInt(hex.slice(3, 5), 16);
    const nb = parseInt(hex.slice(5, 7), 16);
    applyColor(nr, ng, nb);
  };

  const handleToggle = async () => {
    HapticService.medium();
    dispatch(toggleLED());
    try {
      if (ledEnabled) await FluidNCService.turnOffLED();
      else            await FluidNCService.setLEDColor(r, g, b);
    } catch {}
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0A0A0F', '#0F0F18']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#D0D0D0" />
        </TouchableOpacity>
        <Text style={s.title}>Lighting</Text>
        <TouchableOpacity style={s.toggleBtn} onPress={handleToggle}>
          <View style={[s.togglePill, { backgroundColor: ledEnabled ? '#52C87A22' : '#33333344', borderColor: ledEnabled ? '#52C87A55' : '#333' }]}>
            <View style={[s.toggleDot, { backgroundColor: ledEnabled ? '#52C87A' : '#555' }]} />
            <Text style={[s.toggleTxt, { color: ledEnabled ? '#52C87A' : '#555' }]}>
              {ledEnabled ? 'ON' : 'OFF'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Preview ball */}
      <View style={s.previewArea}>
        <View style={[s.glowRing, {
          shadowColor: colorStr,
          shadowOpacity: ledEnabled ? 0.7 : 0,
          shadowRadius: 40,
          borderColor: ledEnabled ? colorStr + '44' : '#1A1A28',
        }]}>
          <View style={[s.previewCircle, {
            backgroundColor: ledEnabled ? colorStr : '#1A1A28',
            shadowColor: colorStr,
            shadowOpacity: ledEnabled ? 0.9 : 0,
            shadowRadius: 30,
            elevation: ledEnabled ? 20 : 0,
          }]} />
        </View>
        <Text style={s.hexCode}>{ledEnabled ? hexStr : 'OFF'}</Text>
        <Text style={s.rgbCode}>{ledEnabled ? `rgb(${r}, ${g}, ${b})` : 'Lights are off'}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {[['color', 'Color'], ['effects', 'Effects'], ['scenes', 'Scenes']].map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[s.tab, activeTab === id && s.tabActive]}
            onPress={() => setActiveTab(id)}
          >
            <Text style={[s.tabTxt, activeTab === id && s.tabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── COLOR TAB ── */}
        {activeTab === 'color' && (
          <>
            {/* Quick palette */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Quick Colors</Text>
              <View style={s.palette}>
                {PALETTE.map(hex => (
                  <TouchableOpacity
                    key={hex}
                    style={[s.palColor, { backgroundColor: hex }, (hex === hexStr) && s.palColorActive]}
                    onPress={() => applyPalette(hex)}
                  />
                ))}
              </View>
            </View>

            {/* RGB sliders */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Custom Color</Text>
              <RGBSlider
                label="R"
                value={r}
                gradColors={['#000', '#FF0000']}
                onRelease={val => applyColor(val, g, b)}
              />
              <RGBSlider
                label="G"
                value={g}
                gradColors={['#000', '#00FF00']}
                onRelease={val => applyColor(r, val, b)}
              />
              <RGBSlider
                label="B"
                value={b}
                gradColors={['#000', '#0000FF']}
                onRelease={val => applyColor(r, g, val)}
              />
            </View>

            {/* Brightness */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Brightness</Text>
              <BrightnessSlider
                value={brightness}
                color={colorStr}
                onRelease={applyBrightness}
              />
              {/* Quick brightness buttons */}
              <View style={s.brightnessRow}>
                {[25, 50, 75, 100].map(pct => (
                  <TouchableOpacity
                    key={pct}
                    style={s.brightBtn}
                    onPress={() => applyBrightness(Math.round(pct * 2.55))}
                  >
                    <Text style={s.brightBtnTxt}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Off button */}
            <TouchableOpacity style={s.offBtn} onPress={() => applyColor(0, 0, 0)}>
              <Ionicons name="moon-outline" size={18} color="#555" />
              <Text style={s.offBtnTxt}>Turn Off LEDs</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── EFFECTS TAB ── */}
        {activeTab === 'effects' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>LED Effects</Text>
            <Text style={s.cardSub}>Select how the LEDs animate around your table</Text>
            {EFFECTS.map(effect => (
              <TouchableOpacity
                key={effect.id}
                style={[s.effectRow, ledEffect === effect.id && s.effectRowActive]}
                onPress={() => applyEffect(effect.id)}
              >
                <View style={[s.effectIconWrap, {
                  backgroundColor: ledEffect === effect.id
                    ? colorStr + '22' : '#0D0D15',
                  borderColor: ledEffect === effect.id ? colorStr + '55' : '#1E1E2A',
                }]}>
                  <Ionicons
                    name={effect.icon}
                    size={20}
                    color={ledEffect === effect.id ? colorStr : '#555'}
                  />
                </View>
                <View style={s.effectInfo}>
                  <Text style={[s.effectName, ledEffect === effect.id && { color: '#F0F0F0' }]}>
                    {effect.name}
                  </Text>
                  <Text style={s.effectDesc}>{effect.desc}</Text>
                </View>
                {ledEffect === effect.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colorStr} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── SCENES TAB ── */}
        {activeTab === 'scenes' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Lighting Scenes</Text>
            <Text style={s.cardSub}>Curated color themes for every mood</Text>
            <View style={s.scenesGrid}>
              {SCENES.map(scene => (
                <TouchableOpacity
                  key={scene.id}
                  style={s.sceneCard}
                  onPress={() => applyScene(scene)}
                >
                  <LinearGradient
                    colors={scene.colors}
                    style={s.sceneGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                  <Text style={s.sceneName}>{scene.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },

  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#13131C', borderWidth: 1, borderColor: '#1E1E2A',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  title:     { flex: 1, fontSize: 22, fontWeight: '700', color: '#F0F0F0' },
  toggleBtn: {},
  togglePill:{
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleTxt: { fontSize: 12, fontWeight: '700' },

  // Preview
  previewArea: { alignItems: 'center', paddingVertical: 24 },
  glowRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 12,
  },
  previewCircle: {
    width: 80, height: 80, borderRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  hexCode: { fontSize: 18, fontWeight: '700', color: '#D0D0D0', letterSpacing: 2, fontFamily: 'monospace' },
  rgbCode: { fontSize: 12, color: '#555', marginTop: 4 },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#13131C', borderRadius: 12,
    padding: 4, gap: 4, marginBottom: 14,
    borderWidth: 1, borderColor: '#1E1E2A',
  },
  tab: {
    flex: 1, paddingVertical: 9,
    borderRadius: 9, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabTxt:   { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTxtActive: { color: '#0A0A0F', fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20 },

  // Card
  card: {
    backgroundColor: '#13131C',
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#1E1E2A',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#D0D0D0', marginBottom: 4 },
  cardSub:   { fontSize: 12, color: '#555', marginBottom: 16 },

  // Palette
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  palColor: {
    width: (width - 88 - 100) / 5,
    height: (width - 88 - 100) / 5,
    borderRadius: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  palColorActive: { borderColor: '#fff', borderWidth: 2 },

  // Off button
  offBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 16,
    backgroundColor: '#13131C',
    borderRadius: 14, borderWidth: 1, borderColor: '#1E1E2A',
    marginBottom: 14,
  },
  offBtnTxt: { color: '#555', fontSize: 14, fontWeight: '500' },

  // Effects
  effectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A28',
  },
  effectRowActive: {},
  effectIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  effectInfo: { flex: 1 },
  effectName: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 2 },
  effectDesc: { fontSize: 11, color: '#444' },

  // Scenes
  scenesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sceneCard: {
    width: (width - 76) / 2,
    height: 80, borderRadius: 14, overflow: 'hidden',
    justifyContent: 'flex-end', padding: 10,
    borderWidth: 1, borderColor: '#1E1E2A',
  },
  sceneGrad: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  sceneName: { fontSize: 13, fontWeight: '700', color: '#fff', textShadowColor: '#000', textShadowRadius: 4 },

  // Brightness
  brightnessRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  brightBtn: {
    flex: 1, paddingVertical: 8,
    backgroundColor: '#0D0D15', borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#1E1E2A',
  },
  brightBtnTxt: { fontSize: 12, color: '#666', fontWeight: '600' },
});

// RGB slider styles
const rgb = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14,
  },
  label: {
    fontSize: 12, fontWeight: '700',
    color: '#666', width: 12,
  },
  track: {
    flex: 1, height: 8, borderRadius: 4,
    overflow: 'hidden', position: 'relative',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', top: -5, marginLeft: -9,
    borderWidth: 2, borderColor: '#1E1E2A',
    shadowColor: '#fff', shadowOpacity: 0.4,
    shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  val: { fontSize: 11, color: '#555', width: 30, textAlign: 'right' },
});
