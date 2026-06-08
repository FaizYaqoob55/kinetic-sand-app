// src/screens/PatternDetailScreen.js — Premium Luxury Rebuild
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Alert, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Ellipse, G } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import { getDifficultyColor, formatDuration } from '../constants/patterns';
import FluidNCService from '../services/FluidNCService';
import { setPlaying, addToPlaylist } from '../store/tableSlice';
import { toggleFavorite } from '../store/patternSlice';
import { SandPreview } from '../components/SandPreview';
import HapticService from '../services/HapticService';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CONTENT_W = isWeb ? Math.min(width, 460) : width;

// ─── Hero Sand Preview ──────────────────────────────────────────────────────────
const HeroSandPreview = ({ patternId }) => {
  const s = CONTENT_W;
  const cx = s / 2, cy = s / 2;
  const gold = '#8A6A2C';
  const goldFaint = '#4A3A1C';

  const getArt = (id) => {
    if (id.startsWith('m')) return (
      <>
        {[88, 72, 56, 44, 32, 20, 10].map(r => (
          <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={gold} strokeWidth={r > 50 ? '0.7' : '0.9'} opacity={r > 60 ? '0.25' : '0.4'} />
        ))}
        {[0, 30, 60, 90, 120, 150].map(a => {
          const rad = (a * Math.PI) / 180;
          return <Line key={a} x1={cx - Math.cos(rad) * 88} y1={cy - Math.sin(rad) * 88}
            x2={cx + Math.cos(rad) * 88} y2={cy + Math.sin(rad) * 88} stroke={goldFaint} strokeWidth="0.6" opacity="0.35" />;
        })}
        {[60, 46, 30].map(r => (
          <Circle key={`i${r}`} cx={cx} cy={cy} r={r} fill="none" stroke={`${gold}80`} strokeWidth="0.5" strokeDasharray="4 6" />
        ))}
      </>
    );
    if (id.startsWith('g')) return (
      <>
        <Path d={`M${cx},${cy-80} L${cx+69},${cy-40} L${cx+69},${cy+40} L${cx},${cy+80} L${cx-69},${cy+40} L${cx-69},${cy-40} Z`} fill="none" stroke={gold} strokeWidth="1" opacity="0.4" />
        <Path d={`M${cx},${cy-56} L${cx+48},${cy-28} L${cx+48},${cy+28} L${cx},${cy+56} L${cx-48},${cy+28} L${cx-48},${cy-28} Z`} fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
        <Path d={`M${cx},${cy-34} L${cx+29},${cy-17} L${cx+29},${cy+17} L${cx},${cy+34} L${cx-29},${cy+17} L${cx-29},${cy-17} Z`} fill="none" stroke={gold} strokeWidth="0.7" opacity="0.6" />
        <Path d={`M${cx},${cy-14} L${cx+12},${cy-7} L${cx+12},${cy+7} L${cx},${cy+14} L${cx-12},${cy+7} L${cx-12},${cy-7} Z`} fill="none" stroke={gold} strokeWidth="0.9" opacity="0.7" />
        {[0, 60, 120].map(a => {
          const rad = (a * Math.PI) / 180;
          return <Line key={a} x1={cx} y1={cy} x2={cx + Math.cos(rad) * 80} y2={cy + Math.sin(rad) * 80} stroke={goldFaint} strokeWidth="0.5" opacity="0.3" />;
        })}
      </>
    );
    if (id.startsWith('n')) return (
      <>
        {[90, 78, 66, 54, 42, 30, 18, 8].map(r => (
          <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={gold} strokeWidth="0.8"
            opacity={0.15 + (90 - r) / 90 * 0.45} />
        ))}
        <Line x1={cx} y1={cy - 90} x2={cx} y2={cy + 90} stroke={goldFaint} strokeWidth="0.5" opacity="0.25" />
        <Line x1={cx - 90} y1={cy} x2={cx + 90} y2={cy} stroke={goldFaint} strokeWidth="0.5" opacity="0.25" />
      </>
    );
    if (id.startsWith('s')) return (
      <>
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 8;
          const r = 10 + t * 76;
          const angle = t * Math.PI * 4;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          return <Circle key={i} cx={x} cy={y} r={3 + i * 0.8} fill="none" stroke={gold} strokeWidth="0.8" opacity={0.3 + t * 0.5} />;
        })}
        {Array.from({ length: 60 }).map((_, i) => {
          const t = i / 60;
          const r = 10 + t * 76;
          const angle = t * Math.PI * 4;
          const nx = cx + Math.cos(angle) * r;
          const ny = cy + Math.sin(angle) * r;
          const nr = 10 + (t + 0.016) * 76;
          const nangle = (t + 0.016) * Math.PI * 4;
          const nx2 = cx + Math.cos(nangle) * nr;
          const ny2 = cy + Math.sin(nangle) * nr;
          return <Line key={i} x1={nx} y1={ny} x2={nx2} y2={ny2} stroke={gold} strokeWidth="0.9" opacity={0.2 + t * 0.4} />;
        })}
      </>
    );
    // default — concentric with star burst
    return (
      <>
        {[88, 70, 54, 40, 28, 16, 6].map(r => (
          <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={gold} strokeWidth="0.8"
            opacity={0.15 + (88 - r) / 88 * 0.5} />
        ))}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map(a => {
          const rad = (a * Math.PI) / 180;
          return <Line key={a} x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * 88} y2={cy + Math.sin(rad) * 88}
            stroke={goldFaint} strokeWidth="0.6" opacity="0.3" />;
        })}
      </>
    );
  };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {getArt(patternId)}
    </Svg>
  );
};

