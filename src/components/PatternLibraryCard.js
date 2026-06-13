// Premium pattern cards — library screen v3
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { SandPreview } from './SandPreview';
import { RemotePatternPreview } from './RemotePatternPreview';
import { getDifficultyColor, formatDuration } from '../constants/patterns';

const AMBER = '#F0A030';
const AMBER_BRIGHT = '#FFB84D';
const AMBER_DARK = '#C07A20';
const AMBER_MUTED = '#B8864A';
const TEXT_MUTED = '#9A8070';
const CARD = '#0D0D0D';
const CARD_BORDER = '#1E1E1E';
const AMBER_GRAD = ['#FFB84D', AMBER, AMBER_DARK];
const AMBER_GLOW = 'rgba(240,160,48,0.12)';

const CATEGORY_PALETTE = {
  featured:  { bg: ['#1A1408', '#0A0804'], glow: 'rgba(240,160,48,0.32)', accent: AMBER },
  geometric: { bg: ['#141210', '#0A0A08'], glow: 'rgba(240,160,48,0.18)', accent: AMBER_MUTED },
  nature:    { bg: ['#101410', '#080A08'], glow: 'rgba(180,140,80,0.22)', accent: '#B8A060' },
  mandala:   { bg: ['#141210', '#0A0A08'], glow: 'rgba(240,160,48,0.16)', accent: AMBER_MUTED },
  abstract:  { bg: ['#141210', '#0A0A08'], glow: 'rgba(240,160,48,0.2)', accent: AMBER },
  animals:   { bg: ['#141008', '#0A0806'], glow: 'rgba(240,160,48,0.18)', accent: '#D4A050' },
  space:     { bg: ['#101014', '#08080A'], glow: 'rgba(200,180,120,0.16)', accent: '#C8B878' },
  zen:       { bg: ['#101412', '#080A0A'], glow: 'rgba(180,160,100,0.16)', accent: '#B8A868' },
  maze:      { bg: ['#141210', '#0A0A08'], glow: 'rgba(240,160,48,0.16)', accent: AMBER_MUTED },
  fractal:   { bg: ['#141012', '#0A080A'], glow: 'rgba(240,160,48,0.14)', accent: AMBER_MUTED },
};

const paletteFor = (category) => CATEGORY_PALETTE[category] || CATEGORY_PALETTE.featured;

const SandRings = ({ size, color = 'rgba(255,255,255,0.04)' }) => (
  <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
    {[0.44, 0.34, 0.24, 0.14].map((r, i) => (
      <Circle key={i} cx={size / 2} cy={size / 2} r={size * r} stroke={color} strokeWidth={0.7} fill="none" />
    ))}
  </Svg>
);

const RadialGlow = ({ size, color }) => (
  <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id="glow" cx="50%" cy="40%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect width={size} height={size} fill="url(#glow)" />
  </Svg>
);

export const PatternCanvas = ({ pattern, size, showGlow = true, intense = false }) => {
  const palette = paletteFor(pattern.category);
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!showGlow) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, showGlow]);

  return (
    <View style={[styles.canvas, { width: size, height: size }]}>
      <LinearGradient colors={palette.bg} style={StyleSheet.absoluteFill} />
      <RadialGlow size={size} color={palette.accent} />
      <SandRings size={size} color={`${palette.accent}20`} />

      {showGlow && (
        <Animated.View
          style={[styles.glowOrb, { backgroundColor: palette.glow, opacity: intense ? pulse : 0.8, transform: [{ scale: pulse }] }]}
        />
      )}

      <View style={styles.metalBall}>
        <LinearGradient colors={['#FFE8A0', AMBER, AMBER_DARK]} style={styles.metalBallGrad} />
        <View style={styles.metalBallShine} />
      </View>

      <View style={styles.previewCenter}>
        {pattern.isRemote ? (
          <RemotePatternPreview pattern={pattern} size={size * (intense ? 0.8 : 0.72)} />
        ) : (
          <SandPreview patternId={pattern.id} size={size * (intense ? 0.8 : 0.72)} />
        )}
      </View>

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
};

