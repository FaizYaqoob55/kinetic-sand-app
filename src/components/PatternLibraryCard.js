// Premium pattern cards — library screen
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { SandPreview } from './SandPreview';
import Colors from '../constants/colors';
import { getDifficultyColor, formatDuration } from '../constants/patterns';

const CATEGORY_PALETTE = {
  featured:  { bg: ['#221C12', '#100E0A'], glow: 'rgba(201,168,76,0.35)', accent: '#C9A84C' },
  geometric: { bg: ['#121A28', '#080C14'], glow: 'rgba(76,158,255,0.28)', accent: '#4C9EFF' },
  nature:    { bg: ['#0E1A14', '#060E0A'], glow: 'rgba(76,175,130,0.28)', accent: '#4CAF82' },
  mandala:   { bg: ['#18141E', '#0A0810'], glow: 'rgba(180,140,255,0.24)', accent: '#B48CFF' },
  abstract:  { bg: ['#16141A', '#0A080C'], glow: 'rgba(201,168,76,0.2)', accent: '#C9A84C' },
  animals:   { bg: ['#1A1410', '#0C0A08'], glow: 'rgba(255,167,38,0.24)', accent: '#FFA726' },
  space:     { bg: ['#0E1018', '#060810'], glow: 'rgba(120,140,255,0.26)', accent: '#788CFF' },
  zen:       { bg: ['#0E1614', '#060C0A'], glow: 'rgba(120,200,180,0.22)', accent: '#78C8B4' },
  maze:      { bg: ['#161410', '#0A0808'], glow: 'rgba(201,168,76,0.18)', accent: '#C9A84C' },
  fractal:   { bg: ['#141018', '#08060C'], glow: 'rgba(160,120,255,0.22)', accent: '#A078FF' },
};

const paletteFor = (category) => CATEGORY_PALETTE[category] || CATEGORY_PALETTE.featured;

const SandRings = ({ size, color = 'rgba(255,255,255,0.04)' }) => (
  <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
    {[0.42, 0.32, 0.22, 0.12].map((r, i) => (
      <Circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={size * r}
        stroke={color}
        strokeWidth={0.8}
        fill="none"
      />
    ))}
  </Svg>
);

export const PatternCanvas = ({ pattern, size, showGlow = true, intense = false }) => {
  const palette = paletteFor(pattern.category);
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!showGlow) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.75, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, showGlow]);

  return (
    <View style={[styles.canvas, { width: size, height: size }]}>
      <LinearGradient colors={palette.bg} style={StyleSheet.absoluteFill} />
      <SandRings size={size} color={`${palette.accent}18`} />

      {showGlow && (
        <Animated.View
          style={[
            styles.glowOrb,
            {
              backgroundColor: palette.glow,
              opacity: intense ? pulse : 0.75,
              transform: [{ scale: pulse }],
            },
          ]}
        />
      )}

      <View style={styles.metalBall}>
        <LinearGradient
          colors={['#F0D080', '#C9A84C', '#7A5E20']}
          style={styles.metalBallGrad}
        />
      </View>

      <View style={styles.previewCenter}>
        <SandPreview patternId={pattern.id} size={size * (intense ? 0.78 : 0.7)} />
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.72)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
};

const WaveBars = ({ color = Colors.primary, tall = false }) => {
  const bars = useRef([0.35, 0.9, 0.5, 1, 0.45].map(v => new Animated.Value(v))).current;

  useEffect(() => {
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: 300 + i * 55, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2, duration: 300 + i * 55, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [bars]);

  return (
    <View style={styles.waveRow}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            { height: tall ? 14 : 11, backgroundColor: color, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
};

const DifficultyPill = ({ difficulty, compact }) => (
  <View style={[styles.diffPill, compact && styles.diffPillCompact, { borderColor: `${getDifficultyColor(difficulty)}44` }]}>
    <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(difficulty) }]} />
    <Text style={[styles.diffText, { color: getDifficultyColor(difficulty) }]}>
      {difficulty}
    </Text>
  </View>
);

