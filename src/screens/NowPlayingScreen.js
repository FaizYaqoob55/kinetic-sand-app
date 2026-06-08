// src/screens/NowPlayingScreen.js — Luxury Rebuild
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import WebSocketService from '../services/WebSocketService';
import {
  setPaused, setResumed, setStopped,
  setProgress, setSpeed, setTimeElapsed,
} from '../store/tableSlice';
import { formatDuration } from '../constants/patterns';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const RING_SIZE  = 220;
const RING_R     = 100;
const CIRCUMF    = 2 * Math.PI * RING_R;
const SLIDER_W   = width - 80;

// Animated sand art ring
const SandRing = ({ progress, ledColor, isPlaying }) => {
  const strokeOffset = CIRCUMF - (progress / 100) * CIRCUMF;
  const c = '#3A3A4A';
  const cx = RING_SIZE / 2, cy = RING_SIZE / 2;
  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      {/* Decorative inner circles */}
      {[30, 22, 14, 6].map(r => (
        <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="0.8" opacity="0.4" />
      ))}
      {/* Cross lines */}
      <Line x1={cx} y1={cy - 30} x2={cx} y2={cy + 30} stroke={c} strokeWidth="0.6" opacity="0.3" />
      <Line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke={c} strokeWidth="0.6" opacity="0.3" />

      {/* Track */}
      <Circle cx={cx} cy={cy} r={RING_R} fill="none" stroke="#1A1A28" strokeWidth={6} />
      {/* Progress */}
      <Circle
        cx={cx} cy={cy} r={RING_R}
        fill="none"
        stroke={isPlaying ? ledColor : '#2A2A3A'}
        strokeWidth={6}
        strokeDasharray={CIRCUMF}
        strokeDashoffset={strokeOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx}, ${cy}`}
      />
    </Svg>
  );
};

const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

export default function NowPlayingScreen({ navigation }) {
  const dispatch = useDispatch();
  const {
    isPlaying, isPaused, currentPattern,
    progress, speed, ledColor,
    timeElapsed, timeRemaining,
  } = useSelector(s => s.table);

  const [localSpeed, setLocalSpeed] = useState(speed);
  const breathAnim = useRef(new Animated.Value(1)).current;
  const timerRef   = useRef(null);
  
  // Track timeElapsed in ref to avoid stale closure in setInterval
  const timeElapsedRef = useRef(timeElapsed);
  useEffect(() => {
    timeElapsedRef.current = timeElapsed;
  }, [timeElapsed]);

  const ledStr = `rgb(${ledColor.r},${ledColor.g},${ledColor.b})`;

  // Speed slider pan
  const sliderVal = useRef(new Animated.Value((speed / 100) * SLIDER_W)).current;
  const speedPan  = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const x = Math.max(0, Math.min(SLIDER_W, gs.moveX - 40));
      sliderVal.setValue(x);
      setLocalSpeed(Math.round((x / SLIDER_W) * 100));
    },
    onPanResponderRelease: async () => {
      HapticService.light();
      dispatch(setSpeed(localSpeed));
      try { await FluidNCService.setSpeed(localSpeed); } catch {}
    },
  });

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0.97, duration: 2000, useNativeDriver: true }),
      ])).start();
      
      timerRef.current = setInterval(() => {
        dispatch(setTimeElapsed(timeElapsedRef.current + 1));
      }, 1000);
    } else {
      breathAnim.stopAnimation(); breathAnim.setValue(1);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  useEffect(() => {
    const u1 = WebSocketService.on('progress', p => dispatch(setProgress(p)));
    const u2 = WebSocketService.on('complete', () => {
      HapticService.success();
      dispatch(setStopped());
    });
    return () => { u1(); u2(); };
  }, []);

  const handlePause = async () => {
    HapticService.medium();
    try {
      if (isPaused) { await FluidNCService.resume(); dispatch(setResumed()); }
      else          { await FluidNCService.pause();  dispatch(setPaused());  }
    } catch {}
  };

  const handleStop = async () => {
    HapticService.heavy();
    try { await FluidNCService.stop(); dispatch(setStopped()); } catch {}
  };

  if (!currentPattern) {
    return (
      <View style={styles.emptyRoot}>
        <LinearGradient colors={['#0A0A0F', '#0F0F18']} style={StyleSheet.absoluteFill} />
        <Svg width={80} height={80} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="none" stroke="#2A2A3A" strokeWidth="2" />
          <Circle cx="50" cy="50" r="26" fill="none" stroke="#2A2A3A" strokeWidth="2" />
          <Circle cx="50" cy="50" r="12" fill="none" stroke="#2A2A3A" strokeWidth="2" />
        </Svg>
        <Text style={styles.emptyTitle}>Nothing Playing</Text>
        <Text style={styles.emptySub}>Choose a pattern from the library</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('Library')}
        >
          <LinearGradient colors={['#C9A84C', '#9A7230']} style={styles.emptyBtnGrad}>
            <Text style={styles.emptyBtnTxt}>Browse Patterns</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A0F', '#0F0F18']} style={StyleSheet.absoluteFill} />

      {/* Subtle LED glow at top */}
      {isPlaying && (
        <View style={[styles.topGlow, { backgroundColor: ledStr }]} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>NOW DRAWING</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LEDControl')}>
          <View style={[styles.ledPill, { backgroundColor: ledStr + '22', borderColor: ledStr + '44' }]}>
            <View style={[styles.ledDot, { backgroundColor: ledStr }]} />
            <Text style={[styles.ledTxt, { color: ledStr }]}>Lighting</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Visual — progress ring with sand art inside */}
      <View style={styles.ringWrap}>
        <SandRing progress={progress} ledColor={ledStr} isPlaying={isPlaying} />
        {/* Center info */}
        <View style={styles.ringCenter}>
          <Text style={styles.progressPct}>{progress}%</Text>
          <Text style={styles.progressLab}>complete</Text>
        </View>
      </View>

      {/* Pattern info */}
      <View style={styles.info}>
        <Text style={styles.patternName}>{currentPattern.name}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, {
            backgroundColor: isPlaying ? '#52C87A' : isPaused ? '#F0A500' : '#555',
          }]} />
          <Text style={styles.statusTxt}>
            {isPlaying ? 'Drawing' : isPaused ? 'Paused' : 'Stopped'}
          </Text>
          <Text style={styles.timeElapsed}>
            {formatTime(timeElapsed)}
            {timeRemaining > 0 ? ` / -${formatTime(timeRemaining)}` : ''}
          </Text>
        </View>
      </View>

      {/* Speed control */}
      <View style={styles.speedWrap}>
        <View style={styles.speedHeader}>
          <Ionicons name="speedometer-outline" size={14} color="#555" />
          <Text style={styles.speedLab}>Speed</Text>
          <Text style={styles.speedVal}>{localSpeed}%</Text>
        </View>
        <View style={styles.sliderTrack} {...speedPan.panHandlers}>
          {/* Filled */}
          <Animated.View style={[styles.sliderFill, {
            width: sliderVal,
            backgroundColor: Colors.primary,
          }]} />
          {/* Thumb */}
          <Animated.View style={[styles.sliderThumb, { left: sliderVal }]} />
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLab}>Slow</Text>
          <Text style={styles.sliderLab}>Fast</Text>
        </View>
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        {/* Stop */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleStop}>
          <View style={styles.sideBtnInner}>
            <Ionicons name="stop" size={20} color="#555" />
          </View>
          <Text style={styles.sideBtnLab}>Stop</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity style={styles.mainBtn} onPress={handlePause}>
          <LinearGradient colors={['#C9A84C', '#9A7230']} style={styles.mainBtnGrad}>
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={34} color="#0A0A0F"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Library */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => navigation.navigate('Library')}
        >
          <View style={styles.sideBtnInner}>
            <Ionicons name="library-outline" size={20} color="#555" />
          </View>
          <Text style={styles.sideBtnLab}>Library</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0A0A0F' },
  emptyRoot: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#3A3A4A' },
  emptySub:   { fontSize: 14, color: '#2A2A3A' },
  emptyBtn:   { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  emptyBtnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
  emptyBtnTxt:  { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },

  topGlow: {
    position: 'absolute', top: -100,
    left: -100, right: -100, height: 300,
    opacity: 0.06, borderRadius: 200,
  },
  header: {
    paddingTop: 58, paddingHorizontal: 22,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 2 },
  ledPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  ledDot: { width: 8, height: 8, borderRadius: 4 },
  ledTxt: { fontSize: 12, fontWeight: '600' },

  ringWrap: {
    alignItems: 'center', justifyContent: 'center',
    height: RING_SIZE, alignSelf: 'center',
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 36, fontWeight: '700', color: '#E8E8E8' },
  progressLab: { fontSize: 12, color: '#555', marginTop: 2 },

  info: { alignItems: 'center', marginTop: 20, marginBottom: 28, paddingHorizontal: 24 },
  patternName: { fontSize: 24, fontWeight: '700', color: '#F0F0F0', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusTxt: { fontSize: 13, color: '#666', fontWeight: '500' },
  timeElapsed: { fontSize: 12, color: '#444', marginLeft: 8 },

  // Speed slider
  speedWrap: { paddingHorizontal: 40, marginBottom: 32 },
  speedHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 12,
  },
  speedLab: { flex: 1, fontSize: 12, color: '#555' },
  speedVal: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  sliderTrack: {
    height: 5, backgroundColor: '#1A1A28',
    borderRadius: 3, position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute', left: 0,
    height: '100%', borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    top: -6.5, marginLeft: -9,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 6,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
  },
  sliderLab: { fontSize: 10, color: '#333' },

  // Controls
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 36,
  },
  sideBtn: { alignItems: 'center', gap: 6 },
  sideBtnInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#13131C',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1E1E2A',
  },
  sideBtnLab: { fontSize: 10, color: '#444' },
  mainBtn: { borderRadius: 44, overflow: 'hidden' },
  mainBtnGrad: {
    width: 88, height: 88,
    alignItems: 'center', justifyContent: 'center',
  },
});