const WaveBars = ({ color = AMBER, tall = false }) => {
  const bars = useRef([0.35, 0.9, 0.5, 1, 0.45].map(v => new Animated.Value(v))).current;

  useEffect(() => {
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: 280 + i * 50, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2, duration: 280 + i * 50, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [bars]);

  return (
    <View style={styles.waveRow}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[styles.waveBar, { height: tall ? 14 : 10, backgroundColor: color, transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
};

const DifficultyPill = ({ difficulty, compact }) => (
  <View style={[styles.diffPill, compact && styles.diffPillCompact, { borderColor: `${getDifficultyColor(difficulty)}50` }]}>
    <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(difficulty) }]} />
    <Text style={[styles.diffText, { color: getDifficultyColor(difficulty) }]}>{difficulty}</Text>
  </View>
);

export const HeroCarousel = ({
  patterns,
  cardWidth,
  cardHeight,
  activeIndex,
  onIndexChange,
  currentPatternId,
  isPlaying,
  onPress,
  onPlay,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.carouselWrap}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12}
        contentContainerStyle={{ gap: 12 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12));
          onIndexChange(idx);
        }}
      >
        {patterns.map((pattern, i) => {
          const inputRange = [(i - 1) * (cardWidth + 12), i * (cardWidth + 12), (i + 1) * (cardWidth + 12)];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.65, 1, 0.65], extrapolate: 'clamp' });
          const isLive = isPlaying && currentPatternId === pattern.id;

          return (
            <Animated.View key={pattern.id} style={{ width: cardWidth, transform: [{ scale }], opacity }}>
              <Pressable onPress={() => onPress(pattern)}>
                <View style={[styles.heroCard, { height: cardHeight }]}>
                  <PatternCanvas pattern={pattern} size={cardWidth} showGlow intense />

                  {isLive && (
                    <View style={styles.heroLive}>
                      <View style={styles.heroLiveDot} />
                      <Text style={styles.heroLiveText}>LIVE</Text>
                      <WaveBars color="#1A1208" tall />
                    </View>
                  )}

                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroFooter}>
                    <View style={styles.heroBadge}>
                      <Ionicons name="diamond" size={9} color="#1A1208" />
                      <Text style={styles.heroBadgeText}>Featured</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={1}>{pattern.name}</Text>
                    <Text style={styles.heroDesc} numberOfLines={2}>{pattern.description}</Text>
                    <View style={styles.heroMeta}>
                      <Text style={styles.heroDuration}>{formatDuration(pattern.duration)}</Text>
                      <DifficultyPill difficulty={pattern.difficulty} compact />
                    </View>
                  </LinearGradient>

                  <Pressable style={styles.heroPlayBtn} onPress={() => onPlay(pattern)}>
                    <LinearGradient colors={AMBER_GRAD} style={styles.heroPlayGrad}>
                      <Ionicons name="play" size={24} color="#1A1208" style={{ marginLeft: 3 }} />
                    </LinearGradient>
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {patterns.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

export const FeaturedPatternCard = ({ pattern, width, height, isActive, isPlaying, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], width, marginRight: 12 }}>
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
            <LinearGradient colors={AMBER_GRAD} style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          )}
          <View style={styles.featuredPlay}>
            <LinearGradient colors={AMBER_GRAD} style={styles.featuredPlayGrad}>
              <Ionicons name="play" size={16} color="#1A1208" style={{ marginLeft: 2 }} />
            </LinearGradient>
          </View>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.featuredFooter}>
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
  pattern, width, isFavorite, isPlaying, onPress, onToggleFavorite, tall = false, rank,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const palette = paletteFor(pattern.category);
  const imageH = width * (tall ? 1.48 : 1.22);

  const handleFav = () => {
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
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
      >
        <View style={[styles.gridCard, isPlaying && styles.gridCardActive]}>
          <View style={[styles.gridImage, { height: imageH }]}>
            <PatternCanvas pattern={pattern} size={width} />
            {rank != null && rank <= 3 && (
              <LinearGradient colors={rank === 1 ? AMBER_GRAD : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.08)']} style={styles.rankBadge}>
                <Text style={[styles.rankText, rank === 1 && { color: '#1A1208' }]}>#{rank}</Text>
              </LinearGradient>
            )}
            <View style={[styles.catBadge, { borderColor: `${palette.accent}50` }]}>
              <Text style={[styles.catBadgeText, { color: palette.accent }]}>{pattern.category}</Text>
            </View>
            {isPlaying && <View style={styles.gridLive}><WaveBars color={AMBER} /></View>}
            <View style={styles.gridPlay}>
              <LinearGradient colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.1)']} style={styles.gridPlayGrad}>
                <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
              </LinearGradient>
            </View>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.92)']} style={styles.gridOverlay}>
              <Text style={styles.gridTitle} numberOfLines={1}>{pattern.name}</Text>
              <View style={styles.gridMeta}>
                <View style={styles.gridMetaLeft}>
                  <Ionicons name="time-outline" size={11} color={AMBER_MUTED} />
                  <Text style={styles.gridDuration}>{formatDuration(pattern.duration)}</Text>
                  <DifficultyPill difficulty={pattern.difficulty} compact />
                </View>
                <Pressable onPress={handleFav} hitSlop={12}>
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF6B8A' : 'rgba(255,255,255,0.75)'} />
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

