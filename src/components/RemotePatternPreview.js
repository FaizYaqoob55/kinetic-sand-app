// Remote SVG thumbnail from patterns-zanvora-sand repo
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import PatternRemoteService from '../services/PatternRemoteService';
import { SandPreview } from './SandPreview';

const AMBER = '#F0A030';

const fetchSvgText = async (uri) => {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`SVG fetch failed: ${res.status}`);
  return res.text();
};

export const RemotePatternPreview = ({ pattern, size = 80, style }) => {
  const [uri, setUri] = useState(null);
  const [svgXml, setSvgXml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUri(null);
    setSvgXml(null);

    if (!pattern?.isRemote && !pattern?.previewSvg) {
      return undefined;
    }

    PatternRemoteService.getPreviewUri(pattern)
      .then(async (u) => {
        if (!active || !u) return;
        setUri(u);
        if (Platform.OS === 'web') return;
        try {
          const xml = await fetchSvgText(u);
          if (active) setSvgXml(xml);
        } catch {
          if (active) setFailed(true);
        }
      })
      .catch(() => { if (active) setFailed(true); });

    return () => { active = false; };
  }, [pattern?.id, pattern?.slug]);

  if (!pattern?.isRemote && !pattern?.previewUrl) {
    return <SandPreview patternId={pattern?.id} size={size} />;
  }

  if (failed) {
    return (
      <View style={[st.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <SandPreview patternId={pattern?.id} size={size * 0.7} />
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[st.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <ActivityIndicator size="small" color={AMBER} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[{ width: size, height: size, overflow: 'hidden', borderRadius: size / 2 }, style]}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  if (!svgXml) {
    return (
      <View style={[st.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
        <ActivityIndicator size="small" color={AMBER} />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden', borderRadius: size / 2 }, style]}>
      <SvgXml xml={svgXml} width={size} height={size} />
    </View>
  );
};

const st = StyleSheet.create({
  fallback: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RemotePatternPreview;
