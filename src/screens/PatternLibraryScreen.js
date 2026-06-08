// src/screens/PatternLibraryScreen.js — Premium Rebuild
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ScrollView, Dimensions,
  Image, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import {
  PATTERNS,
  formatDuration,
} from '../constants/patterns';
import { toggleFavorite } from '../store/patternSlice';
import { setPlaying } from '../store/tableSlice';
import FluidNCService from '../services/FluidNCService';
import HapticService from '../services/HapticService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const contentWidth = isWeb ? Math.min(width, 460) : width;
const GRID_CARD_W = (contentWidth - 44) / 2;

// Custom category chips mapping
const FILTER_CHIPS = [
  { id: 'all', name: 'All', icon: 'apps-outline' },
  { id: 'zen', name: 'Relax', icon: 'water-outline' },
  { id: 'nature', name: 'Nature', icon: 'leaf-outline' },
  { id: 'geometric', name: 'Geometry', icon: 'shapes-outline' },
  { id: 'favorites', name: 'Zen', icon: 'heart-outline' },
  { id: 'mandala', name: 'Spiritual', icon: 'sparkles-outline' },
];

// Helper to map beautiful local sand graphics
const getPatternThumb = (pattern) => {
  const name = pattern.name.toLowerCase();
  if (name.includes('spiral') || name.includes('galaxy') || name.includes('loop') || name.includes('ripple') || name.includes('waves')) {
    return require('../assets/pattern_spiral.png');
  }
  if (name.includes('lotus') || name.includes('flower') || name.includes('mandala') || name.includes('star') || name.includes('bloom') || name.includes('garden')) {
    return require('../assets/pattern_lotus.png');
  }
  return require('../assets/pattern_waves.png');
};

