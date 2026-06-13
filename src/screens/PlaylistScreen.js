// src/screens/PlaylistScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import PatternRemoteService from '../services/PatternRemoteService';
import {
  clearPlaylist, removeFromPlaylist,
  toggleRepeat, toggleShuffle, setPlaying, reorderPlaylist,
} from '../store/tableSlice';
import { addDownloaded } from '../store/patternSlice';
import { formatDuration } from '../constants/patterns';
import { RemotePatternPreview } from '../components/RemotePatternPreview';
import HapticService from '../services/HapticService';

export default function PlaylistScreen({ navigation }) {
  const dispatch = useDispatch();
  const {
    playlist, isConnected, repeatPlaylist, shufflePlaylist,
    currentPlaylistIndex,
  } = useSelector(s => s.table);

  const handlePlay = async (pattern, index) => {
    HapticService.medium();
    if (!isConnected) {
      Alert.alert('Not Connected', 'Connect your SandTable first.');
      return;
    }
    try {
      dispatch(setPlaying(pattern));
      await PatternRemoteService.playPattern(pattern);
      dispatch(addDownloaded(pattern.id));
      navigation.navigate('NowPlaying');
    } catch {
      Alert.alert('Error', 'Could not load pattern onto table.');
    }
  };

  const handleClear = () => {
    HapticService.heavy();
    Alert.alert('Clear Playlist', 'Remove all patterns from playlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          HapticService.heavy();
          dispatch(clearPlaylist());
        },
      },
    ]);
  };

  const handlePlayAll = async () => {
    HapticService.medium();
    if (!isConnected || playlist.length === 0) return;
    const first = shufflePlaylist
      ? playlist[Math.floor(Math.random() * playlist.length)]
      : playlist[0];
    await handlePlay(first, 0);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Playlist</Text>
        <Text style={styles.subtitle}>{playlist.length} patterns</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlChip, shufflePlaylist && styles.controlChipActive]}
          onPress={() => {
            HapticService.light();
            dispatch(toggleShuffle());
          }}
        >
          <Ionicons name="shuffle" size={16} color={shufflePlaylist ? Colors.background : Colors.textSecondary} />
          <Text style={[styles.controlChipText, shufflePlaylist && styles.controlChipTextActive]}>Shuffle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlChip, repeatPlaylist && styles.controlChipActive]}
          onPress={() => {
            HapticService.light();
            dispatch(toggleRepeat());
          }}
        >
          <Ionicons name="repeat" size={16} color={repeatPlaylist ? Colors.background : Colors.textSecondary} />
          <Text style={[styles.controlChipText, repeatPlaylist && styles.controlChipTextActive]}>Repeat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.playAllGrad}>
            <Ionicons name="play" size={16} color={Colors.background} />
            <Text style={styles.playAllText}>Play All</Text>
          </LinearGradient>
        </TouchableOpacity>

        {playlist.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {playlist.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Playlist is Empty</Text>
          <Text style={styles.emptySubtext}>Add patterns from the Library</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              HapticService.light();
              navigation.navigate('Library');
            }}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.addBtnGrad}>
              <Ionicons name="add" size={20} color={Colors.background} />
              <Text style={styles.addBtnText}>Browse Patterns</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <DraggableFlatList
          data={playlist}
          onDragEnd={({ data }) => {
            HapticService.light();
            dispatch(reorderPlaylist(data));
          }}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item, index, drag, isActive }) => (
            <ScaleDecorator>
              <TouchableOpacity
                onLongPress={() => {
                  HapticService.light();
                  drag();
                }}
                disabled={isActive}
                activeOpacity={0.9}
                style={[
                  styles.playlistItem,
                  index === currentPlaylistIndex && styles.playlistItemActive,
                  isActive && styles.playlistItemDragging,
                ]}
              >
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>

                <View style={styles.previewContainer}>
                  <RemotePatternPreview pattern={item} size={42} />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDuration}>{formatDuration(item.duration)}</Text>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => handlePlay(item, index)}>
                    <Ionicons name="play-circle" size={28} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      HapticService.heavy();
                      dispatch(removeFromPlaylist(index));
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={Colors.textTertiary} />
                  </TouchableOpacity>
                  <Ionicons name="menu" size={20} color={Colors.textTertiary} style={styles.dragHandle} />
                </View>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textTertiary, marginBottom: 4 },
  controlsBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 10,
  },
  controlChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  controlChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  controlChipText: { fontSize: 13, color: Colors.textSecondary },
  controlChipTextActive: { color: Colors.background, fontWeight: '600' },
  playAllBtn: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  playAllGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  playAllText: { color: Colors.background, fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  playlistItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14, marginBottom: 8,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
    gap: 12,
  },
  playlistItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  playlistItemDragging: {
    borderColor: Colors.accent,
    backgroundColor: Colors.backgroundTertiary,
  },
  indexBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  indexText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600' },
  previewContainer: {
    width: 42, height: 42,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0F0F15',
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemDuration: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dragHandle: { marginLeft: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  emptySubtext: { fontSize: 14, color: Colors.textTertiary },
  addBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  addBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, gap: 8,
  },
  addBtnText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