export const ListPatternRow = ({ pattern, index, isFavorite, isPlaying, onPress, onToggleFavorite }) => {
  const palette = paletteFor(pattern.category);
  return (
    <Pressable onPress={onPress} style={[styles.listRow, isPlaying && styles.listRowActive]}>
      <Text style={styles.listRank}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={[styles.listThumb, { borderColor: `${palette.accent}35` }]}>
        <PatternCanvas pattern={pattern} size={64} showGlow={false} />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>{pattern.name}</Text>
        <Text style={styles.listSub} numberOfLines={1}>{pattern.description}</Text>
        <View style={styles.listMeta}>
          <Text style={[styles.listCat, { color: palette.accent }]}>{pattern.category}</Text>
          <Text style={styles.listDot}>·</Text>
          <Text style={styles.listDur}>{formatDuration(pattern.duration)}</Text>
        </View>
      </View>
      {isPlaying && <WaveBars />}
      <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.listHeart}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#FF6B8A' : TEXT_MUTED} />
      </Pressable>
      <View style={styles.listPlay}>
        <Ionicons name="play" size={14} color="#1A1208" style={{ marginLeft: 2 }} />
      </View>
    </Pressable>
  );
};

export const NowPlayingBanner = ({ pattern, progress = 0, onPress }) => {
  const glow = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [glow]);

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <Animated.View style={[styles.bannerGlow, { opacity: glow }]} />
      <LinearGradient colors={['rgba(240,160,48,0.2)', 'rgba(240,160,48,0.04)']} style={StyleSheet.absoluteFill} />
      <View style={styles.bannerPreview}><PatternCanvas pattern={pattern} size={54} showGlow={false} /></View>
      <View style={styles.bannerInfo}>
        <View style={styles.bannerLabelRow}>
          <View style={styles.bannerLiveDot} />
          <Text style={styles.bannerLabel}>Now Playing</Text>
        </View>
        <Text style={styles.bannerTitle} numberOfLines={1}>{pattern.name}</Text>
        <View style={styles.bannerProgressTrack}>
          <LinearGradient colors={AMBER_GRAD} style={[styles.bannerProgressFill, { width: `${Math.min(100, progress)}%` }]} />
        </View>
      </View>
      <WaveBars />
      <View style={styles.bannerArrow}><Ionicons name="chevron-forward" size={16} color={AMBER} /></View>
    </Pressable>
  );
};