export default function PatternLibraryScreen({ navigation }) {
  const dispatch = useDispatch();
  const { favorites } = useSelector(s => s.pattern);
  const { isConnected, currentPattern, isPlaying } = useSelector(s => s.table);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');

  // Filter & sort logic
  const filtered = useMemo(() => {
    let list = [...PATTERNS];
    if (category === 'favorites') {
      list = list.filter(p => favorites.includes(p.id));
    } else if (category !== 'all') {
      list = list.filter(p => p.category === category || p.difficulty === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'duration') list.sort((a, b) => a.duration - b.duration);
    if (sort === 'newest') list = [...list.filter(p => p.isNew), ...list.filter(p => !p.isNew)];
    return list;
  }, [search, category, sort, favorites]);

  // Featured patterns scroll (featured category)
  const featuredPatterns = useMemo(() => {
    return PATTERNS.filter(p => p.category === 'featured');
  }, []);

  const handlePlayPattern = async (pattern) => {
    HapticService.medium();
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your SandTable first.', [
        { text: 'Connect', onPress: () => navigation.navigate('Connect') },
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

  const renderGridCard = ({ item }) => {
    const isNowPlaying = isPlaying && currentPattern && currentPattern.id === item.id;
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigation.navigate('PatternDetail', { pattern: item })}
        activeOpacity={0.8}
      >
        <Image source={getPatternThumb(item)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        
        {/* Play button in center */}
        <TouchableOpacity
          style={styles.gridPlayBtn}
          onPress={() => handlePlayPattern(item)}
        >
          <Ionicons name="play" size={16} color="#fff" />
        </TouchableOpacity>

        {/* Text bottom overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gridOverlay}
        >
          <View style={styles.gridInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.gridDur}>{formatDuration(item.duration)}</Text>
            </View>
            <TouchableOpacity
              style={styles.gridFavBtn}
              onPress={() => {
                HapticService.light();
                dispatch(toggleFavorite(item.id));
              }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={16}
                color={isFav ? '#E05A5A' : 'rgba(255,255,255,0.7)'}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getSortLabel = () => {
    if (sort === 'name') return 'Popular';
    if (sort === 'duration') return 'Duration';
    return 'Newest';
  };

  const toggleSort = () => {
    HapticService.light();
    if (sort === 'name') setSort('duration');
    else if (sort === 'duration') setSort('newest');
    else setSort('name');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#080808', '#0D0D12']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => { HapticService.light(); navigation.goBack(); }}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patterns</Text>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => { HapticService.light(); }}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Grid FlatList */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderGridCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search patterns, moods, or keywords..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
            </View>

            {/* Category horizontal bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {FILTER_CHIPS.map(chip => {
                const isActive = category === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => { HapticService.light(); setCategory(chip.id); }}
                  >
                    <Ionicons
                      name={chip.icon}
                      size={12}
                      color={isActive ? '#0A0A0F' : '#6B6B7A'}
                    />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {chip.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Featured Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <TouchableOpacity onPress={() => { HapticService.light(); setCategory('all'); }}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScroll}
              contentContainerStyle={styles.featuredContent}
            >
              {featuredPatterns.map(p => {
                const isNowPlaying = isPlaying && currentPattern && currentPattern.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.featuredCard, isNowPlaying && styles.featuredCardActive]}
                    onPress={() => navigation.navigate('PatternDetail', { pattern: p })}
                    activeOpacity={0.8}
                  >
                    <Image source={getPatternThumb(p)} style={StyleSheet.absoluteFill} resizeMode="cover" />

                    {/* Central Play button */}
                    <TouchableOpacity
                      style={styles.featPlayBtn}
                      onPress={() => handlePlayPattern(p)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Now Playing badge */}
                    {isNowPlaying && (
                      <View style={styles.nowPlayingBadge}>
                        <Text style={styles.nowPlayingText}>Now Playing</Text>
                      </View>
                    )}

                    {/* Bottom gradient overlay with name + duration */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.88)']}
                      style={styles.featuredGradient}
                    >
                      <Text style={styles.featName} numberOfLines={1}>{p.name}</Text>
                      <View style={styles.featMeta}>
                        {isNowPlaying ? (
                          <View style={styles.waveContainer}>
                            <View style={[styles.waveBar, { height: 8 }]} />
                            <View style={[styles.waveBar, { height: 12 }]} />
                            <View style={[styles.waveBar, { height: 6 }]} />
                            <Text style={styles.featDurTextActive}>{formatDuration(p.duration)}</Text>
                          </View>
                        ) : (
                          <Text style={styles.featDurText}>{formatDuration(p.duration)}</Text>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* All Patterns Header */}
            <View style={styles.allPatternsHeader}>
              <View>
                <Text style={styles.allPatternsTitle}>All Patterns</Text>
                <Text style={styles.allPatternsCount}>{filtered.length} Patterns</Text>
              </View>
              <View style={styles.allPatternsControls}>
                <TouchableOpacity style={styles.sortDropdown} onPress={toggleSort}>
                  <Text style={styles.sortLabelText}>{getSortLabel()}</Text>
                  <Ionicons name="chevron-down" size={12} color="#6B6B7A" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterBtn}>
                  <Ionicons name="sliders-outline" size={14} color="#6B6B7A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#2A2A3A" />
            <Text style={styles.emptyText}>No patterns found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131318',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131318',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chipsScroll: {
    marginBottom: 24,
  },
  chipsContent: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#131318',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: '#6B6B7A',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0A0A0F',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  featuredScroll: {
    marginBottom: 24,
  },
  featuredContent: {
    paddingRight: 16,
  },
  featuredCard: {
    width: 170,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#131318',
    marginRight: 14,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featuredCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  featPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    zIndex: 10,
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  nowPlayingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A0A0F',
    textTransform: 'uppercase',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 36,
  },
  featName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  featMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featDurText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  featDurTextActive: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveBar: {
    width: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    marginRight: 2,
  },
  allPatternsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  allPatternsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  allPatternsCount: {
    fontSize: 11,
    color: '#6B6B7A',
    fontWeight: '500',
    marginTop: 2,
  },
  allPatternsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131318',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sortLabelText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#131318',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCard: {
    width: GRID_CARD_W,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#131318',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gridPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    zIndex: 10,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 30,
  },
  gridInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gridName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  gridDur: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  gridFavBtn: {
    padding: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B7A',
    fontWeight: '600',
  },
});

