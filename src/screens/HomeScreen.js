// src/screens/HomeScreen.js — Premium Rebuild (Matches Reference Design)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Animated, Dimensions, PanResponder, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { SandPreview } from '../components/SandPreview';
import { RemotePatternPreview } from '../components/RemotePatternPreview';
import { formatDuration } from '../constants/patterns';
import FluidNCService from '../services/FluidNCService';
import WebSocketService from '../services/WebSocketService';
import {
  setPlaying, setPaused, setResumed,
  setStopped, setStatus, setProgress, setSpeed, setLEDBrightness,
} from '../store/tableSlice';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');

// Reference palette — warm amber on pure black
const AMBER = '#F0A030';
const AMBER_BRIGHT = '#FFB84D';
const AMBER_DARK = '#C07A20';
const AMBER_MUTED = '#B8864A';
const TEXT_MUTED = '#9A8070';
const BG = '#000000';

// ── GREETING ──
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '👋' };
  return { text: 'Good Evening', emoji: '👋' };
};

// ── SLIDER (reference: thin track, amber thumb + glow) ──
const MiniSlider = ({ value, max, onRelease }) => {
  const [localVal, setLocalVal] = useState(value);
  const trackW = useRef(1);
  const valRef = useRef(value);
  const onReleaseRef = useRef(onRelease);

  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);
  useEffect(() => {
    setLocalVal(value);
    valRef.current = value;
  }, [value]);

  const updateFromTouch = (evt) => {
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / trackW.current));
    const newVal = Math.round(pct * max);
    setLocalVal(newVal);
    valRef.current = newVal;
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => updateFromTouch(evt),
    onPanResponderMove: (evt) => updateFromTouch(evt),
    onPanResponderRelease: () => {
      HapticService.light();
      if (onReleaseRef.current) onReleaseRef.current(valRef.current);
    },
  })).current;

  const pct = Math.max(0, Math.min(100, (localVal / max) * 100));

  return (
    <View style={miniSlider.container}>
      <View
        style={miniSlider.track}
        onLayout={(e) => { trackW.current = e.nativeEvent.layout.width || 1; }}
        {...pan.panHandlers}
      >
        <View style={miniSlider.trackBg} />
        <View style={[miniSlider.fillWrap, { width: `${pct}%` }]}>
          <LinearGradient
            colors={[AMBER_DARK, AMBER, AMBER_BRIGHT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={miniSlider.fill}
          />
        </View>
        <View style={[miniSlider.thumbGlow, { left: `${pct}%` }]} />
        <View style={[miniSlider.thumb, { left: `${pct}%` }]} />
      </View>
    </View>
  );
};

const miniSlider = StyleSheet.create({
  container: { width: '100%', paddingVertical: 8 },
  track: { height: 14, justifyContent: 'center', position: 'relative' },
  trackBg: {
    height: 3, borderRadius: 2, backgroundColor: '#2A2520',
    position: 'absolute', left: 0, right: 0, top: 5.5,
  },
  fillWrap: { position: 'absolute', left: 0, top: 5.5, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { flex: 1, height: 3, borderRadius: 2 },
  thumbGlow: {
    position: 'absolute', top: 0, marginLeft: -11,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(240,160,48,0.22)',
  },
  thumb: {
    position: 'absolute', top: 3, marginLeft: -7,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: AMBER_BRIGHT,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
});

// ── WAVE ANIMATION (for Playing indicator) ──
const WaveBar = ({ delay }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: 2.5, height: 14, borderRadius: 2,
      backgroundColor: AMBER,
      marginHorizontal: 1.5,
      transform: [{ scaleY: anim }],
    }} />
  );
};