export const StatChip = ({ icon, value, label, active, onPress }) => (
  <Pressable style={[styles.statChip, active && styles.statChipActive]} onPress={onPress}>
    <LinearGradient colors={active ? AMBER_GRAD : [AMBER_GLOW, 'rgba(240,160,48,0.03)']} style={styles.statIcon}>
      <Ionicons name={icon} size={15} color={active ? '#1A1208' : AMBER} />
    </LinearGradient>
    <Text style={[styles.statValue, active && styles.statValueActive]}>{value}</Text>
    <Text style={[styles.statLabel, active && styles.statLabelActive]}>{label}</Text>
  </Pressable>
);

export const ViewToggle = ({ mode, onChange }) => (
  <View style={styles.viewToggle}>
    {[{ id: 'grid', icon: 'grid' }, { id: 'list', icon: 'list' }].map(opt => (
      <Pressable
        key={opt.id}
        style={[styles.viewBtn, mode === opt.id && styles.viewBtnActive]}
        onPress={() => onChange(opt.id)}
      >
        <Ionicons name={opt.icon} size={16} color={mode === opt.id ? '#1A1208' : TEXT_MUTED} />
      </Pressable>
    ))}
  </View>
);

export const StickyGlassBar = ({ opacity, top, title, count, onSearch }) => (
  <Animated.View style={[styles.stickyBar, { top, opacity }]} pointerEvents="box-none">
    {Platform.OS === 'ios' ? (
      <BlurView intensity={55} tint="dark" style={styles.stickyBlur}>
        <View style={styles.stickyInner}>
          <View>
            <Text style={styles.stickyTitle}>{title}</Text>
            <Text style={styles.stickyCount}>{count} patterns</Text>
          </View>
          <Pressable style={styles.stickySearchBtn} onPress={onSearch}>
            <Ionicons name="search" size={18} color={AMBER} />
          </Pressable>
        </View>
      </BlurView>
    ) : (
      <View style={[styles.stickyBlur, { backgroundColor: 'rgba(0,0,0,0.94)' }]}>
        <View style={styles.stickyInner}>
          <View>
            <Text style={styles.stickyTitle}>{title}</Text>
            <Text style={styles.stickyCount}>{count} patterns</Text>
          </View>
          <Pressable style={styles.stickySearchBtn} onPress={onSearch}>
            <Ionicons name="search" size={18} color={AMBER} />
          </Pressable>
        </View>
      </View>
    )}
  </Animated.View>
);

