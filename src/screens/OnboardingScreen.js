// src/screens/OnboardingScreen.js
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';
import HapticService from '../services/HapticService';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'infinite-outline',
    title: 'Welcome to SandTable',
    subtitle: 'Experience a kinetic art masterpiece that draws beautiful, intricate patterns in sand endlessly.',
    color: Colors.primary,
    glow: 'rgba(201, 168, 76, 0.25)',
  },
  {
    id: '2',
    icon: 'wifi-outline',
    title: 'Instant WiFi Connect',
    subtitle: 'Link your mobile app with the SandTable using a simple IP address over your home network.',
    color: Colors.accent,
    glow: 'rgba(76, 158, 255, 0.25)',
  },
  {
    id: '3',
    icon: 'shapes-outline',
    title: '58+ Majestic Patterns',
    subtitle: 'Choose from geometric, nature, mandalas, and mathematical fractals to start sketching.',
    color: '#FF6B9D',
    glow: 'rgba(255, 107, 157, 0.25)',
  },
  {
    id: '4',
    icon: 'bulb-outline',
    title: 'Atmospheric Lighting',
    subtitle: 'Personalize the integrated RGB LED ring with customized color palettes and live ambient effects.',
    color: Colors.success,
    glow: 'rgba(76, 175, 130, 0.25)',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    HapticService.medium();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    HapticService.success();
    await AsyncStorage.setItem('onboarded', 'true');
    navigation.replace('Connect');
  };

  return (
    <LinearGradient colors={['#06060A', '#0D0D15']} style={styles.container}>
      {/* Dynamic ambient background glow circles matching current slide colors */}
      <View style={[styles.glowBall, { backgroundColor: SLIDES[currentIndex].color, top: '20%', left: '15%' }]} />
      <View style={[styles.glowBall, { backgroundColor: SLIDES[currentIndex].color, bottom: '20%', right: '15%' }]} />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Animated.View style={[
              styles.iconCircle,
              {
                borderColor: item.color,
                shadowColor: item.color,
                transform: [{ scale: pulseAnim }],
                backgroundColor: 'rgba(255,255,255,0.02)'
              }
            ]}>
              <Ionicons name={item.icon} size={64} color={item.color} />
              <View style={[styles.innerGlow, { backgroundColor: item.glow }]} />
            </Animated.View>
            
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Progress Dots Indicator */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && styles.dotActive, currentIndex === i && { backgroundColor: SLIDES[currentIndex].color }]}
          />
        ))}
      </View>

      {/* Control Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleGetStarted} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.nextBtnGrad}>
            <Text style={styles.nextBtnText}>
              {currentIndex === SLIDES.length - 1 ? "Let's Begin" : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowBall: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
    blurRadius: 100,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 44,
    position: 'relative',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  innerGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    opacity: 0.15,
    zIndex: -1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    width: 24,
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 20,
    alignItems: 'center',
  },
  skipBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
