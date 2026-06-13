// src/components/ColorWheelPicker.js — Centered hue wheel picker
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Dimensions, PanResponder, Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import HapticService from '../services/HapticService';

const { width, height } = Dimensions.get('window');
const CARD_W = Math.min(width - 48, 340);
const WHEEL_SIZE = CARD_W - 32;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const OUTER_R = WHEEL_SIZE / 2 - 6;
const INNER_R = OUTER_R * 0.58;
const GOLD = '#D4A373';

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, v };
}

export function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0; let gp = 0; let bp = 0;
  if (h < 60) { rp = c; gp = x; }
  else if (h < 120) { rp = x; gp = c; }
  else if (h < 180) { gp = c; bp = x; }
  else if (h < 240) { gp = x; bp = c; }
  else if (h < 300) { rp = x; bp = c; }
  else { rp = c; bp = x; }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r1, r2, a1, a2) {
  const s1 = polar(cx, cy, r1, a1);
  const e1 = polar(cx, cy, r1, a2);
  const s2 = polar(cx, cy, r2, a2);
  const e2 = polar(cx, cy, r2, a1);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${s1.x} ${s1.y} A ${r1} ${r1} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
}

function hslColor(h) {
  return `hsl(${h}, 100%, 50%)`;
}

const MiniSlider = ({ value, onChange, colors, width: sliderW }) => {
  const trackW = useRef(sliderW);
  const thumbX = useRef(new Animated.Value(value * sliderW)).current;

  useEffect(() => {
    thumbX.setValue(value * trackW.current);
  }, [value, thumbX]);

  const update = (x) => {
    const c = Math.max(0, Math.min(trackW.current, x));
    thumbX.setValue(c);
    onChange(c / trackW.current);
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
    onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    onPanResponderRelease: () => HapticService.light(),
  })).current;

  return (
    <View
      style={[ms.track, { width: sliderW }]}
      onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={[StyleSheet.absoluteFill, ms.trackBg]}>
        {colors.map((c, i) => (
          <View key={i} style={[ms.segment, { backgroundColor: c, flex: 1 }]} />
        ))}
      </View>
      <Animated.View style={[ms.thumb, { left: thumbX }]} />
    </View>
  );
};

const notifyColor = (hsvState, onColorChange) => {
  if (!onColorChange) return;
  const rgb = hsvToRgb(hsvState.h, hsvState.s, hsvState.v);
  onColorChange({
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    hex: hsvToHex(hsvState.h, hsvState.s, hsvState.v),
  });
};

export default function ColorWheelPicker({ visible, initialRgb, onClose, onApply, onColorChange }) {
  const [hsv, setHsv] = useState(rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b));
  const sliderW = CARD_W - 48;

  useEffect(() => {
    if (visible) {
      const next = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);
      setHsv(next);
      notifyColor(next, onColorChange);
    }
  }, [visible, initialRgb.r, initialRgb.g, initialRgb.b]);

  const updateHsv = (updater) => {
    setHsv((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      notifyColor(next, onColorChange);
      return next;
    });
  };

  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const previewRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);

  const segments = useMemo(() => {
    const n = 120;
    const step = 360 / n;
    return Array.from({ length: n }, (_, i) => {
      const hue = i * step;
      return (
        <Path
          key={i}
          d={arcPath(CX, CY, INNER_R, OUTER_R, hue, hue + step + 0.2)}
          fill={hslColor(hue)}
        />
      );
    });
  }, []);

  const indicatorR = (INNER_R + OUTER_R) / 2;
  const ind = polar(CX, CY, indicatorR, hsv.h);
  const centerSize = (INNER_R - 10) * 2;

  const pickColor = (lx, ly) => {
    const dx = lx - CX;
    const dy = ly - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > OUTER_R + 8) return;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (dist >= INNER_R - 6) {
      updateHsv((prev) => ({ ...prev, h: angle }));
    } else {
      const s = Math.max(0.08, Math.min(1, dist / (INNER_R - 10)));
      updateHsv((prev) => ({ ...prev, h: angle, s }));
    }
  };

  const wheelPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => pickColor(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderMove: (e) => pickColor(e.nativeEvent.locationX, e.nativeEvent.locationY),
  })).current;

  const handleApply = () => {
    HapticService.medium();
    onApply({ r: previewRgb.r, g: previewRgb.g, b: previewRgb.b, hex });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={st.card}>
          <TouchableOpacity style={st.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#AAA" />
          </TouchableOpacity>

          <View style={st.wheelOuter} {...wheelPan.panHandlers}>
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
              {segments}
              <Circle
                cx={CX}
                cy={CY}
                r={OUTER_R + 3}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={2}
              />
              <Circle
                cx={CX}
                cy={CY}
                r={INNER_R}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
              />
              <Circle cx={ind.x} cy={ind.y} r={14} fill="#FFF" stroke="#222" strokeWidth={2} />
              <Circle cx={ind.x} cy={ind.y} r={10} fill={hex} />
            </Svg>

            <View
              pointerEvents="none"
              style={[
                st.centerPreview,
                {
                  width: centerSize,
                  height: centerSize,
                  borderRadius: centerSize / 2,
                  backgroundColor: hex,
                  top: CY - centerSize / 2,
                  left: CX - centerSize / 2,
                },
              ]}
            />
          </View>

          <Text style={st.hex}>{hex}</Text>

          <View style={st.sliders}>
            <MiniSlider
              value={hsv.s}
              sliderW={sliderW}
              colors={[hsvToHex(hsv.h, 0, hsv.v), hsvToHex(hsv.h, 1, hsv.v)]}
              onChange={(v) => updateHsv((p) => ({ ...p, s: v }))}
            />
            <MiniSlider
              value={hsv.v}
              sliderW={sliderW}
              colors={['#111', hsvToHex(hsv.h, hsv.s, 1)]}
              onChange={(v) => updateHsv((p) => ({ ...p, v: v }))}
            />
          </View>

          <TouchableOpacity style={st.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={st.applyTxt}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: height,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#111111',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242424',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  wheelOuter: {
    marginTop: 8,
    marginBottom: 16,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignSelf: 'center',
  },
  centerPreview: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  hex: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  sliders: { gap: 12, marginBottom: 20, width: '100%', alignItems: 'center' },
  applyBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    minWidth: CARD_W - 48,
    alignItems: 'center',
  },
  applyTxt: { fontSize: 16, fontWeight: '700', color: '#1A1208' },
});

const ms = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  trackBg: { flexDirection: 'row', borderRadius: 5, overflow: 'hidden' },
  segment: { height: 10 },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    top: -6,
    marginLeft: -11,
    borderWidth: 2,
    borderColor: '#DDD',
    elevation: 4,
  },
});
