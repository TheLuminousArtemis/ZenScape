import React from 'react';
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

// We'll use this to store the clear chat callback
let clearChatCallback: (() => void) | null = null;

// Export this function to be called from the chat screen
export const setClearChatCallback = (callback: (() => void) | null) => {
  clearChatCallback = callback;
};

export default function TabLayout() {
  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#222222',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ZenScape',
          headerRight: () => (
            <Pressable
              onPress={handleProfilePress}
              style={{
                marginRight: 16,
                padding: 8,
              }}
            >
              <MaterialCommunityIcons
                name="account-circle"
                size={28}
                color="#FFFFFF"
              />
            </Pressable>
          ),
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <MaterialCommunityIcons
              name={focused ? 'chat' : 'chat-outline'}
              size={size}
              color={color}
            />
          ),
          headerRight: () => null,
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: 'Inspiration',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <MaterialCommunityIcons
              name={focused ? 'lightbulb' : 'lightbulb-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size, focused }: TabIconProps) => (
            <MaterialCommunityIcons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