// ── MAIN SCREEN ──
export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const {
    isConnected, isPlaying, isPaused,
    currentPattern, progress, ledColor, ledBrightness,
    tableName, speed,
  } = useSelector(s => s.table);
  const { patterns } = useSelector(s => s.pattern);

  const recommendedPatterns = patterns.slice(0, 6);
  const { text: greetText, emoji: greetEmoji } = getGreeting();
  const ledStr = `rgb(${ledColor.r},${ledColor.g},${ledColor.b})`;

  // WebSocket subscriptions
  useEffect(() => {
    if (!isConnected) return;
    const u1 = WebSocketService.on('status', s => dispatch(setStatus(s)));
    const u2 = WebSocketService.on('progress', p => dispatch(setProgress(p)));
    const u3 = WebSocketService.on('complete', () => {
      HapticService.success();
      dispatch(setStopped());
    });
    return () => { u1(); u2(); u3(); };
  }, [isConnected]);

  const handlePauseResume = async () => {
    HapticService.medium();
    try {
      if (isPaused) { await FluidNCService.resume(); dispatch(setResumed()); }
      else { await FluidNCService.pause(); dispatch(setPaused()); }
    } catch {}
  };

  const handleStop = async () => {
    HapticService.heavy();
    try { await FluidNCService.stop(); dispatch(setStopped()); } catch {}
  };

  const handleSpeedChange = async (val) => {
    dispatch(setSpeed(val));
    try { await FluidNCService.setSpeed(val); } catch {}
  };

  const handleBrightnessChange = async (val) => {
    dispatch(setLEDBrightness(val));
    try { await FluidNCService.setLEDBrightness(val); } catch {}
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
      >
        {/* ══ HEADER ══ */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>{greetText} {greetEmoji}</Text>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.tagline}>Relax your mind. Inspire your space.</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => { HapticService.light(); }}
            >
              <Ionicons name="notifications-outline" size={20} color={TEXT_MUTED} />
              {/* Notification dot */}
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => { HapticService.light(); navigation.navigate('Settings'); }}
            >
              <Ionicons name="settings-outline" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ DEVICE HERO CARD ══ */}
        <View style={styles.heroCard}>
          {/* Device Image */}
          <Image
            source={require('../assets/device.png')}
            style={styles.deviceImage}
            resizeMode="cover"
          />

          {/* Dark overlay for text readability */}
          <LinearGradient
            colors={['rgba(10,8,6,0)', 'rgba(10,8,6,0.6)', 'rgba(10,8,6,0.96)']}
            style={styles.heroOverlay}
          />

          {/* Connection Status Pill */}
          <View style={styles.connPill}>
            <View style={[styles.connDot, { backgroundColor: isConnected ? '#52C87A' : '#888' }]} />
            <Text style={styles.connPillText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          {/* Device Name & Battery */}
          <View style={styles.heroBottom}>
            <TouchableOpacity
              onPress={() => { HapticService.light(); navigation.navigate('Connect'); }}
            >
              <View style={styles.deviceNameRow}>
                <Text style={styles.deviceName}>{tableName}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
            <View style={styles.batteryRow}>
              <Ionicons name="battery-charging-outline" size={14} color="#52C87A" />
              <Text style={styles.batteryText}>78%</Text>
            </View>
          </View>

          {/* ── NOW PLAYING BAR (bottom of hero card) ── */}
          <View style={styles.playerBar}>
            {/* Pattern thumbnail */}
            <View style={styles.playerThumb}>
              {currentPattern ? (
                currentPattern?.isRemote ? (
                  <RemotePatternPreview pattern={currentPattern} size={42} />
                ) : (
                  <SandPreview patternId={currentPattern.id} size={42} />
                )
              ) : (
                <Image
                  source={require('../assets/pattern_waves.png')}
                  style={{ width: 42, height: 42, borderRadius: 10 }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Pattern info */}
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {currentPattern?.name || 'Ocean Waves'}
              </Text>
              <View style={styles.playerStatusRow}>
                {isPlaying ? (
                  <>
                    <WaveBar delay={0} />
                    <WaveBar delay={100} />
                    <WaveBar delay={200} />
                    <WaveBar delay={300} />
                    <Text style={styles.playerStatusText}> Playing</Text>
                  </>
                ) : (
                  <Text style={[styles.playerStatusText, { color: TEXT_MUTED }]}>
                    {isPaused ? 'Paused' : 'Tap play to start'}
                  </Text>
                )}
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlSmall}
                onPress={() => {
                  HapticService.light();
                  const idx = patterns.findIndex(p => p.id === currentPattern?.id);
                  if (idx > 0) navigation.navigate('PatternDetail', { pattern: patterns[idx - 1] });
                }}
              >
                <Ionicons name="play-skip-back" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              {/* Main Play/Pause button */}
              <TouchableOpacity
                style={styles.controlPlay}
                onPress={isPlaying || isPaused
                  ? handlePauseResume
                  : () => { HapticService.medium(); navigation.navigate('Library'); }}
              >
                <View style={styles.controlPlayInner}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={22}
                    color="#1A1000"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlSmall}
                onPress={() => {
                  HapticService.light();
                  const idx = patterns.findIndex(p => p.id === currentPattern?.id);
                  const next = patterns[(idx + 1) % patterns.length];
                  navigation.navigate('PatternDetail', { pattern: next });
                }}
              >
                <Ionicons name="play-skip-forward" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ ADJUSTMENT CONTROLS ══ */}
        <View style={styles.adjustCardContainer}>
          {/* Speed */}
          <View style={styles.adjustItem}>
            <View style={styles.adjustHeader}>
              <Ionicons name="speedometer-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.adjustLabel}>Speed</Text>
            </View>
            <Text style={styles.adjustValue}>{speed}%</Text>
            <MiniSlider
              value={speed}
              max={100}
              onRelease={handleSpeedChange}
            />
          </View>

          <View style={styles.adjustDivider} />

          {/* Brightness */}
          <View style={styles.adjustItem}>
            <View style={styles.adjustHeader}>
              <Ionicons name="sunny-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.adjustLabel}>Brightness</Text>
            </View>
            <Text style={styles.adjustValue}>{Math.round((ledBrightness / 255) * 100)}%</Text>
            <MiniSlider
              value={ledBrightness}
              max={255}
              onRelease={handleBrightnessChange}
            />
          </View>

          <View style={styles.adjustDivider} />

          {/* Ambient */}
          <TouchableOpacity
            style={styles.adjustItem}
            onPress={() => { HapticService.light(); navigation.navigate('LEDControlTab'); }}
          >
            <View style={styles.adjustHeader}>
              <Ionicons name="color-palette-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.adjustLabel}>Ambient</Text>
            </View>
            <View style={styles.ambientRow}>
              <Text style={styles.adjustValue}>Warm</Text>
              <View style={[styles.ambientOrb, { backgroundColor: ledStr }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.3, y: 0 }}
                  end={{ x: 0.7, y: 1 }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══ QUICK ACTIONS ══ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={() => { HapticService.light(); navigation.navigate('Library'); }}>
              <Text style={styles.seeAll}>See All <Ionicons name="chevron-forward" size={12} /></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickGrid}>
            {[
              {
                icon: 'play',
                label: isPlaying ? 'Pause' : 'Play / Pause',
                onPress: isPlaying || isPaused
                  ? handlePauseResume
                  : () => navigation.navigate('Library'),
              },
              {
                icon: 'star-outline',
                label: 'Favorites',
                onPress: () => navigation.navigate('Library'),
              },
              {
                icon: 'moon-outline',
                label: 'Sleep Timer',
                onPress: () => navigation.navigate('ScheduleTab'),
              },
              {
                icon: 'sunny-outline',
                label: 'Lighting',
                onPress: () => navigation.navigate('LEDControlTab'),
              },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.quickCard}
                onPress={() => { HapticService.light(); a.onPress(); }}
                activeOpacity={0.7}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name={a.icon} size={22} color={AMBER_MUTED} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══ RECOMMENDED FOR YOU ══ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <TouchableOpacity onPress={() => { HapticService.light(); navigation.navigate('Library'); }}>
              <Text style={styles.seeAll}>View Library <Ionicons name="chevron-forward" size={12} /></Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {recommendedPatterns.map((p, i) => {
              const thumbSources = [
                require('../assets/pattern_waves.png'),
                require('../assets/pattern_lotus.png'),
                require('../assets/pattern_spiral.png'),
              ];
              const thumb = thumbSources[i % thumbSources.length];

              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.recCard}
                  onPress={() => { HapticService.light(); navigation.navigate('PatternDetail', { pattern: p }); }}
                  activeOpacity={0.85}
                >
                  {/* Full-bleed image */}
                  <Image source={thumb} style={StyleSheet.absoluteFill} resizeMode="cover" />

                  {/* Centre play button */}
                  <View style={styles.recPlayIcon}>
                    <Ionicons name="play" size={18} color="rgba(255,255,255,0.95)" />
                  </View>

                  {/* Bottom gradient overlay with name + duration */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                    style={styles.recGradient}
                  >
                    <Text style={styles.recName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.recDur}>{formatDuration(p.duration)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Disconnected Banner */}
        {!isConnected && (
          <TouchableOpacity
            style={styles.connectBanner}
            onPress={() => { HapticService.medium(); navigation.navigate('Connect'); }}
          >
            <Ionicons name="wifi-outline" size={16} color={AMBER} />
            <Text style={styles.connectBannerText}>Tap to connect your SandTable</Text>
            <Ionicons name="chevron-forward" size={14} color={AMBER} />
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scroll: { paddingBottom: 20, paddingHorizontal: 16 },

  // ── HEADER ──
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 58,
    paddingHorizontal: 6, // 16 from scroll + 6 = 22
    paddingBottom: 20,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  greeting: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: AMBER_MUTED,
    fontWeight: '400',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AMBER,
    borderWidth: 1.5,
    borderColor: '#111',
  },

  // ── HERO CARD ──
  heroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1A1200',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  deviceImage: {
    width: '100%',
    height: 210,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 210,
  },
  connPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  connPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 90,
    left: 16,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  batteryText: {
    color: '#52C87A',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── PLAYER BAR ──
  playerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,13,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  playerThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2A2010',
    overflow: 'hidden',
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerStatusText: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlSmall: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  controlPlayInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── ADJUST ROW ──
  adjustCardContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 22,
    backgroundColor: '#0D0D0D',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  adjustItem: {
    flex: 1,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  adjustDivider: {
    width: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 4,
  },
  adjustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  adjustLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  adjustValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ambientOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 6,
  },

  // ── QUICK ACTIONS & SECTIONS ──
  sectionWrap: {
    width: '100%',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    gap: 8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,160,48,0.06)',
  },
  quickLabel: {
    fontSize: 10,
    color: AMBER_MUTED,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── RECOMMENDED ──
  hScroll: Platform.select({
    web: { paddingLeft: 0 },
    default: { marginHorizontal: -16, paddingHorizontal: 16 },
  }),
  recCard: {
    width: 120,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1510',
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recPlayIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  recGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
  },
  recName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  recDur: {
    fontSize: 11,
    color: AMBER_MUTED,
  },

  // ── CONNECT BANNER ──
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(240,160,48,0.07)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(240,160,48,0.2)',
  },
  connectBannerText: {
    flex: 1,
    color: AMBER,
    fontSize: 13,
    fontWeight: '500',
  },
});
