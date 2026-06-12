// src/screens/PatternLibraryScreen.js — Ultimate pattern library UI
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import { PATTERNS, PATTERN_CATEGORIES } from '../constants/patterns';
import {
  HeroCarousel,
  FeaturedPatternCard,
  GridPatternCard,
  ListPatternRow,
  NowPlayingBanner,
  StatChip,
  ViewToggle,
  StickyGlassBar,
  FadeIn,
} from '../components/PatternLibraryCard';
import { toggleFavorite } from '../store/patternSlice';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CONTENT_W = isWeb ? Math.min(width, 460) : width;
const H_PAD = 20;
const GRID_GAP = 14;
const GRID_W = (CONTENT_W - H_PAD * 2 - GRID_GAP) / 2;
const HERO_W = CONTENT_W - H_PAD * 2;
const HERO_H = HERO_W * 0.58;
const FEAT_W = CONTENT_W * 0.58;
const FEAT_H = FEAT_W * 1.3;

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'duration', label: 'Duration' },
  { id: 'az', label: 'A → Z' },
];

const DIFFICULTY_FILTERS = [
  { id: null, label: 'All levels' },
  { id: 'smooth', label: 'Smooth' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'complex', label: 'Complex' },
];

const CATEGORY_CHIPS = PATTERN_CATEGORIES.filter(c => c.id !== 'favorites');

function sortPatterns(list, sortId) {
  const copy = [...list];
  switch (sortId) {
    case 'duration': return copy.sort((a, b) => a.duration - b.duration);
    case 'az': return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest': return copy.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    default: return copy;
  }
}

const AmbientBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#1C1608', '#0A0A0F', '#040408']} style={StyleSheet.absoluteFill} />
    <View style={[styles.orb, styles.orbGold]} />
    <View style={[styles.orb, styles.orbBlue]} />
    <View style={[styles.orb, styles.orbPurple]} />
    <View style={styles.grain} />
  </View>
);

