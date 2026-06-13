// Remote SVG thumbnail from patterns-zanvora-sand repo
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import PatternRemoteService from '../services/PatternRemoteService';
import { SandPreview } from './SandPreview';

const AMBER = '#F0A030';

export const RemotePatternPreview = ({ pattern, size = 80, style }) => {
  const [uri, setUri] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUri(null);

    if (!pattern?.isRemote && !pattern?.previewSvg) {
      return undefined;
    }

    PatternRemoteService.getPreviewUri(pattern)
      .then((u) => { if (active && u) setUri(u); })
      .catch(() => { if (active) setFailed(true); });

    return () => { active = false; };
  }, [pattern?.id, pattern?.slug]);

  if (!pattern?.isRemote && !pattern?.previewUrl) {
    return <SandPreview patternId={pattern?.id} size={size} />;
  }

  if (failed || !uri) {
    return (
      <View style={[st.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
        {!failed ? (
          <ActivityIndicator size="small" color={AMBER} />
        ) : (
          <SandPreview patternId={pattern?.id} size={size * 0.7} />
        )}
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden', borderRadius: size / 2 }, style]}>
      <SvgUri uri={uri} width={size} height={size} />
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
