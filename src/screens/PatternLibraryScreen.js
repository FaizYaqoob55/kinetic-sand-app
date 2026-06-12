// src/screens/PatternLibraryScreen.js — Awesome production UI
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
  HeroSpotlight,
  FeaturedPatternCard,
  GridPatternCard,
  NowPlayingBanner,
  StatChip,
} from '../components/PatternLibraryCard';
import { toggleFavorite } from '../store/patternSlice';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CONTENT_W = isWeb ? Math.min(width, 460) : width;
const H_PAD = 20;
const GRID_GAP = 14;
const GRID_W = (CONTENT_W - H_PAD * 2 - GRID_GAP) / 2;
const FEAT_W = CONTENT_W * 0.62;
const FEAT_H = FEAT_W * 1.28;

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'duration', label: 'Duration' },
  { id: 'az', label: 'A → Z' },
];

const CATEGORY_CHIPS = PATTERN_CATEGORIES.filter(c => c.id !== 'favorites');

function sortPatterns(list, sortId) {
  const copy = [...list];
  switch (sortId) {
    case 'duration':
      return copy.sort((a, b) => a.duration - b.duration);
    case 'az':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
      return copy.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    default:
      return copy;
  }
}

const AmbientBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#1A1408', Colors.background, '#050508']} style={StyleSheet.absoluteFill} />
    <View style={[styles.orb, styles.orbGold]} />
    <View style={[styles.orb, styles.orbBlue]} />
    <View style={[styles.orb, styles.orbGreen]} />
  </View>
);

