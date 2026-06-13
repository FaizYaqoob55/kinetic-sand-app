// src/screens/PatternDetailScreen.js — Immersive Oasis / Sandsara pattern detail
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Dimensions, PanResponder, Animated, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { getDifficultyColor, formatDuration } from '../constants/patterns';
import FluidNCService from '../services/FluidNCService';
import PatternRemoteService from '../services/PatternRemoteService';
import { setPlaying, setStopped, addToPlaylist, setSpeed } from '../store/tableSlice';
import { toggleFavorite, addDownloaded } from '../store/patternSlice';
import { PatternCanvas } from '../components/PatternLibraryCard';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const HERO_SIZE = Math.min(width - 40, 360);
const CANVAS_SIZE = HERO_SIZE * 0.8;
const RING_R = HERO_SIZE * 0.46;
const RING_CIRC = 2 * Math.PI * RING_R;

const AMBER = '#F0A030';
const AMBER_BRIGHT = '#FFB84D';
const AMBER_DARK = '#C07A20';
const AMBER_MUTED = '#B8864A';
const TEXT_MUTED = '#9A8070';
const BG = '#000000';
const CARD = '#0D0D0D';
const CARD_BORDER = '#1E1E1E';
const AMBER_GRAD = ['#FFB84D', AMBER, AMBER_DARK];

const DIFF_LABELS = { smooth: 'Easy', detailed: 'Medium', complex: 'Advanced' };

const ProgressRing = ({ progress, active }) => {
  const offset = RING_CIRC - (Math.min(100, progress) / 100) * RING_CIRC;
  const cx = HERO_SIZE / 2;
  return (
    <Svg width={HERO_SIZE} height={HERO_SIZE} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Circle
        cx={cx} cy={cx} r={RING_R}
        fill="none" stroke="rgba(240,160,48,0.12)" strokeWidth={3}
      />
      {active && (
        <Circle
          cx={cx} cy={cx} r={RING_R}
          fill="none" stroke={AMBER} strokeWidth={3}
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
      )}
    </Svg>
  );
};

