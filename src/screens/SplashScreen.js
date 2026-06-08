// src/screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const loadProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate rings
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring2Anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(ring2Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }, 700);

    // Animate loading bar progress
    Animated.timing(loadProgress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Animate logo
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(logoAnim, {
        toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();

    // Navigate after splash
    const timer = setTimeout(async () => {
      try {
        const onboarded = await AsyncStorage.getItem('onboarded');
        const tableData = await AsyncStorage.getItem('tableData');
        if (!onboarded) {
          navigation.replace('Onboarding');
        } else if (!tableData) {
          navigation.replace('Connect');
        } else {
          navigation.replace('Main');
        }
      } catch {
        navigation.replace('Onboarding');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.2, 0] });
  const ring2Scale = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.1, 0] });
  const fillWidth = loadProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <LinearGradient
      colors={['#0A0A0F', '#12121A', '#0A0A0F']}
      style={styles.container}
    >
      {/* Animated rings */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, {
        opacity: logoAnim,
        transform: [{ scale: logoAnim }],
      }]}>
        <LinearGradient
          colors={['#C9A84C', '#A07830']}
          style={styles.logoCircle}
        >
          <Text style={styles.logoIcon}>◉</Text>
        </LinearGradient>
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ opacity: textAnim, alignItems: 'center' }}>
        <Text style={styles.appName}>SandTable</Text>
        <Text style={styles.tagline}>Art in Motion</Text>
      </Animated.View>

      {/* Bottom */}
      <Animated.View style={[styles.bottom, { opacity: textAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill, { width: fillWidth }]} />
        </View>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ring2: {
    borderColor: Colors.accent,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  logoIcon: {
    fontSize: 50,
    color: Colors.background,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 4,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  bottom: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  loadingBar: {
    width: 120,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
