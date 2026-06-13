// src/screens/ScheduleScreen.js — Timer (reference design)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import FluidNCService from '../services/FluidNCService';
import { setSleepTimer, setWakeTime } from '../store/tableSlice';
import Storage from '../utils/storage';
import HapticService from '../services/HapticService';
import TimerDial from '../components/TimerDial';

const AMBER = '#F0A030';
const AMBER_DARK = '#C07A20';
const BG = '#000000';

const QUICK = [
  { label: '15', sub: 'min', value: 15 },
  { label: '30', sub: 'min', value: 30 },
  { label: '45', sub: 'min', value: 45 },
  { label: '60', sub: 'min', value: 60 },
];

const formatLabel = (min) => {
  if (!min) return 'Off';
  if (min < 60) return `${min} min`;
  if (min === 60) return '1 hour';
  if (min % 60 === 0) return `${min / 60} hours`;
  return `${min} min`;
};

const SettingRow = ({ icon, iconColor, title, desc, children }) => (
  <View style={st.settingRow}>
    <View style={[st.settingIcon, { backgroundColor: `${iconColor}18` }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={st.settingBody}>
      <Text style={st.settingTitle}>{title}</Text>
      {desc ? <Text style={st.settingDesc}>{desc}</Text> : null}
    </View>
    {children}
  </View>
);

export default function ScheduleScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { isConnected } = useSelector((s) => s.table);

  const [loading, setLoading] = useState(true);
  const [selectedMin, setSelectedMin] = useState(30);
  const [customMin, setCustomMin] = useState(30);
  const [showCustom, setShowCustom] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [totalMs, setTotalMs] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [ledOff, setLedOff] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [wakeHour, setWakeHour] = useState(8);
  const [sleepHour, setSleepHour] = useState(22);
  const expiredRef = useRef(false);

  const isActive = endAt !== null && remaining > 0;
  const dialMinutes = showCustom ? customMin : selectedMin;

  const persist = useCallback(async (data) => {
    const existing = (await Storage.get('schedule')) || {};
    await Storage.set('schedule', { ...existing, ...data });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const saved = await Storage.get('schedule');
      if (saved) {
        if (saved.selectedSleep !== undefined) {
          const m = saved.selectedSleep || 30;
          setSelectedMin(m);
          setCustomMin(m);
          setShowCustom(!QUICK.some((q) => q.value === m));
        }
        if (saved.autoStart !== undefined) setAutoStart(saved.autoStart);
        if (saved.wakeHour !== undefined) setWakeHour(saved.wakeHour);
        if (saved.sleepHour !== undefined) setSleepHour(saved.sleepHour);
        if (saved.ledOff !== undefined) setLedOff(saved.ledOff);
        if (saved.timerEndAt && saved.timerEndAt > Date.now()) {
          setEndAt(saved.timerEndAt);
          setTotalMs(saved.timerTotalMs || 0);
          setRemaining(saved.timerEndAt - Date.now());
        }
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (loading) return;
    persist({ selectedSleep: showCustom ? customMin : selectedMin, autoStart, wakeHour, sleepHour, ledOff });
  }, [selectedMin, customMin, showCustom, autoStart, wakeHour, sleepHour, ledOff, loading, persist]);

  const handleExpire = useCallback(async () => {
    HapticService.heavy();
    setEndAt(null);
    setTotalMs(0);
    dispatch(setSleepTimer(0));
    await persist({ timerEndAt: null, timerTotalMs: 0 });
    if (isConnected) {
      try {
        await FluidNCService.stop();
        if (ledOff) await FluidNCService.turnOffLED();
      } catch {}
    }
    Alert.alert('Timer Complete', 'Your sand table has been stopped.');
  }, [isConnected, ledOff, dispatch, persist]);

  useEffect(() => {
    if (!endAt) {
      setRemaining(0);
      return undefined;
    }
    expiredRef.current = false;
    const tick = () => {
      const left = Math.max(0, endAt - Date.now());
      setRemaining(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        handleExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt, handleExpire]);

  const startTimer = async (minutes) => {
    if (!minutes) return cancelTimer();
    HapticService.medium();
    expiredRef.current = false;
    const ms = minutes * 60 * 1000;
    const newEnd = Date.now() + ms;
    setEndAt(newEnd);
    setTotalMs(ms);
    setRemaining(ms);
    setSelectedMin(minutes);
    setCustomMin(minutes);
    setShowCustom(!QUICK.some((q) => q.value === minutes));
    dispatch(setSleepTimer(minutes));
    await persist({ timerEndAt: newEnd, timerTotalMs: ms, selectedSleep: minutes });
    if (isConnected) {
      try { await FluidNCService.setSleepTimer(minutes); } catch {}
    }
  };

  const cancelTimer = async () => {
    HapticService.light();
    expiredRef.current = false;
    setEndAt(null);
    setTotalMs(0);
    setRemaining(0);
    dispatch(setSleepTimer(0));
    await persist({ timerEndAt: null, timerTotalMs: 0 });
    if (isConnected) {
      try { await FluidNCService.setSleepTimer(0); } catch {}
    }
  };

  const pickQuick = (value) => {
    HapticService.light();
    setShowCustom(false);
    setSelectedMin(value);
    setCustomMin(value);
    if (isActive) startTimer(value);
  };

  const onDialChange = (min) => {
    if (showCustom) {
      setCustomMin(min);
    } else {
      setSelectedMin(min);
      setCustomMin(min);
      setShowCustom(!QUICK.some((q) => q.value === min));
    }
  };

  const adjustCustom = (delta) => {
    HapticService.light();
    const next = Math.max(5, Math.min(480, customMin + delta));
    setCustomMin(next);
    if (isActive) startTimer(next);
  };

  const adjustHour = (type, up) => {
    HapticService.light();
    if (type === 'wake') setWakeHour((h) => (up ? Math.min(23, h + 1) : Math.max(0, h - 1)));
    else setSleepHour((h) => (up ? Math.min(23, h + 1) : Math.max(0, h - 1)));
  };

  const saveDailySchedule = () => {
    HapticService.medium();
    dispatch(setWakeTime({ wakeHour, sleepHour, enabled: autoStart }));
    persist({ autoStart, wakeHour, sleepHour });
  };

  const activeMinutes = showCustom ? customMin : selectedMin;

  if (loading) {
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.loadingTxt}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }]}
      >
        {/* Header — centered title, stopwatch top-right */}
        <View style={st.headerWrap}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={st.backBtn}
              onPress={() => { HapticService.light(); navigation.goBack(); }}
            >
              <Ionicons name="chevron-back" size={22} color="#CCC" />
            </TouchableOpacity>
          )}
          <View style={st.headerCenter}>
            <Text style={st.title}>Timer</Text>
            <Text style={st.subtitle}>Set a timer for your relaxation session</Text>
          </View>
          {!navigation.canGoBack() ? (
            <TouchableOpacity
              style={st.timerIconBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="stopwatch-outline" size={20} color="#CCC" />
            </TouchableOpacity>
          ) : (
            <View style={st.headerSpacer} />
          )}
        </View>

        <View style={st.heroWrap}>
          <Image
            source={require('../assets/timer-hero.png')}
            style={st.heroImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', '#000']}
            style={st.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* Circular dial */}
        <View style={st.dialWrap}>
          <TimerDial
            minutes={dialMinutes}
            onChange={onDialChange}
            isActive={isActive}
            remainingMs={remaining}
            totalMs={totalMs}
          />
        </View>

        {/* Quick Select */}
        <Text style={st.sectionLabel}>Quick Select</Text>
        <View style={st.quickRow}>
          {QUICK.map((p) => {
            const on = !showCustom && selectedMin === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[st.quickBtn, !on && st.quickBtnOff, on && st.quickBtnOn]}
                onPress={() => pickQuick(p.value)}
                activeOpacity={0.85}
              >
                {on ? (
                  <LinearGradient colors={['#FFB84D', '#E6A33E', AMBER_DARK]} style={st.quickGrad}>
                    <Text style={st.quickLblOn}>{p.label}</Text>
                    <Text style={st.quickSubOn}>{p.sub}</Text>
                  </LinearGradient>
                ) : (
                  <View style={st.quickInner}>
                    <Text style={st.quickLbl}>{p.label}</Text>
                    <Text style={st.quickSub}>{p.sub}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[st.quickBtn, !showCustom && st.quickBtnOff, showCustom && st.quickBtnOn]}
            onPress={() => { HapticService.light(); setShowCustom(true); }}
            activeOpacity={0.85}
          >
            {showCustom ? (
              <LinearGradient colors={['#FFB84D', '#E6A33E', AMBER_DARK]} style={st.quickGrad}>
                <Ionicons name="add" size={18} color="#1A1208" />
                <Text style={st.quickSubOn}>Custom</Text>
              </LinearGradient>
            ) : (
              <View style={st.quickInner}>
                <Ionicons name="add" size={18} color="#AAA" />
                <Text style={st.quickSub}>Custom</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showCustom && (
          <View style={st.customRow}>
            <TouchableOpacity style={st.stepBtn} onPress={() => adjustCustom(-5)}>
              <Ionicons name="remove" size={22} color="#AAA" />
            </TouchableOpacity>
            <View style={st.customMid}>
              <Text style={st.customNum}>{customMin}</Text>
              <Text style={st.customUnit}>minutes</Text>
            </View>
            <TouchableOpacity style={st.stepBtn} onPress={() => adjustCustom(5)}>
              <Ionicons name="add" size={22} color="#AAA" />
            </TouchableOpacity>
          </View>
        )}

        {isActive ? (
          <TouchableOpacity style={st.stopBtn} onPress={cancelTimer} activeOpacity={0.85}>
            <Ionicons name="stop" size={18} color="#FF7B7B" />
            <Text style={st.stopTxt}>Stop Timer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={st.startBtn}
            onPress={() => startTimer(activeMinutes)}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#FFB84D', AMBER, AMBER_DARK]} style={st.startGrad}>
              <Text style={st.startTxt}>Start {formatLabel(activeMinutes)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Settings */}
        <Text style={[st.sectionLabel, { marginTop: 24 }]}>Settings</Text>
        <View style={st.settingsCard}>
          <SettingRow icon="bulb-outline" iconColor={AMBER} title="Turn off lights" desc="When timer ends">
            <Switch
              value={ledOff}
              onValueChange={(v) => { HapticService.light(); setLedOff(v); }}
              trackColor={{ false: '#2A2A2A', true: 'rgba(240,160,48,0.35)' }}
              thumbColor={ledOff ? AMBER : '#666'}
            />
          </SettingRow>
          <View style={st.rowDivider} />
          <SettingRow icon="stop-circle-outline" iconColor="#FF7B7B" title="Stop pattern" desc="Halts sand motion automatically">
            <Ionicons name="checkmark-circle" size={22} color={AMBER} />
          </SettingRow>
        </View>

        <View style={st.settingsCard}>
          <SettingRow icon="calendar-outline" iconColor={AMBER} title="Daily Schedule" desc="Auto wake & sleep times">
            <Switch
              value={autoStart}
              onValueChange={(v) => { HapticService.medium(); setAutoStart(v); }}
              trackColor={{ false: '#2A2A2A', true: 'rgba(240,160,48,0.35)' }}
              thumbColor={autoStart ? AMBER : '#666'}
            />
          </SettingRow>

          {autoStart && (
            <>
              <View style={st.rowDivider} />
              <View style={st.timeRow}>
                <View style={st.timeBlock}>
                  <Ionicons name="sunny-outline" size={18} color={AMBER} />
                  <Text style={st.timeLbl}>Wake</Text>
                  <View style={st.timeCtrl}>
                    <TouchableOpacity onPress={() => adjustHour('wake', true)} hitSlop={8}>
                      <Ionicons name="chevron-up" size={18} color="#666" />
                    </TouchableOpacity>
                    <Text style={st.timeVal}>{String(wakeHour).padStart(2, '0')}:00</Text>
                    <TouchableOpacity onPress={() => adjustHour('wake', false)} hitSlop={8}>
                      <Ionicons name="chevron-down" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={st.timeDivider} />
                <View style={st.timeBlock}>
                  <Ionicons name="moon-outline" size={18} color="#9B7FD4" />
                  <Text style={st.timeLbl}>Sleep</Text>
                  <View style={st.timeCtrl}>
                    <TouchableOpacity onPress={() => adjustHour('sleep', true)} hitSlop={8}>
                      <Ionicons name="chevron-up" size={18} color="#666" />
                    </TouchableOpacity>
                    <Text style={st.timeVal}>{String(sleepHour).padStart(2, '0')}:00</Text>
                    <TouchableOpacity onPress={() => adjustHour('sleep', false)} hitSlop={8}>
                      <Ionicons name="chevron-down" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={st.saveBtn} onPress={saveDailySchedule}>
                <Text style={st.saveBtnTxt}>Save Daily Schedule</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={st.foreverBtn} onPress={cancelTimer} activeOpacity={0.8}>
          <Ionicons name="infinite" size={18} color="#555" />
          <Text style={st.foreverTxt}>Run until manually stopped</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: '#666', fontSize: 14 },
  scroll: { paddingHorizontal: 20 },

  headerWrap: { alignItems: 'center', marginBottom: 12, position: 'relative', minHeight: 56, flexDirection: 'row' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSpacer: { width: 40 },
  title: { fontSize: 22, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
  timerIconBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },

  heroWrap: {
    width: '100%',
    aspectRatio: 876 / 242,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#0A0A0A',
  },
  heroImg: { width: '100%', height: '100%' },
  heroFade: { ...StyleSheet.absoluteFillObject },

  dialWrap: { alignItems: 'center', marginVertical: 8 },

  startBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20, marginTop: 12 },
  startGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  startTxt: { fontSize: 16, fontWeight: '700', color: '#1A1208' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, marginBottom: 24, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(255,123,123,0.25)', backgroundColor: 'rgba(255,80,80,0.06)',
  },
  stopTxt: { fontSize: 16, fontWeight: '600', color: '#FF7B7B' },

  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 12 },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, height: 68, borderRadius: 16, overflow: 'hidden' },
  quickBtnOff: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#2A2A2A' },
  quickBtnOn: {
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  quickGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  quickInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  quickLbl: { fontSize: 17, fontWeight: '700', color: '#AAA' },
  quickLblOn: { fontSize: 17, fontWeight: '700', color: '#1A1208' },
  quickSub: { fontSize: 10, color: '#555', fontWeight: '500' },
  quickSubOn: { fontSize: 10, color: '#1A1208', fontWeight: '600', opacity: 0.8 },

  customRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 28, paddingVertical: 8, marginBottom: 8,
  },
  stepBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#141414',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#242424',
  },
  customMid: { alignItems: 'center', minWidth: 80 },
  customNum: { fontSize: 40, fontWeight: '300', color: '#FFF' },
  customUnit: { fontSize: 12, color: '#555', marginTop: -2 },

  settingsCard: {
    backgroundColor: '#0D0D0D', borderRadius: 18, padding: 4,
    borderWidth: 1, borderColor: '#1E1E1E', marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  settingBody: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#EEE' },
  settingDesc: { fontSize: 12, color: '#555', marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: '#1A1A1A', marginHorizontal: 14 },

  timeRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 14 },
  timeBlock: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8 },
  timeDivider: { width: 1, backgroundColor: '#1A1A1A', marginVertical: 8 },
  timeLbl: { fontSize: 11, color: '#555', fontWeight: '600' },
  timeCtrl: { alignItems: 'center', gap: 2 },
  timeVal: { fontSize: 28, fontWeight: '300', color: '#FFF', fontVariant: ['tabular-nums'] },
  saveBtn: {
    marginHorizontal: 14, marginBottom: 12, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#141414', alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  saveBtnTxt: { fontSize: 13, fontWeight: '600', color: AMBER },

  foreverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, marginTop: 4,
  },
  foreverTxt: { fontSize: 13, color: '#444', fontWeight: '500' },
});
