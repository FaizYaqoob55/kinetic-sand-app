// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ConnectScreen from '../screens/ConnectScreen';
import HomeScreen from '../screens/HomeScreen';
import PatternLibraryScreen from '../screens/PatternLibraryScreen';
import PatternDetailScreen from '../screens/PatternDetailScreen';
import NowPlayingScreen from '../screens/NowPlayingScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import LEDControlScreen from '../screens/LEDControlScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon
const TabIcon = ({ name, focused, label }) => (
  <View style={styles.tabItem}>
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.primary : '#6B6B7A'}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

// Bottom Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
      tabBarBackground: () => null,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
        ),
      }}
    />
    <Tab.Screen
      name="Library"
      component={PatternLibraryScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} label="Patterns" />
        ),
      }}
    />
    <Tab.Screen
      name="LEDControlTab"
      component={LEDControlScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name={focused ? 'sunny' : 'sunny-outline'} focused={focused} label="Lighting" />
        ),
      }}
    />
    <Tab.Screen
      name="ScheduleTab"
      component={ScheduleScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} label="Timer" />
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} label="Settings" />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => (
  <NavigationContainer
    theme={{
      dark: true,
      colors: {
        primary: Colors.primary,
        background: Colors.background,
        card: Colors.backgroundSecondary,
        text: Colors.textPrimary,
        border: Colors.border,
        notification: Colors.primary,
      },
    }}
  >
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Connect" component={ConnectScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="PatternDetail"
        component={PatternDetailScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="LEDControl"
        component={LEDControlScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Playlist"
        component={PlaylistScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#121218',
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    height: 76,
    paddingBottom: 12,
    paddingTop: 10,
    paddingHorizontal: 8,
    // Floating card effect
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 20,
    position: 'absolute',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#6B6B7A',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default AppNavigator;
