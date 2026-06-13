// src/components/TimerDial.js — Circular timer dial with glow arc
import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import Svg, { Line, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import HapticService from '../services/HapticService';

const AMBER = '#F0A030';
const AMBER_BRIGHT = '#FFB84D';
const DIAL = 310;
const CX = DIAL / 2;
const CY = DIAL / 2;
const TICK_OUTER = 142;
const TICK_INNER = 126;
const ARC_R = 134;
const CIRC = 2 * Math.PI * ARC_R;

const polar = (r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

const minuteToAngle = (min) => (Math.min(60, Math.max(0, min)) / 60) * 360;

export default function TimerDial({
  minutes,
  onChange,
  isActive,
  remainingMs,
  totalMs,
  centerLabel = 'Time Left',
}) {
  const displayMin = isActive && totalMs > 0
    ? Math.ceil(remainingMs / 60000)
    : Math.min(60, minutes);

  const arcProgress = isActive && totalMs > 0
    ? remainingMs / totalMs
    : displayMin / 60;

  const arcOffset = CIRC * (1 - arcProgress);
  const thumbAngle = isActive ? arcProgress * 360 : minuteToAngle(displayMin);
  const thumb = polar(ARC_R, thumbAngle);

  const centerMain = isActive
    ? formatCenter(remainingMs)
    : minutes >= 60
      ? `${minutes}:00`
      : `${String(minutes).padStart(2, '0')}:00`;

  const pickMinute = (lx, ly) => {
    if (isActive) return;
    const dx = lx - CX;
    const dy = ly - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < TICK_INNER - 24 || dist > TICK_OUTER + 24) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    const raw = Math.round((angle / 360) * 60);
    const snapped = Math.max(5, Math.min(60, Math.round(raw / 5) * 5));
    onChange(snapped);
    HapticService.light();
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !isActive,
    onMoveShouldSetPanResponder: () => !isActive,
    onPanResponderGrant: (e) => pickMinute(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderMove: (e) => pickMinute(e.nativeEvent.locationX, e.nativeEvent.locationY),
  })).current;

  const ticks = useMemo(() => (
    Array.from({ length: 60 }, (_, i) => {
      const deg = (i / 60) * 360;
      const major = i % 5 === 0;
      const outer = major ? TICK_OUTER : TICK_OUTER - 6;
      const p1 = polar(TICK_INNER, deg);
      const p2 = polar(outer, deg);
      return (
        <Line
          key={i}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={major ? '#4A4A4A' : '#222'}
          strokeWidth={major ? 1.5 : 1}
        />
      );
    })
  ), []);

  const labels = [
    { t: '0', deg: 0 },
    { t: '15', deg: 90 },
    { t: '30', deg: 180 },
    { t: '45', deg: 270 },
  ];

  return (
    <View style={st.wrap} {...pan.panHandlers}>
      <Svg width={DIAL} height={DIAL}>
        <Defs>
          <LinearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8A5020" stopOpacity="1" />
            <Stop offset="50%" stopColor={AMBER} stopOpacity="1" />
            <Stop offset="100%" stopColor={AMBER_BRIGHT} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G>{ticks}</G>
        <Circle cx={CX} cy={CY} r={ARC_R} stroke="#141414" strokeWidth={10} fill="none" />
        <Circle
          cx={CX}
          cy={CY}
          r={ARC_R}
          stroke="url(#arcGrad)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={arcOffset}
          rotation="-90"
          origin={`${CX}, ${CY}`}
          opacity={0.35}
        />
        <Circle
          cx={CX}
          cy={CY}
          r={ARC_R}
          stroke="url(#arcGrad)"
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={arcOffset}
          rotation="-90"
          origin={`${CX}, ${CY}`}
        />
        <Circle cx={thumb.x} cy={thumb.y} r={14} fill="rgba(255,184,77,0.25)" />
        <Circle cx={thumb.x} cy={thumb.y} r={10} fill="#FFF" />
        <Circle cx={thumb.x} cy={thumb.y} r={5} fill={AMBER_BRIGHT} />
      </Svg>

      {labels.map((l) => {
        const p = polar(TICK_OUTER + 20, l.deg);
        return (
          <Text key={l.t} style={[st.dialLabel, { left: p.x - 10, top: p.y - 8 }]}>
            {l.t}
          </Text>
        );
      })}

      <View style={st.center} pointerEvents="none">
        <Text style={st.centerLbl}>{centerLabel}</Text>
        <Text style={st.centerTime}>{centerMain}</Text>
        <Text style={st.centerUnit}>min</Text>
      </View>
    </View>
  );
}

function formatCenter(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const st = StyleSheet.create({
  wrap: { width: DIAL, height: DIAL, alignSelf: 'center' },
  dialLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    width: 20,
    textAlign: 'center',
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  centerLbl: { fontSize: 13, color: '#888', marginBottom: 4 },
  centerTime: { fontSize: 44, fontWeight: '700', color: '#FFF', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  centerUnit: { fontSize: 13, color: '#888', marginTop: 2 },
});
