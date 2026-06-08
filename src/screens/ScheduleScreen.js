// src/screens/ScheduleScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import { setSleepTimer } from '../store/tableSlice';
import Storage from '../utils/storage';
import HapticService from '../services/HapticService';

const SLEEP_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: 'Never', value: 0 },
];

export default function ScheduleScreen({ navigation }) {
  const dispatch = useDispatch();
  const [selectedSleep, setSelectedSleep] = useState(60);
  const [autoStart, setAutoStart] = useState(false);
  const [wakeHour, setWakeHour] = useState(8);
  const [sleepHour, setSleepHour] = useState(22);
  const [loading, setLoading] = useState(true);

  // Load schedule preferences from storage
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const schedule = await Storage.get('schedule');
        if (schedule) {
          if (schedule.selectedSleep !== undefined) setSelectedSleep(schedule.selectedSleep);
          if (schedule.autoStart !== undefined) setAutoStart(schedule.autoStart);
          if (schedule.wakeHour !== undefined) setWakeHour(schedule.wakeHour);
          if (schedule.sleepHour !== undefined) setSleepHour(schedule.sleepHour);
        }
      } catch (err) {
        console.log('Failed to load schedule from storage:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  // Auto-save daily schedule options when they change
  useEffect(() => {
    if (loading) return;
    Storage.set('schedule', { selectedSleep, autoStart, wakeHour, sleepHour });
  }, [selectedSleep, autoStart, wakeHour, sleepHour, loading]);

  const handleApplySleep = async () => {
    HapticService.medium();
    dispatch(setSleepTimer(selectedSleep));
    try {
      await FluidNCService.setSleepTimer(selectedSleep);
      Alert.alert('Set!', selectedSleep === 0
        ? 'Table will run until manually stopped.'
        : `Table will sleep after ${selectedSleep} minutes.`);
    } catch {
      Alert.alert('Applied locally', 'Sleep timer set.');
    }
  };

  const handleSleepSelect = (val) => {
    HapticService.light();
    setSelectedSleep(val);
  };

  const handleToggleAutoStart = (val) => {
    HapticService.medium();
    setAutoStart(val);
  };

  const adjustWake = (increment) => {
    HapticService.light();
    if (increment) {
      setWakeHour(prev => Math.min(23, prev + 1));
    } else {
      setWakeHour(prev => Math.max(0, prev - 1));
    }
  };

  const adjustSleep = (increment) => {
    HapticService.light();
    if (increment) {
      setSleepHour(prev => Math.min(23, prev + 1));
    } else {
      setSleepHour(prev => Math.max(0, prev - 1));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            HapticService.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Sleep Timer */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="moon" size={22} color={Colors.accent} />
            <Text style={styles.cardTitle}>Sleep Timer</Text>
          </View>
          <Text style={styles.cardDesc}>Table will automatically stop after selected time</Text>
          <View style={styles.optionsGrid}>
            {SLEEP_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, selectedSleep === opt.value && styles.optionBtnActive]}
                onPress={() => handleSleepSelect(opt.value)}
              >
                <Text style={[styles.optionText, selectedSleep === opt.value && styles.optionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApplySleep}>
            <LinearGradient colors={Colors.gradientAccent} style={styles.applyBtnGrad}>
              <Text style={styles.applyBtnText}>Apply Timer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Auto Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="alarm" size={22} color={Colors.primary} />
            <Text style={styles.cardTitle}>Daily Schedule</Text>
            <Switch
              value={autoStart}
              onValueChange={handleToggleAutoStart}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.textPrimary}
              style={{ marginLeft: 'auto' }}
            />
          </View>
          <Text style={styles.cardDesc}>Table auto starts and stops at set times every day</Text>

          {autoStart && (
            <View style={styles.timeGrid}>
              <View style={styles.timeCard}>
                <Ionicons name="sunny" size={20} color={Colors.primary} />
                <Text style={styles.timeLabel}>Wake Up</Text>
                <View style={styles.timeDisplay}>
                  <TouchableOpacity onPress={() => adjustWake(false)}>
                    <Ionicons name="chevron-up" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{wakeHour.toString().padStart(2, '0')}:00</Text>
                  <TouchableOpacity onPress={() => adjustWake(true)}>
                    <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timeCard}>
                <Ionicons name="moon" size={20} color={Colors.accent} />
                <Text style={styles.timeLabel}>Sleep</Text>
                <View style={styles.timeDisplay}>
                  <TouchableOpacity onPress={() => adjustSleep(false)}>
                    <Ionicons name="chevron-up" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{sleepHour.toString().padStart(2, '0')}:00</Text>
                  <TouchableOpacity onPress={() => adjustSleep(true)}>
                    <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: Colors.textSecondary, fontSize: 16 },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  optionBtnActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  optionText: { fontSize: 13, color: Colors.textSecondary },
  optionTextActive: { color: Colors.accent, fontWeight: '600' },
  applyBtn: { borderRadius: 12, overflow: 'hidden' },
  applyBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  applyBtnText: { color: Colors.background, fontSize: 15, fontWeight: '700' },
  timeGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  timeCard: {
    flex: 1, backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12, padding: 14, alignItems: 'center', gap: 8,
  },
  timeLabel: { fontSize: 13, color: Colors.textSecondary },
  timeDisplay: { alignItems: 'center', gap: 4 },
  timeValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
});
