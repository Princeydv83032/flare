import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import StoriesScreen from '../screens/StoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Chats: 'chatbubble-outline',
  Discover: 'flame-outline',
  Stories: 'ellipse-outline',
  Profile: 'person-outline',
};

// Never actually renders - tabPress is intercepted below and redirected
// to the StoryCamera screen instead of switching tabs.
function CameraPlaceholder() {
  return null;
}

function CameraTabIcon({ colors }) {
  return (
    <View style={[styles.fab, { backgroundColor: colors.pink }]}>
      <Ionicons name="camera" size={20} color="#fff" />
    </View>
  );
}

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabel: route.name === 'CameraTab' ? '' : undefined,
        tabBarIcon: ({ color, size }) =>
          route.name === 'CameraTab' ? (
            <CameraTabIcon colors={colors} />
          ) : (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
      })}
    >
      <Tab.Screen name="Chats" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen
        name="CameraTab"
        component={CameraPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('StoryCamera');
          },
        })}
      />
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginTop: -18,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});