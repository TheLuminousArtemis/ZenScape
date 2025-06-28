import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton, Portal, Dialog, TextInput, ProgressBar, Snackbar } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../../lib/supabase';
import { timedMeditationService } from '../../src/services/timedMeditationService';

export default function TimedScreen() {
    const [showDurationDialog, setShowDurationDialog] = useState(false);
    const [showStopDialog, setShowStopDialog] = useState(false);
    const [showBackDialog, setShowBackDialog] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [customDuration, setCustomDuration] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [timerCompleted, setTimerCompleted] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStartPlaying = async (minutes: number) => {
        try {
            await timedMeditationService.loadTrack(minutes);
            setDuration(minutes * 60);
            setTimeLeft(minutes * 60);
            setIsPlaying(true);
            setIsPaused(false);
            setShowDurationDialog(false);
            setShowSuccessScreen(false);
            setTimerCompleted(false);
            activateKeepAwake();
            await timedMeditationService.startPlayback();
        } catch (error) {
            console.error('Error starting timed meditation:', error);
            setSnackbarMessage('Failed to start meditation');
            setSnackbarVisible(true);
        }
    };

    const handlePause = async () => {
        try {
            if (isPaused) {
                await timedMeditationService.startPlayback();
            } else {
                await timedMeditationService.pausePlayback();
            }
            setIsPaused(!isPaused);
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const handleStop = async () => {
        setShowStopDialog(true);
    };

    const confirmStop = async () => {
        try {
            await timedMeditationService.stopPlayback();
            setIsPlaying(false);
            setIsPaused(false);
            setTimeLeft(null);
            setDuration(null);
            setShowStopDialog(false);
            setTimerCompleted(false);
            deactivateKeepAwake();
        } catch (error) {
            console.error('Error stopping meditation:', error);
        }
    };

    const handleBack = () => {
        if (isPlaying && !timerCompleted) {
            setShowBackDialog(true);
        } else {
            router.back();
        }
    };

    const confirmBack = async () => {
        try {
            await timedMeditationService.stopPlayback();
            setIsPlaying(false);
            setIsPaused(false);
            setTimeLeft(null);
            setDuration(null);
            setShowBackDialog(false);
            setTimerCompleted(false);
            deactivateKeepAwake();
            router.back();
        } catch (error) {
            console.error('Error navigating back:', error);
            router.back();
        }
    };

    const handleCustomDuration = () => {
        const minutes = parseInt(customDuration, 10);
        if (isNaN(minutes) || minutes <= 0) {
            return;
        }
        handleStartPlaying(minutes);
    };

    const handleTimerComplete = async () => {
        try {
            await timedMeditationService.stopPlayback();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            const { error } = await supabase
                .from('user_activities')
                .insert([{
                    user_id: user.id,
                    activity_type: 'meditation',
                    activity_date: new Date().toISOString().split('T')[0]
                }]);

            if (error) {
                console.error('Error saving meditation:', error);
                setSnackbarMessage('Failed to save meditation session');
                setSnackbarVisible(true);
            }
        } catch (error) {
            console.error('Error completing meditation:', error);
            setSnackbarMessage('Failed to complete meditation session');
            setSnackbarVisible(true);
        }

        setIsPlaying(false);
        setTimeLeft(null);
        setDuration(null);
        setShowSuccessScreen(true);
        setTimerCompleted(true);
        deactivateKeepAwake();
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && !isPaused && timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isPlaying, isPaused, timeLeft]);

    // Update mute state based on service
    useEffect(() => {
        const checkMuteState = () => {
            setIsMuted(timedMeditationService.isTrackMuted());
        };

        const interval = setInterval(checkMuteState, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <View style={styles.container}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={handleBack}
                        style={styles.headerButton}
                    />
                    <Text variant="titleLarge" style={styles.headerTitle}>
                        Timed Meditation
                    </Text>
                    <View style={styles.headerButton} />
                </View>

                {showSuccessScreen ? (
                    <View style={styles.fullScreenContent}>
                        <Text variant="headlineMedium" style={styles.successTitle}>
                            Great job! 🎉
                        </Text>
                        <Text variant="bodyLarge" style={styles.successText}>
                            You've completed your meditation session.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setShowSuccessScreen(false);
                                router.back();
                            }}
                            style={styles.button}
                            buttonColor="#fff"
                            textColor="#000"
                        >
                            Return to Home
                        </Button>
                    </View>
                ) : isPlaying ? (
                    <View style={styles.fullScreenContent}>
                        <Text variant="displayLarge" style={styles.timer}>
                            {timeLeft !== null ? formatTime(timeLeft) : '0:00'}
                        </Text>
                        <View style={styles.progressBarContainer}>
                            <ProgressBar
                                progress={timeLeft !== null ? timeLeft / (duration || 1) : 0}
                                style={styles.progressBar}
                                color="#fff"
                            />
                        </View>
                        <View style={styles.controls}>
                            <IconButton
                                icon={isPaused ? "play" : "pause"}
                                mode="contained"
                                size={32}
                                onPress={handlePause}
                                style={styles.controlButton}
                                containerColor="#fff"
                                iconColor="#000"
                            />
                            <IconButton
                                icon={isMuted ? "volume-off" : "volume-high"}
                                mode="contained"
                                size={32}
                                onPress={async () => {
                                    try {
                                        await timedMeditationService.toggleMute();
                                        setIsMuted(!isMuted);
                                    } catch (error) {
                                        console.error('Error toggling mute:', error);
                                    }
                                }}
                                style={styles.controlButton}
                                containerColor="#fff"
                                iconColor="#000"
                            />
                            <IconButton
                                icon="stop"
                                mode="contained"
                                size={32}
                                onPress={handleStop}
                                style={styles.controlButton}
                                containerColor="#fff"
                                iconColor="#000"
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Text variant="headlineMedium" style={styles.startTitle}>
                            Begin Your Practice
                        </Text>
                        <Text variant="bodyMedium" style={styles.startDescription}>
                            Choose a duration for your timed meditation session
                        </Text>
                        <View style={styles.durationButtons}>
                            {[5, 10, 15].map((mins) => (
                                <Button
                                    key={mins}
                                    mode="contained"
                                    onPress={() => handleStartPlaying(mins)}
                                    style={styles.durationButton}
                                    buttonColor="#fff"
                                    textColor="#000"
                                >
                                    {mins} min
                                </Button>
                            ))}
                        </View>
                        <View style={styles.customDuration}>
                            <TextInput
                                placeholder="Custom Duration (minutes)"
                                value={customDuration}
                                onChangeText={setCustomDuration}
                                keyboardType="number-pad"
                                style={styles.input}
                                textColor="#fff"
                                mode="outlined"
                                outlineColor="rgba(255, 255, 255, 0.5)"
                                activeOutlineColor="#fff"
                                contentStyle={{ height: 48 }}
                                theme={{
                                    colors: {
                                        onSurfaceVariant: '#fff',
                                        placeholder: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                                label=""
                            />
                            <Button
                                mode="contained"
                                onPress={handleCustomDuration}
                                style={styles.customDurationButton}
                                buttonColor="#fff"
                                textColor="#000"
                            >
                                Start Custom Duration
                            </Button>
                        </View>
                    </View>
                )}

                <Portal>
                    <Dialog visible={showStopDialog} onDismiss={() => setShowStopDialog(false)}>
                        <Dialog.Title>End Meditation?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium">
                                Are you sure you want to end your meditation session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowStopDialog(false)}>Cancel</Button>
                            <Button onPress={confirmStop}>End Session</Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog visible={showBackDialog} onDismiss={() => setShowBackDialog(false)}>
                        <Dialog.Title>Leave Session?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium">
                                Are you sure you want to leave your meditation session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowBackDialog(false)}>Cancel</Button>
                            <Button onPress={confirmBack}>Leave Session</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        height: 56,
        backgroundColor: '#000',
    },
    headerButton: {
        width: 40,
    },
    headerTitle: {
        color: '#fff',
        flex: 1,
        textAlign: 'left',
        marginLeft: 16,
    },
    fullScreenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    timer: {
        fontSize: 64,
        color: '#fff',
        marginBottom: 40,
        includeFontPadding: false,
        textAlignVertical: 'center',
        height: 80,
    },
    progressBarContainer: {
        width: '80%',
        marginBottom: 40,
    },
    progressBar: {
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    controls: {
        flexDirection: 'row',
        gap: 20,
    },
    controlButton: {
        margin: 0,
    },
    content: {
        padding: 16,
    },
    startTitle: {
        color: '#fff',
        marginBottom: 8,
    },
    startDescription: {
        color: '#fff',
        marginBottom: 24,
        opacity: 0.7,
    },
    durationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 8,
    },
    durationButton: {
        flex: 1,
        borderRadius: 28,
    },
    customDuration: {
        gap: 16,
    },
    input: {
        backgroundColor: 'transparent',
        height: 52,
    },
    customDurationButton: {
        borderRadius: 28,
    },
    successTitle: {
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    successText: {
        color: '#fff',
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.8,
    },
    button: {
        width: '100%',
    },
}); 