export default function PatternLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { favorites } = useSelector(s => s.pattern);
  const { isPlaying, currentPattern, progress } = useSelector(s => s.table);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState('all');
  const [sortId, setSortId] = useState('popular');
  const [sortOpen, setSortOpen] = useState(false);

  const featured = useMemo(() => PATTERNS.filter(p => p.category === 'featured'), []);
  const newCount = useMemo(() => PATTERNS.filter(p => p.isNew).length, []);

  const spotlight = isPlaying && currentPattern
    ? currentPattern
    : featured[0] || PATTERNS[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = PATTERNS.filter(p => {
      const catOk = category === 'all' || category === 'favorites' || p.category === category;
      const favOk = category !== 'favorites' || favorites.includes(p.id);
      const searchOk = !q
        || p.name.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
        || p.category.includes(q);
      return catOk && favOk && searchOk;
    });
    return sortPatterns(list, sortId);
  }, [search, category, sortId, favorites]);

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [100, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const openPattern = (pattern) => {
    HapticService.light();
    navigation.navigate('PatternDetail', { pattern });
  };

  const openNowPlaying = () => {
    if (currentPattern) navigation.navigate('NowPlaying');
  };

  const toggleFav = (id) => {
    HapticService.light();
    dispatch(toggleFavorite(id));
  };

  const sortLabel = SORT_OPTIONS.find(s => s.id === sortId)?.label || 'Popular';

  const ListHeader = (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>Kinetic Sand Art</Text>
          <Text style={styles.title}>Patterns</Text>
        </View>
        <Pressable style={styles.shuffleBtn} onPress={() => {
          HapticService.light();
          const random = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
          openPattern(random);
        }}>
          <Ionicons name="shuffle" size={18} color={Colors.primary} />
        </Pressable>
      </View>

      <HeroSpotlight
        pattern={spotlight}
        isPlaying={isPlaying && currentPattern?.id === spotlight.id}
        onPress={() => openPattern(spotlight)}
        onPlay={() => openPattern(spotlight)}
      />

      <View style={styles.statsRow}>
        <StatChip
          icon="grid-outline"
          value={PATTERNS.length}
          label="Total"
          active={category === 'all'}
          onPress={() => { HapticService.light(); setCategory('all'); }}
        />
        <StatChip
          icon="sparkles-outline"
          value={newCount}
          label="New"
          active={category === 'featured'}
          onPress={() => { HapticService.light(); setCategory('featured'); }}
        />
        <StatChip
          icon="heart"
          value={favorites.length}
          label="Saved"
          active={category === 'favorites'}
          onPress={() => { HapticService.light(); setCategory('favorites'); }}
        />
      </View>

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Ionicons name="search" size={18} color={searchFocused ? Colors.primary : Colors.textTertiary} />
        <TextInput
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORY_CHIPS.map(chip => {
          const active = category === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => { HapticService.light(); setCategory(chip.id); }}
            >
              <Ionicons name={chip.icon} size={14} color={active ? '#1A1208' : Colors.primary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isPlaying && currentPattern && (
        <NowPlayingBanner
          pattern={currentPattern}
          progress={progress || 35}
          onPress={openNowPlaying}
        />
      )}

      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionTitle}>Curated Picks</Text>
          <Text style={styles.sectionHint}>Swipe to explore highlights</Text>
        </View>
        <View style={styles.sectionIcon}>
          <Ionicons name="star" size={14} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredRow}
        decelerationRate="fast"
        snapToInterval={FEAT_W + 14}
      >
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
        <LinearGradient
          colors={['transparent', Colors.primary, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dividerLine}
        />
      </View>

      <View style={styles.toolbar}>
        <View>
          <Text style={styles.sectionTitle}>Browse All</Text>
          <Text style={styles.resultCount}>
            {filtered.length} pattern{filtered.length === 1 ? '' : 's'}
            {category !== 'all' && category !== 'favorites'
              ? ` · ${CATEGORY_CHIPS.find(c => c.id === category)?.name}`
              : category === 'favorites' ? ' · Saved' : ''}
          </Text>
        </View>
        <Pressable
          style={styles.sortBtn}
          onPress={() => { HapticService.light(); setSortOpen(v => !v); }}
        >
          <Ionicons name="funnel-outline" size={14} color={Colors.primary} />
          <Text style={styles.sortBtnText}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={12} color={Colors.primary} />
        </Pressable>
      </View>

      {sortOpen && (
        <View style={styles.sortMenuInline}>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.id}
              style={[styles.sortItem, sortId === opt.id && styles.sortItemActive]}
              onPress={() => { HapticService.light(); setSortId(opt.id); setSortOpen(false); }}
            >
              <Text style={[styles.sortItemText, sortId === opt.id && styles.sortItemTextActive]}>
                {opt.label}
              </Text>
              {sortId === opt.id && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <Animated.View
        style={[
          styles.compactHeader,
          {
            paddingTop: insets.top + 6,
            opacity: compactHeaderOpacity,
            transform: [{
              translateY: compactHeaderOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.compactTitle}>Patterns</Text>
        <Text style={styles.compactCount}>{filtered.length} designs</Text>
      </Animated.View>

      <Animated.FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.emptyIcon}>
              <Ionicons name="search" size={26} color="#1A1208" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Adjust your search or pick a different category to discover sand art.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => { setSearch(''); setCategory('all'); }}
            >
              <Text style={styles.emptyBtnText}>Show all patterns</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <GridPatternCard
            pattern={item}
            width={GRID_W}
            isFavorite={favorites.includes(item.id)}
            isPlaying={isPlaying && currentPattern?.id === item.id}
            onPress={() => openPattern(item)}
            onToggleFavorite={() => toggleFav(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  orb: { position: 'absolute', borderRadius: 999 },
  orbGold: {
    width: 280, height: 280, top: -80, right: -100,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  orbBlue: {
    width: 200, height: 200, top: 320, left: -80,
    backgroundColor: 'rgba(76,158,255,0.05)',
  },
  orbGreen: {
    width: 160, height: 160, bottom: 200, right: -40,
    backgroundColor: 'rgba(76,175,130,0.05)',
  },

  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    backgroundColor: 'rgba(10,10,15,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  compactTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  compactCount: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' },

  list: { paddingHorizontal: H_PAD },
  gridRow: { gap: GRID_GAP },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  shuffleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(22,22,31,0.85)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  searchWrapFocused: {
    borderColor: 'rgba(201,168,76,0.45)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  chips: { gap: 8, paddingBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(22,22,31,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#1A1208' },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionHint: { marginTop: 3, fontSize: 12, color: Colors.textTertiary },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredRow: { paddingRight: H_PAD, marginBottom: 8 },

  divider: { alignItems: 'center', marginVertical: 20 },
  dividerLine: { width: '60%', height: 1, opacity: 0.35 },

  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  resultCount: { marginTop: 3, fontSize: 12, color: Colors.textTertiary },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(22,22,31,0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sortMenuInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  sortItemText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortItemTextActive: { color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 36, paddingBottom: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
});
