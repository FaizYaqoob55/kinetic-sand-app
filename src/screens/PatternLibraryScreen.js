// src/screens/PatternLibraryScreen.js — Exact Reference Match
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, FlatList, Dimensions, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import { PATTERNS, formatDuration } from '../constants/patterns';
import { SandPreview } from '../components/SandPreview';
import { toggleFavorite } from '../store/patternSlice';
import { setPlaying } from '../store/tableSlice';
import FluidNCService from '../services/FluidNCService';
import HapticService from '../services/HapticService';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CONTENT_W = isWeb ? Math.min(width, 460) : width;

// Sizing
const H_PAD = 16;
const FEAT_CARD_W = (CONTENT_W - H_PAD * 2 - 12) / 2;
const FEAT_CARD_H = FEAT_CARD_W * 1.3;
const GRID_GAP = 8;
const GRID_COLS = 4;
const GRID_CARD_W = (CONTENT_W - H_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const GRID_CARD_H = GRID_CARD_W * 1.1;

// ── Filter chips ────────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',      label: 'All',      icon: 'apps',           cat: null },
  { id: 'zen',      label: 'Relax',    icon: 'water-outline',  cat: 'zen' },
  { id: 'nature',   label: 'Nature',   icon: 'leaf-outline',   cat: 'nature' },
  { id: 'geo',      label: 'Geometry', icon: 'shapes-outline', cat: 'geometric' },
  { id: 'zen2',     label: 'Zen',      icon: 'happy-outline',  cat: 'mandala' },
  { id: 'space',    label: 'Spiritual',icon: 'sparkles-outline', cat: 'space' },
];

// ── Animated wave bars for "Now Playing" ────────────────────────────────────────
const WaveBars = () => {
  const anims = useRef([0.4, 1, 0.6, 0.9, 0.5].map(v => new Animated.Value(v))).current;
  React.useEffect(() => {
    anims.forEach((a, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, { toValue: 1, duration: 300 + i * 80, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.25, duration: 300 + i * 80, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          width: 2.5, height: 10, borderRadius: 1.5,
          backgroundColor: Colors.primary,
          transform: [{ scaleY: a }],
        }} />
      ))}
    </View>
  );
};