const DeviceHero = ({ pattern, isPlaying, progress }) => {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!isPlaying) {
      pulse.setValue(0.5);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying, pulse]);

  return (
    <View style={dh.wrap}>
      <LinearGradient colors={['#4A3424', '#2E2014', '#141008']} style={dh.wood} />
      <ProgressRing progress={progress} active={isPlaying} />
      <Animated.View style={[dh.ledGlow, { opacity: pulse }]} />
      <View style={[dh.ledRing, isPlaying && dh.ledRingActive]} />
      <View style={dh.canvasClip}>
        <PatternCanvas pattern={pattern} size={CANVAS_SIZE} intense showGlow={isPlaying} />
      </View>
      {isPlaying && (
        <View style={dh.livePill}>
          <View style={dh.liveDot} />
          <Text style={dh.liveTxt}>Drawing · {Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const dh = StyleSheet.create({
  wrap: {
    width: HERO_SIZE, height: HERO_SIZE, borderRadius: HERO_SIZE / 2,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  wood: { ...StyleSheet.absoluteFillObject, borderRadius: HERO_SIZE / 2 },
  ledGlow: {
    position: 'absolute', width: HERO_SIZE * 0.92, height: HERO_SIZE * 0.92,
    borderRadius: HERO_SIZE * 0.46, backgroundColor: 'rgba(240,160,48,0.1)',
  },
  ledRing: {
    position: 'absolute', width: HERO_SIZE * 0.88, height: HERO_SIZE * 0.88,
    borderRadius: HERO_SIZE * 0.44, borderWidth: 2,
    borderColor: 'rgba(240,160,48,0.28)',
  },
  ledRingActive: { borderColor: 'rgba(240,160,48,0.65)' },
  canvasClip: {
    width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: CANVAS_SIZE / 2,
    overflow: 'hidden',
  },
  livePill: {
    position: 'absolute', bottom: 22, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(240,160,48,0.35)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AMBER },
  liveTxt: { fontSize: 11, fontWeight: '700', color: AMBER, letterSpacing: 0.3 },
});

const SpeedSlider = ({ value, onRelease }) => {
  const [local, setLocal] = useState(value);
  const trackW = useRef(1);
  const valRef = useRef(value);

  useEffect(() => {
    setLocal(value);
    valRef.current = value;
  }, [value]);

  const update = (x) => {
    const c = Math.max(0, Math.min(trackW.current, x));
    const v = Math.round((c / trackW.current) * 100);
    setLocal(v);
    valRef.current = v;
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
    onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    onPanResponderRelease: () => { HapticService.light(); onRelease(valRef.current); },
  })).current;

  const pct = Math.max(0, Math.min(100, local));

  return (
    <View style={sl.wrap}>
      <View style={sl.labelRow}>
        <Ionicons name="speedometer-outline" size={15} color={TEXT_MUTED} />
        <Text style={sl.label}>Speed</Text>
        <Text style={sl.val}>{local}%</Text>
      </View>
      <View
        style={sl.track}
        onLayout={(e) => { trackW.current = e.nativeEvent.layout.width || 1; }}
        {...pan.panHandlers}
      >
        <View style={sl.trackBg} />
        <View style={[sl.fillWrap, { width: `${pct}%` }]}>
          <LinearGradient colors={AMBER_GRAD} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={sl.fill} />
        </View>
        <View style={[sl.thumbGlow, { left: `${pct}%` }]} />
        <View style={[sl.thumb, { left: `${pct}%` }]} />
      </View>
    </View>
  );
};

const sl = StyleSheet.create({
  wrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { flex: 1, fontSize: 13, color: '#DDD', fontWeight: '500' },
  val: { fontSize: 13, color: AMBER, fontWeight: '700' },
  track: { height: 14, justifyContent: 'center', position: 'relative' },
  trackBg: { height: 3, borderRadius: 2, backgroundColor: '#2A2520', position: 'absolute', left: 0, right: 0, top: 5.5 },
  fillWrap: { position: 'absolute', left: 0, top: 5.5, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { flex: 1 },
  thumbGlow: {
    position: 'absolute', top: 0, marginLeft: -11, width: 22, height: 22,
    borderRadius: 11, backgroundColor: 'rgba(240,160,48,0.22)',
  },
  thumb: {
    position: 'absolute', top: 3, marginLeft: -7, width: 14, height: 14,
    borderRadius: 7, backgroundColor: AMBER_BRIGHT,
    shadowColor: AMBER, shadowOpacity: 0.9, shadowRadius: 8,
  },
});

const DockAction = ({ icon, label, onPress, active }) => (
  <Pressable style={st.dockAction} onPress={onPress}>
    <View style={[st.dockIcon, active && st.dockIconActive]}>
      <Ionicons name={icon} size={18} color={active ? '#1A1208' : AMBER_MUTED} />
    </View>
    <Text style={st.dockLbl}>{label}</Text>
  </Pressable>
);

const RelatedCard = ({ item, onPress }) => (
  <TouchableOpacity style={st.relCard} onPress={onPress} activeOpacity={0.88}>
    <View style={st.relPreview}>
      <PatternCanvas pattern={item} size={72} showGlow={false} />
    </View>
    <Text style={st.relName} numberOfLines={2}>{item.name}</Text>
    <Text style={st.relDur}>{formatDuration(item.duration)}</Text>
  </TouchableOpacity>
);

export default function PatternDetailScreen({ navigation, route }) {
  const { pattern } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { isConnected, currentPattern, isPlaying, speed, progress } = useSelector((s) => s.table);
  const { favorites, patterns } = useSelector((s) => s.pattern);

  const isFav = favorites.includes(pattern.id);
  const isActive = isPlaying && currentPattern?.id === pattern.id;
  const diffColor = getDifficultyColor(pattern.difficulty);
  const dockH = 220 + insets.bottom;

  const related = patterns.filter(
    (p) => p.id !== pattern.id && (p.category === pattern.category || pattern.category === 'all'),
  ).slice(0, 6);

  const handlePlay = async () => {
    HapticService.medium();
    if (!isConnected) {
      Alert.alert('Not Connected', 'Connect your Oasis Mini to draw this pattern.', [
        { text: 'Connect', onPress: () => navigation.navigate('Connect') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      dispatch(setPlaying(pattern));
      await PatternRemoteService.playPattern(pattern, { speed });
      dispatch(addDownloaded(pattern.id));
      navigation.navigate('NowPlaying');
    } catch {
      HapticService.error();
      Alert.alert('Error', 'Could not download or start pattern. Check Wi‑Fi and table connection.');
    }
  };

  const handleStop = async () => {
    HapticService.heavy();
    try {
      await FluidNCService.stop();
      dispatch(setStopped());
    } catch {
      Alert.alert('Error', 'Could not stop pattern.');
    }
  };

  const handleSpeed = async (val) => {
    dispatch(setSpeed(val));
    if (isConnected) {
      try { await FluidNCService.setSpeed(val); } catch {}
    }
  };

  const handlePlaylist = () => {
    HapticService.success();
    dispatch(addToPlaylist(pattern));
    Alert.alert('Added', `"${pattern.name}" added to your playlist.`);
  };

  return (
    <View style={st.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          st.scroll,
          { paddingTop: insets.top + 12, paddingBottom: dockH + 16 },
        ]}
      >
        {/* Floating header */}
        <View style={st.header}>
          <TouchableOpacity style={st.iconBtn} onPress={() => { HapticService.light(); navigation.goBack(); }}>
            <Ionicons name="chevron-back" size={22} color="#EEE" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.iconBtn, isFav && st.iconBtnFav]}
            onPress={() => { HapticService.light(); dispatch(toggleFavorite(pattern.id)); }}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#FF6B8A' : '#AAA'} />
          </TouchableOpacity>
        </View>

        <DeviceHero pattern={pattern} isPlaying={isActive} progress={progress} />

        <View style={st.info}>
          <Text style={st.eyebrow}>{pattern.category}</Text>
          <Text style={st.name}>{pattern.name}</Text>
          <View style={st.metaLine}>
            <Ionicons name="time-outline" size={13} color={AMBER_MUTED} />
            <Text style={st.metaTxt}>{formatDuration(pattern.duration)}</Text>
            <Text style={st.metaSep}>·</Text>
            <View style={[st.metaDot, { backgroundColor: diffColor }]} />
            <Text style={st.metaTxt}>{DIFF_LABELS[pattern.difficulty] || pattern.difficulty}</Text>
            {pattern.isNew && (
              <>
                <Text style={st.metaSep}>·</Text>
                <Text style={st.metaNew}>NEW</Text>
              </>
            )}
          </View>
          {pattern.description ? (
            <Text style={st.desc}>{pattern.description}</Text>
          ) : null}
        </View>

        {related.length > 0 && (
          <View style={st.relatedSection}>
            <View style={st.relatedHead}>
              <Text style={st.relatedTitle}>More like this</Text>
              <TouchableOpacity
                onPress={() => {
                  HapticService.light();
                  navigation.navigate('Main', { screen: 'Library' });
                }}
              >
                <Text style={st.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.relatedScroll}>
              {related.map((item) => (
                <RelatedCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    HapticService.light();
                    navigation.replace('PatternDetail', { pattern: item });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom dock */}
      <View style={[st.dock, { paddingBottom: insets.bottom + 12 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)', '#000']}
          style={st.dockFade}
          pointerEvents="none"
        />
        <View style={st.dockCard}>
          <SpeedSlider value={speed} onRelease={handleSpeed} />

          {isActive ? (
            <View style={st.activeRow}>
              <TouchableOpacity style={st.nowBtn} onPress={() => navigation.navigate('NowPlaying')}>
                <Ionicons name="expand-outline" size={18} color={AMBER} />
                <Text style={st.nowTxt}>Now Playing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.stopBtn} onPress={handleStop}>
                <Ionicons name="stop" size={18} color="#FF7B7B" />
                <Text style={st.stopTxt}>Stop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[st.playBtn, !isConnected && st.playBtnOff]}
              onPress={handlePlay}
              activeOpacity={0.9}
            >
              <LinearGradient colors={AMBER_GRAD} style={st.playGrad}>
                <Ionicons name="play" size={24} color="#1A1208" style={{ marginLeft: 2 }} />
                <Text style={st.playTxt}>Draw Pattern</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {!isConnected && (
            <TouchableOpacity style={st.connectRow} onPress={() => navigation.navigate('Connect')}>
              <Ionicons name="wifi-outline" size={14} color={AMBER} />
              <Text style={st.connectTxt}>Tap to connect your table</Text>
            </TouchableOpacity>
          )}

          <View style={st.dockActions}>
            <DockAction
              icon="sunny-outline"
              label="Lights"
              onPress={() => { HapticService.light(); navigation.navigate('LEDControl'); }}
            />
            <DockAction
              icon="time-outline"
              label="Timer"
              onPress={() => { HapticService.light(); navigation.navigate('Schedule'); }}
            />
            <DockAction
              icon="add-circle-outline"
              label="Playlist"
              onPress={handlePlaylist}
            />
            <DockAction
              icon="grid-outline"
              label="Browse"
              onPress={() => { HapticService.light(); navigation.navigate('Main', { screen: 'Library' }); }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: CARD,
    borderWidth: 1, borderColor: CARD_BORDER, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnFav: { borderColor: 'rgba(255,107,138,0.3)', backgroundColor: 'rgba(255,107,138,0.08)' },

  info: { alignItems: 'center', marginTop: 20, paddingHorizontal: 12 },
  eyebrow: {
    fontSize: 11, fontWeight: '700', color: AMBER_MUTED,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
  },
  name: {
    fontSize: 30, fontWeight: '700', color: '#FFFFFF', textAlign: 'center',
    letterSpacing: -0.4, marginBottom: 10,
  },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaTxt: { fontSize: 13, color: '#CCC', fontWeight: '600' },
  metaSep: { color: TEXT_MUTED, fontSize: 13 },
  metaDot: { width: 6, height: 6, borderRadius: 3 },
  metaNew: { fontSize: 11, fontWeight: '800', color: AMBER, letterSpacing: 0.6 },
  desc: {
    fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 21,
    maxWidth: 320,
  },

  relatedSection: { marginTop: 28 },
  relatedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  relatedTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  seeAll: { fontSize: 13, fontWeight: '600', color: AMBER },
  relatedScroll: { gap: 12, paddingRight: 8 },
  relCard: {
    width: 108, backgroundColor: CARD, borderRadius: 18,
    padding: 10, borderWidth: 1, borderColor: CARD_BORDER,
  },
  relPreview: {
    width: 72, height: 72, borderRadius: 36, overflow: 'hidden',
    alignSelf: 'center', marginBottom: 10,
  },
  relName: { fontSize: 12, fontWeight: '600', color: '#EEE', textAlign: 'center', marginBottom: 4, minHeight: 32 },
  relDur: { fontSize: 11, color: AMBER_MUTED, textAlign: 'center', fontWeight: '600' },

  dock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 8,
  },
  dockFade: {
    position: 'absolute', left: 0, right: 0, top: -40, height: 40,
  },
  dockCard: {
    backgroundColor: CARD, borderRadius: 24, padding: 18,
    borderWidth: 1, borderColor: CARD_BORDER,
  },

  playBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  playBtnOff: { opacity: 0.5 },
  playGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  playTxt: { fontSize: 17, fontWeight: '700', color: '#1A1208' },

  activeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  nowBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(240,160,48,0.08)',
    borderWidth: 1, borderColor: 'rgba(240,160,48,0.28)',
  },
  nowTxt: { fontSize: 15, fontWeight: '600', color: AMBER },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,80,80,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,123,123,0.28)',
  },
  stopTxt: { fontSize: 15, fontWeight: '600', color: '#FF7B7B' },

  connectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 10, paddingVertical: 4,
  },
  connectTxt: { fontSize: 12, color: AMBER, fontWeight: '500' },

  dockActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dockAction: { alignItems: 'center', gap: 6, flex: 1 },
  dockIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: CARD_BORDER,
  },
  dockIconActive: { backgroundColor: AMBER, borderColor: AMBER },
  dockLbl: { fontSize: 10, color: AMBER_MUTED, fontWeight: '500' },
});
