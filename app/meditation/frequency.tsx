import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FREQUENCY_TRACKS, FrequencyTrack, formatDuration } from '../../src/services/frequencyService';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../../src/services/supabase';

export default function FrequencyScreen() {
    const [selectedTrack, setSelectedTrack] = useState<FrequencyTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [showStopDialog, setShowStopDialog] = useState(false);
    const [showBackDialog, setShowBackDialog] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [timerCompleted, setTimerCompleted] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            deactivateKeepAwake();
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const handleTrackSelect = (track: FrequencyTrack) => {
        setSelectedTrack(track);
        setDuration(track.duration);
        setTimeLeft(track.duration);
    };

    const handleStartPlaying = async () => {
        if (!selectedTrack) return;

        setIsPlaying(true);
        setIsPaused(false);
        setShowSuccessScreen(false);
        setTimerCompleted(false);
        activateKeepAwake();

        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: selectedTrack.url },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            await sound.playAsync();
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Failed to start playback');
        }
    };

    const handlePause = async () => {
        try {
            if (soundRef.current) {
                if (isPaused) {
                    await soundRef.current.playAsync();
                } else {
                    await soundRef.current.pauseAsync();
                }
                setIsPaused(!isPaused);
            }
        } catch (error) {
            console.error('Error toggling pause:', error);
        }
    };

    const handleStop = () => {
        setShowStopDialog(true);
    };

    const confirmStop = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }
            setIsPlaying(false);
            setIsPaused(false);
            setTimeLeft(null);
            setDuration(null);
            setShowStopDialog(false);
            setTimerCompleted(false);
            deactivateKeepAwake();
        } catch (error) {
            console.error('Error stopping audio:', error);
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
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }
            setIsPlaying(false);
            setIsPaused(false);
            setTimeLeft(null);
            setDuration(null);
            setShowBackDialog(false);
            setTimerCompleted(false);
            deactivateKeepAwake();
            router.back();
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    };

    const handleTimerComplete = async () => {
        try {
            await soundRef.current?.stopAsync();
            await soundRef.current?.unloadAsync();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            const { error } = await supabase
                .from('user_activities')
                .insert([{
                    user_id: user.id,
                    activity_type: 'frequency_meditation',
                    activity_date: new Date().toISOString().split('T')[0],
                    frequency: selectedTrack?.frequency
                }]);

            if (error) {
                console.error('Error saving meditation:', error);
            }

            setIsPlaying(false);
            setTimeLeft(null);
            setDuration(null);
            setShowSuccessScreen(true);
            setTimerCompleted(true);
            deactivateKeepAwake();
        } catch (error) {
            console.error('Error completing timer:', error);
        }
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

    if (showSuccessScreen) {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
                <Text style={styles.successText}>Meditation Complete!</Text>
                <Button mode="contained" onPress={() => router.back()}>
                    Return
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {showSuccessScreen ? (
                <View style={styles.successContainer}>
                    <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
                    <Text style={styles.successText}>Meditation Completed!</Text>
                    <Button mode="contained" onPress={() => router.back()}>
                        Return Home
                    </Button>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            onPress={handleBack}
                        />
                        <Text style={styles.title}>Frequency Meditation</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {!selectedTrack ? (
                        <View style={styles.trackList}>
                            {FREQUENCY_TRACKS.map((track) => (
                                <Button
                                    key={track.id}
                                    mode="outlined"
                                    style={styles.trackButton}
                                    onPress={() => handleTrackSelect(track)}
                                >
                                    {track.name}
                                </Button>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.playerContainer}>
                            <Text style={styles.trackName}>{selectedTrack.name}</Text>
                            <Text style={styles.frequency}>{selectedTrack.frequency} Hz</Text>
                            <Text style={styles.description}>{selectedTrack.description}</Text>
                            <Text style={styles.timer}>
                                {timeLeft !== null ? formatDuration(timeLeft) : '00:00'}
                            </Text>
                            <View style={styles.controls}>
                                <IconButton
                                    icon={isPaused ? "play" : "pause"}
                                    size={40}
                                    onPress={handlePause}
                                    disabled={!isPlaying}
                                />
                                <IconButton
                                    icon="stop"
                                    size={40}
                                    onPress={handleStop}
                                    disabled={!isPlaying}
                                />
                            </View>
                        </View>
                    )}
                </>
            )}

            {showStopDialog && (
                <View style={styles.dialogContainer}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Stop Meditation?</Text>
                        <Text style={styles.dialogText}>
                            Are you sure you want to stop the meditation? Your progress will not be saved.
                        </Text>
                        <View style={styles.dialogButtons}>
                            <Button mode="outlined" onPress={() => setShowStopDialog(false)}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={confirmStop}>
                                Stop
                            </Button>
                        </View>
                    </View>
                </View>
            )}

            {showBackDialog && (
                <View style={styles.dialogContainer}>
                    <View style={styles.dialog}>
                        <Text style={styles.dialogTitle}>Leave Meditation?</Text>
                        <Text style={styles.dialogText}>
                            Are you sure you want to leave? Your progress will not be saved.
                        </Text>
                        <View style={styles.dialogButtons}>
                            <Button mode="outlined" onPress={() => setShowBackDialog(false)}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={confirmBack}>
                                Leave
                            </Button>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    trackList: {
        flex: 1,
        padding: 16,
        gap: 16,
    },
    trackButton: {
        marginBottom: 8,
    },
    playerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    trackName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    frequency: {
        fontSize: 18,
        color: '#fff',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    timer: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    successText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 16,
    },
    dialogContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialog: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    dialogText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
}); 