// ── Featured Card ───────────────────────────────────────────────────────────────
const FeaturedCard = ({ pattern, isNowPlaying, isFav, onPress, onFav }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.featCard, isNowPlaying && styles.featCardActive]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Sand preview as card background */}
        <View style={styles.featThumb}>
          <SandPreview patternId={pattern.id} size={FEAT_CARD_W} />
        </View>

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Now Playing badge */}
        {isNowPlaying && (
          <View style={styles.nowPlayingBadge}>
            <Text style={styles.nowPlayingTxt}>Now Playing</Text>
          </View>
        )}

        {/* Play button */}
        <View style={styles.featPlayCircle}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>

        {/* Bottom info */}
        <View style={styles.featBottom}>
          <Text style={styles.featName} numberOfLines={1}>{pattern.name}</Text>
          <View style={styles.featDurRow}>
            {isNowPlaying ? (
              <>
                <WaveBars />
                <Text style={styles.featDurActive}> {formatDuration(pattern.duration)}</Text>
              </>
            ) : (
              <Text style={styles.featDur}>{formatDuration(pattern.duration)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Grid Card (small, 4-column) ─────────────────────────────────────────────────
const GridCard = ({ pattern, isFav, onPress, onFav }) => (
  <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.82}>
    {/* Thumbnail */}
    <View style={styles.gridThumb}>
      <SandPreview patternId={pattern.id} size={GRID_CARD_W - 4} />
      {/* Play button overlay */}
      <View style={styles.gridPlayOverlay}>
        <View style={styles.gridPlayCircle}>
          <Ionicons name="play" size={8} color="#fff" />
        </View>
      </View>
    </View>

    {/* Name */}
    <Text style={styles.gridName} numberOfLines={1}>{pattern.name}</Text>

    {/* Duration + fav row */}
    <View style={styles.gridMeta}>
      <Text style={styles.gridDur}>{formatDuration(pattern.duration)}</Text>
      <TouchableOpacity onPress={onFav} style={styles.gridFavBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={11} color={isFav ? '#E05A5A' : '#555'} />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// ── Main Screen ─────────────────────────────────────────────────────────────────
export default function PatternLibraryScreen({ navigation }) {
  const dispatch = useDispatch();
  const { favorites } = useSelector(s => s.pattern);
  const { isPlaying, currentPattern } = useSelector(s => s.table);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Popular');

  // Featured = 'featured' category patterns
  const featuredPatterns = PATTERNS.filter(p => p.category === 'featured');

  // All filtered patterns
  const filteredPatterns = PATTERNS.filter(p => {
    const chip = FILTER_CHIPS.find(c => c.id === activeFilter);
    const catMatch = !chip?.cat || p.category === chip.cat;
    const searchMatch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const handlePatternPress = (pattern) => {
    HapticService.light();
    navigation.navigate('PatternDetail', { pattern });
  };

  const handleFav = (patternId) => {
    HapticService.light();
    dispatch(toggleFavorite(patternId));
  };

  // Render 4-column grid row
  const renderRow = useCallback(({ item, index }) => {
    const rowItems = filteredPatterns.slice(index * 4, index * 4 + 4);
    if (index % 4 !== 0 || rowItems.length === 0) return null;
    return (
      <View style={styles.gridRow}>
        {rowItems.map(p => (
          <GridCard
            key={p.id}
            pattern={p}
            isFav={favorites.includes(p.id)}
            onPress={() => handlePatternPress(p)}
            onFav={() => handleFav(p.id)}
          />
        ))}
        {/* Fill empty cells */}
        {rowItems.length < 4 && Array.from({ length: 4 - rowItems.length }).map((_, i) => (
          <View key={`empty-${i}`} style={{ width: GRID_CARD_W }} />
        ))}
      </View>
    );
  }, [filteredPatterns, favorites]);

  // Build rows array
  const rows = [];
  for (let i = 0; i < filteredPatterns.length; i += 4) {
    rows.push({ id: `row-${i}`, startIndex: i });
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A10', '#080810']} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => { HapticService.light(); navigation.goBack(); }}
          >
            <Ionicons name="chevron-back" size={22} color="#D0D0D0" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Patterns</Text>

          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="search" size={20} color="#D0D0D0" />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patterns, moods, or keywords..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTER CHIPS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTER_CHIPS.map(chip => {
            const active = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => { HapticService.light(); setActiveFilter(chip.id); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={chip.icon}
                  size={13}
                  color={active ? '#0A0A10' : '#888'}
                />
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── FEATURED SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featScroll}
          >
            {featuredPatterns.map(p => (
              <FeaturedCard
                key={p.id}
                pattern={p}
                isNowPlaying={isPlaying && currentPattern?.id === p.id}
                isFav={favorites.includes(p.id)}
                onPress={() => handlePatternPress(p)}
                onFav={() => handleFav(p.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── ALL PATTERNS SECTION ── */}
        <View style={styles.section}>
          {/* Header row */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>All Patterns</Text>
              <Text style={styles.patternCount}>{filteredPatterns.length} Patterns</Text>
            </View>
            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.sortBtn}>
                <Text style={styles.sortTxt}>{sortBy}</Text>
                <Ionicons name="chevron-down" size={12} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterIconBtn}>
                <Ionicons name="options-outline" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 4-column grid */}
          {rows.map(row => {
            const rowItems = filteredPatterns.slice(row.startIndex, row.startIndex + 4);
            return (
              <View key={row.id} style={styles.gridRow}>
                {rowItems.map(p => (
                  <GridCard
                    key={p.id}
                    pattern={p}
                    isFav={favorites.includes(p.id)}
                    onPress={() => handlePatternPress(p)}
                    onFav={() => handleFav(p.id)}
                  />
                ))}
                {rowItems.length < 4 && Array.from({ length: 4 - rowItems.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ width: GRID_CARD_W }} />
                ))}
              </View>
            );
          })}

          {filteredPatterns.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color="#2A2A3A" />
              <Text style={styles.emptyTxt}>No patterns found</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A10' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: 0.2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: H_PAD,
    marginBottom: 14,
    backgroundColor: '#131320',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#C0C0C0',
    fontSize: 13,
    paddingVertical: 0,
  },

  // ── Filter Chips ──
  chipsScroll: { marginBottom: 20 },
  chipsContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#131320',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  chipTxtActive: {
    color: '#0A0A10',
    fontWeight: '700',
  },

  // ── Section ──
  section: { paddingHorizontal: H_PAD, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0F0F0',
  },
  viewAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  patternCount: {
    fontSize: 11,
    color: '#555',
    fontWeight: '400',
    marginTop: 2,
  },

  // Sort
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#131320',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sortTxt: { fontSize: 12, color: '#A0A0B0', fontWeight: '500' },
  filterIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#131320',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // ── Featured Cards ──
  featScroll: { gap: 12, paddingRight: 4 },
  featCard: {
    width: FEAT_CARD_W,
    height: FEAT_CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#131320',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'flex-end',
  },
  featCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  featThumb: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 5,
  },
  nowPlayingTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A0A10',
    letterSpacing: 0.3,
  },
  featPlayCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    zIndex: 4,
  },
  featBottom: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 3,
  },
  featName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  featDurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featDur: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  featDurActive: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Grid (4-column) ──
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridCard: {
    width: GRID_CARD_W,
  },
  gridThumb: {
    width: GRID_CARD_W,
    height: GRID_CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#131320',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPlayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  gridName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C0C0C0',
    marginBottom: 2,
    numberOfLines: 1,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridDur: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  gridFavBtn: {
    padding: 2,
  },

  // ── Empty ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
    gap: 12,
  },
  emptyTxt: {
    fontSize: 14,
    color: '#3A3A5A',
    fontWeight: '500',
  },
});
