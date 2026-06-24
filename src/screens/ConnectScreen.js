// src/screens/ConnectScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Animated, Dimensions, TextInput,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import Colors from '../constants/colors';
import FluidNCService from '../services/FluidNCService';
import WebSocketService from '../services/WebSocketService';
import { setConnected } from '../store/tableSlice';
import HapticService from '../services/HapticService';

const { width, height } = Dimensions.get('window');

export default function ConnectScreen({ navigation }) {
  const dispatch = useDispatch();
  const [connecting, setConnecting] = useState(false);
  const [manualIP, setManualIP] = useState('');
  const [scanning, setScanning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elegant slow rotation for background element
    Animated.loop(
      Animated.timing(logoSpin, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();

    // Soft pulse for branding
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const connectToTable = async (ip, tableData = {}) => {
    setConnecting(true);
    try {
      FluidNCService.setIP(ip);
      const alive = await FluidNCService.ping();

      if (!alive) {
        throw new Error(`Could not reach SandTable at ${ip}\n\nMake sure:\n• Table is powered on\n• Both devices on same WiFi`);
      }

      // Connect WebSocket
      WebSocketService.connect(ip);

      // Save to storage
      const savedData = {
        ip,
        name: tableData.name || 'My SandTable',
        id: tableData.id || ip,
        connectedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('tableData', JSON.stringify(savedData));
      await AsyncStorage.setItem('onboarded', 'true');

      // Update Redux
      dispatch(setConnected({
        connected: true,
        ip,
        name: savedData.name,
        id: savedData.id,
      }));

      HapticService.success();
      navigation.replace('Main');
    } catch (err) {
      HapticService.error();
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    HapticService.medium();
    if (!manualIP.trim()) {
      Alert.alert('Enter IP Address', 'Please enter a valid IP address first.');
      return;
    }
    try {
      await connectToTable(manualIP.trim(), { name: 'My SandTable', id: manualIP });
    } catch (err) {
      Alert.alert('Connection Failed', err.message);
    }
  };

  const handleAutoDiscover = async () => {
    HapticService.medium();
    setScanning(true);
    try {
      const ip = await FluidNCService.autoDiscover();
      if (ip) {
        await connectToTable(ip, { name: 'My SandTable', id: ip });
      } else {
        HapticService.error();
        Alert.alert('Not Found', 'Could not find SandTable on this network.\n\nTry entering the IP manually.');
      }
    } catch (err) {
      HapticService.error();
      Alert.alert('Error', err.message);
    } finally {
      setScanning(false);
    }
  };

  // Demo mode removed — only real hardware connection supported

  const spinAngle = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (connecting || scanning) {
    return (
      <LinearGradient colors={['#06060A', '#0D0D15']} style={styles.loadingContainer}>
        {/* Glowing blur effects during loading */}
        <View style={[styles.glowBall, { backgroundColor: Colors.primary, top: '25%', left: '20%' }]} />
        <View style={[styles.glowBall, { backgroundColor: Colors.accent, bottom: '25%', right: '20%' }]} />
        
        <View style={styles.connectingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.connectingTitle}>
            {scanning ? 'Searching Network...' : 'Connecting...'}
          </Text>
          <Text style={styles.connectingSubtitle}>
            {scanning
              ? 'Locating your SandTable automatically.'
              : 'Syncing and establishing real-time communication channels.'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#06060A', '#0D0D15']} style={styles.container}>
      {/* Decorative ambient glowing backdrops */}
      <View style={[styles.glowBall, { backgroundColor: Colors.primary, top: '10%', left: '-15%' }]} />
      <View style={[styles.glowBall, { backgroundColor: Colors.accent, bottom: '15%', right: '-15%' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo / Brand Header */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Animated.View style={{ transform: [{ rotate: spinAngle }] }}>
                <Svg width={76} height={76} viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="44" stroke="rgba(201, 168, 76, 0.15)" strokeWidth="1.5" fill="none" />
                  <Circle cx="50" cy="50" r="32" stroke="rgba(76, 158, 255, 0.15)" strokeWidth="1.5" fill="none" />
                  <Path
                    d="M 50,50 A 20,20 0 1,0 70,50 A 10,10 0 1,1 60,50 A 5,5 0 1,0 55,50"
                    fill="none"
                    stroke={Colors.primary}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <Circle cx="55" cy="50" r="3.5" fill={Colors.accent} />
                </Svg>
              </Animated.View>
            </Animated.View>
            <Text style={styles.title}>SandTable</Text>
            <Text style={styles.subtitle}>
              Connect your mobile device to control the kinetic sand art table
            </Text>
          </View>

          {/* Form Card (Glassmorphism design) */}
          <View style={styles.manualContainer}>
            <View style={[styles.inputCard, isFocused && styles.inputCardFocused]}>
              <View style={styles.inputCardHeader}>
                <Ionicons name="wifi-outline" size={16} color={Colors.primary} />
                <Text style={styles.inputLabel}>Enter Table IP Address</Text>
              </View>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={manualIP}
                  onChangeText={setManualIP}
                  placeholder="e.g. 192.168.1.100"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                {manualIP.length > 0 && (
                  <TouchableOpacity style={styles.clearBtn} onPress={() => setManualIP('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.inputHint}>
                Ensure your phone is on the same WiFi network as the SandTable.
              </Text>
            </View>

            {/* Connect Button */}
            <TouchableOpacity style={styles.connectBtn} onPress={handleManualConnect} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.connectBtnGrad}>
                <Ionicons name="link" size={18} color="#000" />
                <Text style={styles.connectBtnText}>Establish Connection</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Auto Discover Button */}
            <TouchableOpacity style={styles.autoBtn} onPress={handleAutoDiscover} activeOpacity={0.7}>
              <Ionicons name="search" size={18} color={Colors.accent} />
              <Text style={styles.autoBtnText}>Search Table on Network</Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpBox}>
              <Ionicons name="information-circle-outline" size={15} color="rgba(255,255,255,0.3)" />
              <Text style={styles.helpText}>
                Table IP can be found in your router's device list or on the ESP32 serial monitor.
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06060A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  glowBall: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.12,
    blurRadius: 100,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: height * 0.08,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  manualContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  inputCardFocused: {
    borderColor: 'rgba(201, 168, 76, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clearBtn: {
    marginLeft: 8,
  },
  inputHint: {
    color: Colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  connectBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  connectBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  connectBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 16,
  },
  autoBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 158, 255, 0.06)',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(76, 158, 255, 0.25)',
    marginBottom: 20,
  },
  autoBtnText: {
    color: Colors.accentLight,
    fontSize: 14,
    fontWeight: '700',
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  helpText: {
    flex: 1,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    lineHeight: 16,
  },
  connectingCard: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  connectingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  connectingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