export const HeroSpotlight = ({ pattern, isPlaying, onPress, onPlay }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const height = 220;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [shimmer]);

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-200, 400] });

  return (
    <Pressable onPress={onPress} style={styles.heroWrap}>
      <View style={[styles.heroCard, { height }]}>
        <PatternCanvas pattern={pattern} size={400} showGlow intense />

        <Animated.View style={[styles.heroShimmer, { transform: [{ translateX: shimmerX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {isPlaying && (
          <View style={styles.heroLive}>
            <View style={styles.heroLiveDot} />
            <Text style={styles.heroLiveText}>NOW PLAYING</Text>
            <WaveBars color="#1A1208" tall />
          </View>
        )}

        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={10} color="#1A1208" />
            <Text style={styles.heroBadgeText}>Spotlight</Text>
          </View>
          <Text style={styles.heroTitle}>{pattern.name}</Text>
          <Text style={styles.heroDesc} numberOfLines={2}>{pattern.description}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroDuration}>{formatDuration(pattern.duration)}</Text>
            <DifficultyPill difficulty={pattern.difficulty} compact />
          </View>
        </View>

        <Pressable
          style={styles.heroPlayBtn}
          onPress={(e) => {
            e?.stopPropagation?.();
            onPlay();
          }}
        >
          <LinearGradient colors={['#F0D080', '#C9A84C', '#A07830']} style={styles.heroPlayGrad}>
            <Ionicons name="play" size={22} color="#1A1208" style={{ marginLeft: 3 }} />
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );
};

export const FeaturedPatternCard = ({
  pattern,
  width,
  height,
  isActive,
  isPlaying,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }], width, marginRight: 14 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start()}
      >
        <View style={[styles.featuredCard, { height }, isActive && styles.featuredCardActive]}>
          <PatternCanvas pattern={pattern} size={width} showGlow />

          {isPlaying && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          {pattern.isNew && !isPlaying && (
            <LinearGradient colors={Colors.gradientPrimary} style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          )}

          <View style={styles.featuredPlay}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.featuredPlayGrad}>
              <Ionicons name="play" size={18} color="#1A1208" style={{ marginLeft: 2 }} />
            </LinearGradient>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.featuredFooter}
          >
            <Text style={styles.featuredTitle} numberOfLines={1}>{pattern.name}</Text>
            <View style={styles.featuredMeta}>
              {isPlaying ? <WaveBars /> : null}
              <Text style={styles.featuredDuration}>{formatDuration(pattern.duration)}</Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const GridPatternCard = ({
  pattern,
  width,
  isFavorite,
  isPlaying,
  onPress,
  onToggleFavorite,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const palette = paletteFor(pattern.category);
  const imageH = width * 1.28;

  const handleFav = (e) => {
    e?.stopPropagation?.();
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onToggleFavorite();
  };

  return (
    <Animated.View style={[styles.gridWrap, { width, transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      >
        <View style={[styles.gridCard, isPlaying && styles.gridCardActive]}>
          <View style={[styles.gridImage, { height: imageH }]}>
            <PatternCanvas pattern={pattern} size={width} />

            <View style={[styles.catBadge, { borderColor: `${palette.accent}55` }]}>
              <Text style={[styles.catBadgeText, { color: palette.accent }]}>
                {pattern.category}
              </Text>
            </View>

            {isPlaying && (
              <View style={styles.gridLive}>
                <WaveBars color={Colors.primary} />
              </View>
            )}

            <View style={styles.gridPlay}>
              <LinearGradient colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)']} style={styles.gridPlayGrad}>
                <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
              </LinearGradient>
            </View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.88)']}
              style={styles.gridOverlay}
            >
              <Text style={styles.gridTitle} numberOfLines={1}>{pattern.name}</Text>
              <View style={styles.gridMeta}>
                <View style={styles.gridMetaLeft}>
                  <Ionicons name="time-outline" size={12} color={Colors.primaryLight} />
                  <Text style={styles.gridDuration}>{formatDuration(pattern.duration)}</Text>
                  <DifficultyPill difficulty={pattern.difficulty} compact />
                </View>
                <Pressable onPress={handleFav} hitSlop={12}>
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={18}
                      color={isFavorite ? '#FF6B8A' : 'rgba(255,255,255,0.7)'}
                    />
                  </Animated.View>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const NowPlayingBanner = ({ pattern, progress = 0, onPress }) => {
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, [glow]);

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <Animated.View style={[styles.bannerGlow, { opacity: glow }]} />
      <LinearGradient
        colors={['rgba(201,168,76,0.22)', 'rgba(201,168,76,0.04)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bannerPreview}>
        <PatternCanvas pattern={pattern} size={52} showGlow={false} />
      </View>
      <View style={styles.bannerInfo}>
        <View style={styles.bannerLabelRow}>
          <View style={styles.bannerLiveDot} />
          <Text style={styles.bannerLabel}>Now Playing</Text>
        </View>
        <Text style={styles.bannerTitle} numberOfLines={1}>{pattern.name}</Text>
        <View style={styles.bannerProgressTrack}>
          <View style={[styles.bannerProgressFill, { width: `${Math.min(100, progress)}%` }]} />
        </View>
      </View>
      <WaveBars />
      <View style={styles.bannerArrow}>
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
};

export const StatChip = ({ icon, value, label, active, onPress }) => (
  <Pressable
    style={[styles.statChip, active && styles.statChipActive]}
    onPress={onPress}
  >
    <View style={[styles.statIcon, active && styles.statIconActive]}>
      <Ionicons name={icon} size={15} color={active ? '#1A1208' : Colors.primary} />
    </View>
    <Text style={[styles.statValue, active && styles.statValueActive]}>{value}</Text>
    <Text style={[styles.statLabel, active && styles.statLabelActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  canvas: { overflow: 'hidden', backgroundColor: Colors.backgroundCard },
  glowOrb: {
    position: 'absolute',
    alignSelf: 'center',
    top: '24%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
  },
  metalBall: {
    position: 'absolute',
    alignSelf: 'center',
    top: '36%',
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  metalBallGrad: { flex: 1 },
  previewCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  heroWrap: { marginBottom: 22 },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: Colors.backgroundCard,
  },
  heroShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    zIndex: 4,
  },
  heroLive: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 5,
  },
  heroLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A1208' },
  heroLiveText: { fontSize: 9, fontWeight: '900', color: '#1A1208', letterSpacing: 0.8 },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    zIndex: 3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1208', letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 4 },
  heroDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17, marginBottom: 10, maxWidth: '72%' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDuration: { fontSize: 13, fontWeight: '700', color: Colors.primaryLight },
  heroPlayBtn: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    zIndex: 5,
  },
  heroPlayGrad: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },

  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredCardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    zIndex: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '800', color: Colors.primaryLight, letterSpacing: 1 },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 5,
  },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1208', letterSpacing: 0.6 },
  featuredPlay: { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 4 },
  featuredPlayGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  featuredFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 50,
    zIndex: 3,
  },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredDuration: { fontSize: 12, fontWeight: '600', color: Colors.primaryLight },

  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 2.5, borderRadius: 2 },

  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  diffPillCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  diffDot: { width: 5, height: 5, borderRadius: 2.5 },
  diffText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },

  gridWrap: { marginBottom: 14 },
  gridCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridCardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  gridImage: { overflow: 'hidden', position: 'relative' },
  catBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
  },
  catBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  gridLive: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  gridPlay: { position: 'absolute', alignSelf: 'center', top: '38%', zIndex: 3 },
  gridPlayGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 36,
    zIndex: 2,
  },
  gridTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 8 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  gridDuration: { fontSize: 11, fontWeight: '600', color: Colors.primaryLight },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    padding: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: Colors.backgroundCard,
  },
  bannerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
  },
  bannerPreview: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  bannerInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  bannerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bannerLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  bannerLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 0.8, textTransform: 'uppercase' },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  bannerProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  bannerProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  bannerArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconActive: { backgroundColor: 'rgba(26,18,8,0.15)' },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statValueActive: { color: '#1A1208' },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.textTertiary, marginTop: 2 },
  statLabelActive: { color: 'rgba(26,18,8,0.65)' },
});
