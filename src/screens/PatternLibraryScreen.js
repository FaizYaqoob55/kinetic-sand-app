// src/screens/PatternLibraryScreen.js — Ultimate pattern library UI
import React, { useMemo, useRef, useState, useEffect } from 'react';
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
import { PATTERN_CATEGORIES } from '../constants/patterns';
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
import { toggleFavorite, clearNewCount, setSyncLoading, setRemotePatterns, setSyncError } from '../store/patternSlice';
import PatternRemoteService from '../services/PatternRemoteService';
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

const AMBER = '#F0A030';
const AMBER_BRIGHT = '#FFB84D';
const AMBER_DARK = '#C07A20';
const AMBER_MUTED = '#B8864A';
const TEXT_MUTED = '#9A8070';
const BG = '#000000';
const CARD = '#0D0D0D';
const CARD_BORDER = '#1E1E1E';
const AMBER_GRAD = ['#FFB84D', AMBER, AMBER_DARK];

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
    <View style={{ flex: 1, backgroundColor: BG }} />
    <View style={[styles.orb, styles.orbAmber]} />
  </View>
);

export default function PatternLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { favorites, patterns, newCount: remoteNewCount, syncStatus } = useSelector(s => s.pattern);
  const { isPlaying, currentPattern, progress } = useSelector(s => s.table);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState(null);
  const [sortId, setSortId] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [heroIndex, setHeroIndex] = useState(0);

  const featured = useMemo(() => patterns.filter(p => p.category === 'featured'), [patterns]);
  const heroPatterns = useMemo(() => featured.slice(0, 4), [featured]);
  const newCount = useMemo(() => remoteNewCount || patterns.filter(p => p.isNew).length, [patterns, remoteNewCount]);

  const handleSync = async (force = true) => {
    HapticService.light();
    try {
      dispatch(setSyncLoading());
      const result = await PatternRemoteService.sync({ force });
      if (result?.patterns?.length) {
        dispatch(setRemotePatterns({
          patterns: result.patterns,
          version: result.version,
          updatedAt: result.updatedAt,
          newCount: result.newCount,
          lastSyncAt: Date.now(),
        }));
      }
    } catch (err) {
      dispatch(setSyncError(err?.message || 'Sync failed'));
    }
  };

  useEffect(() => {
    if (remoteNewCount > 0) dispatch(clearNewCount());
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = patterns.filter(p => {
      const catOk = category === 'all' || category === 'favorites' || p.category === category;
      const favOk = category !== 'favorites' || favorites.includes(p.id);
      const diffOk = !difficulty || p.difficulty === difficulty;
      const searchOk = !q
        || p.name.toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q)
        || p.category.includes(q)
        || (p.slug || '').toLowerCase().includes(q);
      return catOk && favOk && diffOk && searchOk;
    });
    return sortPatterns(list, sortId);
  }, [patterns, search, category, difficulty, sortId, favorites]);

  const stickyOpacity = scrollY.interpolate({ inputRange: [180, 240], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroParallax = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -30], extrapolate: 'clamp' });

  const openPattern = (pattern) => {
    HapticService.light();
    navigation.navigate('PatternDetail', { pattern });
  };

  const shuffle = () => {
    HapticService.medium();
    if (!patterns.length) return;
    openPattern(patterns[Math.floor(Math.random() * patterns.length)]);
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
            <LinearGradient colors={AMBER_GRAD} style={styles.titleAccent} />
            <View>
              <Text style={styles.eyebrow}>Kinetic Sand Art</Text>
              <Text style={styles.title}>Patterns</Text>
              <Text style={styles.subtitle}>Discover · Play · Create</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.shuffleBtn} onPress={() => handleSync(true)} disabled={syncStatus === 'loading'}>
              <LinearGradient colors={['rgba(240,160,48,0.18)', 'rgba(240,160,48,0.06)']} style={styles.shuffleGrad}>
                <Ionicons name={syncStatus === 'loading' ? 'cloud-download-outline' : 'cloud-done-outline'} size={20} color={AMBER} />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.shuffleBtn} onPress={shuffle}>
              <LinearGradient colors={['rgba(240,160,48,0.18)', 'rgba(240,160,48,0.06)']} style={styles.shuffleGrad}>
                <Ionicons name="shuffle" size={20} color={AMBER} />
              </LinearGradient>
            </Pressable>
          </View>
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
        <StatChip icon="grid-outline" value={patterns.length} label="Total" active={category === 'all'} onPress={() => { HapticService.light(); setCategory('all'); }} />
        <StatChip icon="sparkles-outline" value={newCount} label="New" active={category === 'featured'} onPress={() => { HapticService.light(); setCategory('featured'); }} />
        <StatChip icon="heart" value={favorites.length} label="Saved" active={category === 'favorites'} onPress={() => { HapticService.light(); setCategory('favorites'); }} />
      </View>

      {isPlaying && currentPattern && (
        <NowPlayingBanner pattern={currentPattern} progress={progress || 0} onPress={() => navigation.navigate('NowPlaying')} />
      )}

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={18} color={searchFocused ? AMBER : TEXT_MUTED} />
        <TextInput
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Search patterns, moods, styles..."
          placeholderTextColor={TEXT_MUTED}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORY_CHIPS.map(chip => {
          const active = category === chip.id;
          return (
            <Pressable key={chip.id} style={[styles.chip, active && styles.chipActive]} onPress={() => { HapticService.light(); setCategory(chip.id); }}>
              <Ionicons name={chip.icon} size={14} color={active ? '#1A1208' : AMBER_MUTED} />
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
        <LinearGradient colors={AMBER_GRAD} style={styles.sectionBadge}>
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
        <LinearGradient colors={['transparent', AMBER, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
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
            <Ionicons name="swap-vertical" size={14} color={AMBER} />
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
            <LinearGradient colors={AMBER_GRAD} style={styles.emptyIcon}>
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
        <LinearGradient colors={AMBER_GRAD} style={styles.fabGrad}>
          <Ionicons name="shuffle" size={22} color="#1A1208" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  orb: { position: 'absolute', borderRadius: 999 },
  orbAmber: { width: 280, height: 280, top: -80, right: -100, backgroundColor: 'rgba(240,160,48,0.06)' },

  list: { paddingHorizontal: H_PAD },
  gridRow: { gap: GRID_GAP },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleAccent: { width: 4, height: 52, borderRadius: 2, marginTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: AMBER_MUTED, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 34, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: TEXT_MUTED, fontWeight: '400', marginTop: 2 },
  shuffleBtn: { borderRadius: 12, overflow: 'hidden' },
  shuffleGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(240,160,48,0.25)' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: 14 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 14,
  },
  searchWrapFocused: {
    borderColor: 'rgba(240,160,48,0.45)',
    shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#FFFFFF', paddingVertical: 0 },

  chips: { gap: 8, paddingBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER,
  },
  chipActive: { backgroundColor: AMBER, borderColor: AMBER },
  chipText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  chipTextActive: { color: '#1A1208' },

  diffRow: { gap: 8, paddingBottom: 18 },
  diffChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER },
  diffChipActive: { backgroundColor: 'rgba(240,160,48,0.1)', borderColor: AMBER },
  diffChipText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  diffChipTextActive: { color: AMBER },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  sectionHint: { marginTop: 3, fontSize: 12, color: TEXT_MUTED },
  sectionBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  featuredRow: { paddingRight: H_PAD, marginBottom: 6 },

  divider: { alignItems: 'center', marginVertical: 22 },
  dividerLine: { width: '55%', height: 1, opacity: 0.35 },

  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  resultCount: { marginTop: 3, fontSize: 12, color: TEXT_MUTED },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: CARD_BORDER,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: AMBER },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 21, marginBottom: 22 },
  emptyBtn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, backgroundColor: AMBER },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },

  fab: { position: 'absolute', right: H_PAD, zIndex: 15 },
  fabGrad: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    shadowColor: AMBER, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
});