export default function PatternLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { favorites } = useSelector(s => s.pattern);
  const { isPlaying, currentPattern, progress } = useSelector(s => s.table);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState(null);
  const [sortId, setSortId] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [heroIndex, setHeroIndex] = useState(0);

  const featured = useMemo(() => PATTERNS.filter(p => p.category === 'featured'), []);
  const heroPatterns = useMemo(() => featured.slice(0, 4), [featured]);
  const newCount = useMemo(() => PATTERNS.filter(p => p.isNew).length, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = PATTERNS.filter(p => {
      const catOk = category === 'all' || category === 'favorites' || p.category === category;
      const favOk = category !== 'favorites' || favorites.includes(p.id);
      const diffOk = !difficulty || p.difficulty === difficulty;
      const searchOk = !q
        || p.name.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
        || p.category.includes(q);
      return catOk && favOk && diffOk && searchOk;
    });
    return sortPatterns(list, sortId);
  }, [search, category, difficulty, sortId, favorites]);

  const stickyOpacity = scrollY.interpolate({ inputRange: [180, 240], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroParallax = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -30], extrapolate: 'clamp' });

  const openPattern = (pattern) => {
    HapticService.light();
    navigation.navigate('PatternDetail', { pattern });
  };

  const shuffle = () => {
    HapticService.medium();
    openPattern(PATTERNS[Math.floor(Math.random() * PATTERNS.length)]);
  };

  const toggleFav = (id) => {
    HapticService.light();
    dispatch(toggleFavorite(id));
  };

  const scrollToSearch = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setTimeout(() => searchRef.current?.focus(), 350);
  };

  const sortLabel = SORT_OPTIONS.find(s => s.id === sortId)?.label || 'Popular';

  const ListHeader = (
    <View>
      <Animated.View style={{ transform: [{ translateY: heroParallax }] }}>
        <View style={styles.pageHeader}>
          <View style={styles.titleBlock}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.titleAccent} />
            <View>
              <Text style={styles.eyebrow}>Kinetic Sand Art</Text>
              <Text style={styles.title}>Patterns</Text>
              <Text style={styles.subtitle}>Discover · Play · Create</Text>
            </View>
          </View>
          <Pressable style={styles.shuffleBtn} onPress={shuffle}>
            <LinearGradient colors={['rgba(201,168,76,0.2)', 'rgba(201,168,76,0.06)']} style={styles.shuffleGrad}>
              <Ionicons name="shuffle" size={20} color={Colors.primary} />
            </LinearGradient>
          </Pressable>
        </View>

        <HeroCarousel
          patterns={heroPatterns}
          cardWidth={HERO_W}
          cardHeight={HERO_H}
          activeIndex={heroIndex}
          onIndexChange={setHeroIndex}
          currentPatternId={currentPattern?.id}
          isPlaying={isPlaying}
          onPress={openPattern}
          onPlay={openPattern}
        />
      </Animated.View>

      <View style={styles.statsRow}>
        <StatChip icon="grid-outline" value={PATTERNS.length} label="Total" active={category === 'all'} onPress={() => { HapticService.light(); setCategory('all'); }} />
        <StatChip icon="sparkles-outline" value={newCount} label="New" active={category === 'featured'} onPress={() => { HapticService.light(); setCategory('featured'); }} />
        <StatChip icon="heart" value={favorites.length} label="Saved" active={category === 'favorites'} onPress={() => { HapticService.light(); setCategory('favorites'); }} />
      </View>

      {isPlaying && currentPattern && (
        <NowPlayingBanner pattern={currentPattern} progress={progress || 0} onPress={() => navigation.navigate('NowPlaying')} />
      )}

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={18} color={searchFocused ? Colors.primary : Colors.textTertiary} />
        <TextInput
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Search patterns, moods, styles..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORY_CHIPS.map(chip => {
          const active = category === chip.id;
          return (
            <Pressable key={chip.id} style={[styles.chip, active && styles.chipActive]} onPress={() => { HapticService.light(); setCategory(chip.id); }}>
              <Ionicons name={chip.icon} size={14} color={active ? '#1A1208' : Colors.primary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diffRow}>
        {DIFFICULTY_FILTERS.map(f => {
          const active = difficulty === f.id;
          return (
            <Pressable key={f.label} style={[styles.diffChip, active && styles.diffChipActive]} onPress={() => { HapticService.light(); setDifficulty(f.id); }}>
              <Text style={[styles.diffChipText, active && styles.diffChipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionTitle}>Curated Picks</Text>
          <Text style={styles.sectionHint}>Editor's selection</Text>
        </View>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.sectionBadge}>
          <Ionicons name="star" size={13} color="#1A1208" />
        </LinearGradient>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow} decelerationRate="fast" snapToInterval={FEAT_W + 12}>
        {featured.map(pattern => (
          <FeaturedPatternCard
            key={pattern.id}
            pattern={pattern}
            width={FEAT_W}
            height={FEAT_H}
            isActive={currentPattern?.id === pattern.id}
            isPlaying={isPlaying && currentPattern?.id === pattern.id}
            onPress={() => openPattern(pattern)}
          />
        ))}
      </ScrollView>

      <View style={styles.divider}>
        <LinearGradient colors={['transparent', Colors.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
      </View>

      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Browse All</Text>
          <Text style={styles.resultCount}>
            {filtered.length} pattern{filtered.length === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.toolbarRight}>
          <Pressable style={styles.sortBtn} onPress={() => {
            const idx = SORT_OPTIONS.findIndex(s => s.id === sortId);
            const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
            HapticService.light();
            setSortId(next.id);
          }}>
            <Ionicons name="swap-vertical" size={14} color={Colors.primary} />
            <Text style={styles.sortBtnText}>{sortLabel}</Text>
          </Pressable>
          <ViewToggle mode={viewMode} onChange={(m) => { HapticService.light(); setViewMode(m); }} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <StickyGlassBar
        opacity={stickyOpacity}
        top={insets.top}
        title="Patterns"
        count={filtered.length}
        onSearch={scrollToSearch}
      />

      <Animated.FlatList
        ref={listRef}
        key={viewMode}
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.emptyIcon}>
              <Ionicons name="planet-outline" size={28} color="#1A1208" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyBody}>Try changing filters or search for something else.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => { setSearch(''); setCategory('all'); setDifficulty(null); }}>
              <Text style={styles.emptyBtnText}>Reset everything</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            {viewMode === 'grid' ? (
              <GridPatternCard
                pattern={item}
                width={GRID_W}
                tall={index % 3 === 0}
                rank={sortId === 'popular' ? index + 1 : null}
                isFavorite={favorites.includes(item.id)}
                isPlaying={isPlaying && currentPattern?.id === item.id}
                onPress={() => openPattern(item)}
                onToggleFavorite={() => toggleFav(item.id)}
              />
            ) : (
              <ListPatternRow
                pattern={item}
                index={index}
                isFavorite={favorites.includes(item.id)}
                isPlaying={isPlaying && currentPattern?.id === item.id}
                onPress={() => openPattern(item)}
                onToggleFavorite={() => toggleFav(item.id)}
              />
            )}
          </FadeIn>
        )}
      />

      <Pressable style={[styles.fab, { bottom: insets.bottom + 100 }]} onPress={shuffle}>
        <LinearGradient colors={Colors.gradientPrimary} style={styles.fabGrad}>
          <Ionicons name="shuffle" size={22} color="#1A1208" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  orb: { position: 'absolute', borderRadius: 999 },
  orbGold: { width: 300, height: 300, top: -100, right: -120, backgroundColor: 'rgba(201,168,76,0.09)' },
  orbBlue: { width: 220, height: 220, top: 400, left: -100, backgroundColor: 'rgba(76,158,255,0.05)' },
  orbPurple: { width: 180, height: 180, bottom: 160, right: -60, backgroundColor: 'rgba(160,120,255,0.05)' },
  grain: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.012)' },

  list: { paddingHorizontal: H_PAD },
  gridRow: { gap: GRID_GAP },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleAccent: { width: 4, height: 52, borderRadius: 2, marginTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 13, color: Colors.textTertiary, fontWeight: '500', marginTop: 2 },
  shuffleBtn: { borderRadius: 22, overflow: 'hidden' },
  shuffleGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: 14 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(22,22,31,0.9)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  searchWrapFocused: {
    borderColor: 'rgba(201,168,76,0.5)',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 0 },

  chips: { gap: 8, paddingBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: 'rgba(22,22,31,0.75)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#1A1208' },

  diffRow: { gap: 8, paddingBottom: 18 },
  diffChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
  diffChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  diffChipText: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
  diffChipTextActive: { color: Colors.primary },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionHint: { marginTop: 3, fontSize: 12, color: Colors.textTertiary },
  sectionBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  featuredRow: { paddingRight: H_PAD, marginBottom: 6 },

  divider: { alignItems: 'center', marginVertical: 22 },
  dividerLine: { width: '55%', height: 1, opacity: 0.4 },

  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  resultCount: { marginTop: 3, fontSize: 12, color: Colors.textTertiary },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 22 },
  emptyBtn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, backgroundColor: Colors.primary },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },

  fab: { position: 'absolute', right: H_PAD, zIndex: 15 },
  fabGrad: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
});