export const FadeIn = ({ children, index = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: Math.min(index * 50, 300), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: Math.min(index * 50, 300), useNativeDriver: true, friction: 9 }),
    ]).start();
  }, [index, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  canvas: { overflow: 'hidden', backgroundColor: CARD },
  glowOrb: { position: 'absolute', alignSelf: 'center', top: '22%', width: '52%', height: '52%', borderRadius: 999 },
  metalBall: {
    position: 'absolute', alignSelf: 'center', top: '35%', width: 24, height: 24, borderRadius: 12,
    overflow: 'hidden', zIndex: 2, shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5,
  },
  metalBallGrad: { flex: 1 },
  metalBallShine: { position: 'absolute', top: 3, left: 5, width: 8, height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  previewCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  carouselWrap: { marginBottom: 8 },
  heroCard: { borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,160,48,0.3)', backgroundColor: CARD },
  heroLive: {
    position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: AMBER, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, zIndex: 5,
  },
  heroLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A1208' },
  heroLiveText: { fontSize: 9, fontWeight: '900', color: '#1A1208', letterSpacing: 0.8 },
  heroFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingTop: 60, zIndex: 3 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: AMBER, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1208', letterSpacing: 0.5 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 4 },
  heroDesc: { fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 17, marginBottom: 10, maxWidth: '70%' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDuration: { fontSize: 13, fontWeight: '700', color: AMBER_BRIGHT },
  heroPlayBtn: { position: 'absolute', right: 18, bottom: 24, zIndex: 5 },
  heroPlayGrad: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { width: 20, backgroundColor: AMBER },

  featuredCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER },
  featuredCardActive: { borderColor: AMBER, shadowColor: AMBER, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  liveBadge: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(240,160,48,0.35)', zIndex: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71' },
  liveText: { fontSize: 10, fontWeight: '800', color: AMBER_BRIGHT, letterSpacing: 1 },
  newBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 5 },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1208', letterSpacing: 0.6 },
  featuredPlay: { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 4 },
  featuredPlayGrad: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  featuredFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 48, zIndex: 3 },
  featuredTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredDuration: { fontSize: 12, fontWeight: '600', color: AMBER_MUTED },

  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 2.5, borderRadius: 2 },
  diffPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  diffPillCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  diffDot: { width: 5, height: 5, borderRadius: 2.5 },
  diffText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },

  gridWrap: { marginBottom: 14 },
  gridCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: CARD_BORDER },
  gridCardActive: { borderColor: AMBER, shadowColor: AMBER, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  gridImage: { overflow: 'hidden', position: 'relative' },
  rankBadge: { position: 'absolute', top: 10, right: 10, zIndex: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  rankText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  catBadge: { position: 'absolute', top: 10, left: 10, zIndex: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1 },
  catBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  gridLive: { position: 'absolute', top: 10, right: 10, zIndex: 3, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  gridPlay: { position: 'absolute', alignSelf: 'center', top: '36%', zIndex: 3 },
  gridPlayGrad: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  gridOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 40, zIndex: 2 },
  gridTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 8 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  gridDuration: { fontSize: 11, fontWeight: '600', color: AMBER_MUTED },

  listRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, borderRadius: 18,
    backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER,
  },
  listRowActive: { borderColor: AMBER, backgroundColor: 'rgba(240,160,48,0.06)' },
  listRank: { width: 28, fontSize: 13, fontWeight: '800', color: TEXT_MUTED },
  listThumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  listInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  listSub: { fontSize: 11, color: TEXT_MUTED, marginBottom: 6 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listCat: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  listDot: { color: TEXT_MUTED, fontSize: 10 },
  listDur: { fontSize: 10, fontWeight: '600', color: TEXT_MUTED },
  listHeart: { padding: 4 },
  listPlay: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: AMBER,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },

  banner: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 14, borderRadius: 20,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,160,48,0.35)', backgroundColor: CARD,
  },
  bannerGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: AMBER },
  bannerPreview: { width: 54, height: 54, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,160,48,0.3)' },
  bannerInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  bannerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bannerLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71' },
  bannerLabel: { fontSize: 10, fontWeight: '800', color: AMBER, letterSpacing: 0.8, textTransform: 'uppercase' },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  bannerProgressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  bannerProgressFill: { height: '100%', borderRadius: 2 },
  bannerArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: AMBER_GLOW, alignItems: 'center', justifyContent: 'center' },

  statChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER },
  statChipActive: { borderColor: AMBER, backgroundColor: 'rgba(240,160,48,0.08)' },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  statValueActive: { color: AMBER_BRIGHT },
  statLabel: { fontSize: 10, fontWeight: '600', color: TEXT_MUTED, marginTop: 2 },
  statLabelActive: { color: AMBER },

  viewToggle: { flexDirection: 'row', backgroundColor: CARD, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: CARD_BORDER },
  viewBtn: { width: 36, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { backgroundColor: AMBER },

  stickyBar: { position: 'absolute', left: 0, right: 0, zIndex: 20, overflow: 'hidden' },
  stickyBlur: { borderBottomWidth: 1, borderBottomColor: CARD_BORDER },
  stickyInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  stickyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  stickyCount: { fontSize: 11, color: TEXT_MUTED },
  stickySearchBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: AMBER_GLOW, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,160,48,0.25)' },
});