// ─── Animated Wave Bars ─────────────────────────────────────────────────────────
const WaveAnimation = () => {
  const anims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.6),
    new Animated.Value(1),
    new Animated.Value(0.6),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400 + i * 80, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 400 + i * 80, useNativeDriver: true }),
        ])
      );
      setTimeout(() => loop.start(), i * 120);
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 20 }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 18,
            borderRadius: 2,
            backgroundColor: Colors.primary,
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function PatternDetailScreen({ navigation, route }) {
  const { pattern } = route.params;
  const dispatch = useDispatch();
  const { isConnected, currentPattern, isPlaying } = useSelector(s => s.table);
  const { favorites } = useSelector(s => s.pattern);
  const isFav = favorites.includes(pattern.id);
  const isCurrentlyPlaying = isPlaying && currentPattern?.id === pattern.id;

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();

    // Subtle glow pulse on preview
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePlay = async () => {
    HapticService.medium();
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your SandTable first.', [
        { text: 'Connect', onPress: () => { HapticService.light(); navigation.navigate('Connect'); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      dispatch(setPlaying(pattern));
      await FluidNCService.runPattern(pattern.file);
      navigation.navigate('NowPlaying');
    } catch {
      HapticService.error();
      Alert.alert('Error', 'Could not start pattern.');
    }
  };

  const handleAddPlaylist = () => {
    HapticService.success();
    dispatch(addToPlaylist(pattern));
    Alert.alert('Added', `"${pattern.name}" added to playlist.`);
  };

  const diffColor = getDifficultyColor(pattern.difficulty);
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });

  return (
    <View style={styles.root}>
      {/* Deep background */}
      <LinearGradient
        colors={['#06060C', '#0C0C16', '#0A0A12']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow behind art */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />

      {/* ── HERO ART AREA ── */}
      <Animated.View style={[styles.heroArea, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Outer decorative rings */}
        <View style={styles.outerRing1} />
        <View style={styles.outerRing2} />
        <View style={styles.outerRing3} />

        {/* The sand art SVG */}
        <HeroSandPreview patternId={pattern.id} />

        {/* Radial gradient fade at bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(6,6,12,0.55)', 'rgba(6,6,12,0.97)', '#06060C']}
          style={styles.heroFade}
          pointerEvents="none"
        />
      </Animated.View>

      {/* ── TOP NAV ── */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => { HapticService.light(); navigation.goBack(); }}
        >
          <Ionicons name="chevron-back" size={20} color="#D0D0D0" />
        </TouchableOpacity>

        <View style={styles.navRight}>
          {isCurrentlyPlaying && (
            <View style={styles.nowPlayingPill}>
              <WaveAnimation />
              <Text style={styles.nowPlayingLabel}>Playing</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.navBtn, isFav && styles.navBtnFav]}
            onPress={() => { HapticService.light(); dispatch(toggleFavorite(pattern.id)); }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? '#E05A5A' : '#888'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── INFO SHEET (slides up) ── */}
      <Animated.View style={[
        styles.infoSheet,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Handle bar */}
          <View style={styles.sheetHandle} />

          {/* Title + Category */}
          <View style={styles.titleBlock}>
            {pattern.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeTxt}>NEW</Text>
              </View>
            )}
            <Text style={styles.patternName}>{pattern.name}</Text>
            <View style={styles.categoryRow}>
              <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
              <Text style={styles.categoryText}>{pattern.category}  ·  {pattern.difficulty}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.desc}>{pattern.description}</Text>

          {/* Stats cards row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.statVal}>{formatDuration(pattern.duration)}</Text>
              <Text style={styles.statLab}>Duration</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: `${diffColor}18` }]}>
                <View style={[styles.diffDotLg, { backgroundColor: diffColor }]} />
              </View>
              <Text style={styles.statVal}>{pattern.difficulty}</Text>
              <Text style={styles.statLab}>Complexity</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <Ionicons name="layers-outline" size={18} color="#6A8AFF" />
              </View>
              <Text style={styles.statVal}>{pattern.category}</Text>
              <Text style={styles.statLab}>Style</Text>
            </View>
          </View>

          {/* Tip card */}
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={14} color={Colors.primary} />
            </View>
            <Text style={styles.tipText}>
              Each run creates a unique sand texture. Try different LED colors to complement the pattern's mood.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddPlaylist}>
              <Ionicons name="add-circle-outline" size={18} color="#6A8AFF" />
              <Text style={styles.addBtnTxt}>Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playBtn, !isConnected && styles.playBtnDisabled]}
              onPress={handlePlay}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isCurrentlyPlaying ? ['#2E7D32', '#1B5E20'] : ['#C9A84C', '#9A7230']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.playBtnGrad}
              >
                <Ionicons
                  name={isCurrentlyPlaying ? 'stop' : 'play'}
                  size={20}
                  color="#0A0A0F"
                />
                <Text style={styles.playBtnTxt}>
                  {isCurrentlyPlaying ? 'Stop' : 'Play Now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────
const CONTENT_H = isWeb ? Math.min(height, 900) : height;
const HERO_H = CONTENT_H * 0.52;
const SHEET_TOP = CONTENT_H * 0.42;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06060C',
  },

  ambientGlow: {
    position: 'absolute',
    top: HERO_H * 0.1,
    left: CONTENT_W * 0.1,
    width: CONTENT_W * 0.8,
    height: HERO_H * 0.8,
    borderRadius: CONTENT_W * 0.4,
    backgroundColor: Colors.primary,
    zIndex: 0,
  },

  // ── Hero ──
  heroArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CONTENT_W,
    height: HERO_H + 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  outerRing1: {
    position: 'absolute',
    width: CONTENT_W * 0.9,
    height: CONTENT_W * 0.9,
    borderRadius: CONTENT_W * 0.45,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.06)',
  },
  outerRing2: {
    position: 'absolute',
    width: CONTENT_W * 1.1,
    height: CONTENT_W * 1.1,
    borderRadius: CONTENT_W * 0.55,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.04)',
  },
  outerRing3: {
    position: 'absolute',
    width: CONTENT_W * 1.3,
    height: CONTENT_W * 1.3,
    borderRadius: CONTENT_W * 0.65,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.025)',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_H * 0.55,
  },

  // ── Top Nav ──
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 18,
    zIndex: 10,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,30,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnFav: {
    borderColor: 'rgba(224,90,90,0.35)',
    backgroundColor: 'rgba(224,90,90,0.1)',
  },
  nowPlayingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,20,30,0.80)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  nowPlayingLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Info Sheet ──
  infoSheet: {
    position: 'absolute',
    top: SHEET_TOP,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,8,14,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 22,
    zIndex: 5,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  // ── Title ──
  titleBlock: {
    marginBottom: 10,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  newBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A0A0F',
    letterSpacing: 1.2,
  },
  patternName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F4F4F4',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // ── Description ──
  desc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 22,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F0F1A',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDiv: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffDotLg: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4D4D4',
    textTransform: 'capitalize',
  },
  statLab: {
    fontSize: 10,
    color: '#444',
    fontWeight: '500',
  },

  // ── Tip ──
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: `${Colors.primary}0A`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}1A`,
    marginBottom: 22,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(106,138,255,0.08)',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(106,138,255,0.18)',
  },
  addBtnTxt: {
    color: '#6A8AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  playBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  playBtnTxt: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
