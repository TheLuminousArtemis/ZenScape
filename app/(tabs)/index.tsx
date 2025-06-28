import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { WelcomeCard } from '../../components/WelcomeCard';
import { Stack } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    checkWelcomeCardState();
  }, []);

  const checkWelcomeCardState = async () => {
    try {
      const isNewUser = await AsyncStorage.getItem('isNewSignup');
      if (isNewUser === 'true') {
        setShowWelcomeCard(true);
        await AsyncStorage.removeItem('isNewSignup');
      }
    } catch (error) {
      console.error('Error checking welcome card state:', error);
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcomeCard(false);
  };

  const handleNavigation = (route: 'guided' | 'timed' | 'music' | 'journal') => {
    if (route === 'journal') {
      router.push('/journal' as any);
    } else {
      router.push(`/meditation/${route}` as any);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerBlurEffect: 'dark',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTitleStyle: {
            color: '#fff',
          },
        }}
      />
      <View style={styles.container}>
        <Video
          source={require('../../assets/video/background.mp4')}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          rate={1.0}
          useNativeControls={false}
          posterSource={require('../../assets/video/background.mp4')}
          usePoster={true}
          onLoad={() => { }}
          onPlaybackStatusUpdate={status => setVideoStatus(() => status)}
        />
        <View style={[styles.overlay, { opacity: 0.35 }]} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {showWelcomeCard && <WelcomeCard onDismiss={handleDismissWelcome} />}
          <View style={styles.content}>
            <View style={styles.spacer} />
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="meditation" size={size} color={color} />
                )}
                onPress={() => handleNavigation('guided')}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor="rgba(255, 255, 255, 0.9)"
                textColor="#000"
              >
                Guided
              </Button>
              <Button
                mode="contained"
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="timer-outline" size={size} color={color} />
                )}
                onPress={() => handleNavigation('timed')}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor="rgba(255, 255, 255, 0.9)"
                textColor="#000"
              >
                Timed
              </Button>
              <Button
                mode="contained"
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="music" size={size} color={color} />
                )}
                onPress={() => handleNavigation('music')}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor="rgba(255, 255, 255, 0.9)"
                textColor="#000"
              >
                Music
              </Button>
            </View>

            <View style={styles.journalContainer}>
              <Button
                mode="contained"
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
                )}
                onPress={() => handleNavigation('journal')}
                style={styles.journalButton}
                contentStyle={styles.buttonContent}
                buttonColor="#fff"
                textColor="#000"
              >
                Daily Journal
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  spacer: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    height: 56,
  },
  journalContainer: {
    marginTop: 8,
    width: '100%',
  },
  journalButton: {
    borderRadius: 12,
  },
});
