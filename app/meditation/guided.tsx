import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton, Portal, Dialog, ProgressBar, Snackbar } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '../../lib/supabase';

interface Meditation {
    id: string;
    title: string;
    duration: number;
    instructor: string;
    description: string;
}

const SAMPLE_MEDITATIONS: Meditation[] = [
    {
        id: '1',
        title: 'Mindful Breathing',
        duration: 5,
        instructor: 'Sarah Johnson',
        description: 'A gentle introduction to mindful breathing techniques.',
    },
    {
        id: '2',
        title: 'Body Scan',
        duration: 10,
        instructor: 'Michael Chen',
        description: 'Progressive relaxation through body awareness.',
    },
    {
        id: '3',
        title: 'Loving Kindness',
        duration: 15,
        instructor: 'Emma Davis',
        description: 'Cultivate compassion and positive emotions.',
    },
];

export default function GuidedScreen() {
    const [showStopDialog, setShowStopDialog] = useState(false);
    const [showBackDialog, setShowBackDialog] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [timerCompleted, setTimerCompleted] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStartPlaying = async (meditation: Meditation) => {
        setSelectedMeditation(meditation);
        setDuration(meditation.duration * 60);
        setTimeLeft(meditation.duration * 60);
        setIsPlaying(true);
        setIsPaused(false);
        setShowSuccessScreen(false);
        setTimerCompleted(false);
        activateKeepAwake();
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleStop = () => {
        setShowStopDialog(true);
    };

    const confirmStop = async () => {
        setIsPlaying(false);
        setIsPaused(false);
        setTimeLeft(null);
        setDuration(null);
        setShowStopDialog(false);
        setTimerCompleted(false);
        deactivateKeepAwake();
    };

    const handleBack = () => {
        if (isPlaying && !timerCompleted) {
            setShowBackDialog(true);
        } else {
            router.back();
        }
    };

    const confirmBack = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setTimeLeft(null);
        setDuration(null);
        setShowBackDialog(false);
        setTimerCompleted(false);
        deactivateKeepAwake();
        router.back();
    };

    const handleTimerComplete = async () => {
        try {
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
            console.error('Error saving meditation:', error);
            setSnackbarMessage('Failed to save meditation session');
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
                        Guided Meditation
                    </Text>
                    <View style={styles.headerButton} />
                </View>

                {showSuccessScreen ? (
                    <View style={styles.fullScreenContent}>
                        <Text variant="headlineMedium" style={styles.successTitle}>
                            Great job! 🎉
                        </Text>
                        <Text variant="bodyLarge" style={styles.successText}>
                            You've completed your guided meditation session.
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
                        <Text variant="titleLarge" style={styles.meditationTitle}>
                            {selectedMeditation?.title}
                        </Text>
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
                    <ScrollView style={styles.scrollView}>
                        {SAMPLE_MEDITATIONS.map((meditation) => (
                            <Card
                                key={meditation.id}
                                style={styles.card}
                                mode="contained"
                                onPress={() => handleStartPlaying(meditation)}
                            >
                                <Card.Content>
                                    <View style={styles.cardHeader}>
                                        <Text variant="titleMedium" style={styles.cardTitle}>
                                            {meditation.title}
                                        </Text>
                                        <Text variant="bodyMedium" style={styles.duration}>
                                            {meditation.duration} min
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={styles.description}>
                                        {meditation.description}
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </ScrollView>
                )}

                <Portal>
                    <Dialog
                        visible={showStopDialog}
                        onDismiss={() => setShowStopDialog(false)}
                        style={styles.dialog}
                    >
                        <Dialog.Title style={styles.dialogTitle}>End Meditation?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                Are you sure you want to end your guided meditation session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={() => setShowStopDialog(false)}
                                textColor="#fff"
                            >
                                Cancel
                            </Button>
                            <Button
                                onPress={confirmStop}
                                mode="contained"
                                buttonColor="#fff"
                                textColor="#000"
                            >
                                End Session
                            </Button>
                        </Dialog.Actions>
                    </Dialog>

                    <Dialog
                        visible={showBackDialog}
                        onDismiss={() => setShowBackDialog(false)}
                        style={styles.dialog}
                    >
                        <Dialog.Title style={styles.dialogTitle}>Leave Session?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                Are you sure you want to leave your guided meditation session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={() => setShowBackDialog(false)}
                                textColor="#fff"
                            >
                                Cancel
                            </Button>
                            <Button
                                onPress={confirmBack}
                                mode="contained"
                                buttonColor="#fff"
                                textColor="#000"
                            >
                                Leave Session
                            </Button>
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
        height: 56,
        backgroundColor: '#000',
    },
    headerButton: {
        width: 48,
        height: 48,
        margin: 0,
    },
    headerTitle: {
        color: '#fff',
        opacity: 0.9,
        flex: 1,
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    fullScreenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        color: '#fff',
        opacity: 0.9,
        flex: 1,
    },
    description: {
        color: '#fff',
        opacity: 0.7,
    },
    duration: {
        color: '#fff',
        opacity: 0.6,
        marginLeft: 8,
    },
    meditationTitle: {
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 32,
    },
    timer: {
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 48,
        fontSize: 64,
        includeFontPadding: false,
        lineHeight: 76,
    },
    progressBarContainer: {
        width: '100%',
        paddingHorizontal: 32,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 48,
    },
    controlButton: {
        margin: 0,
    },
    successTitle: {
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 16,
    },
    successText: {
        color: '#fff',
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        borderRadius: 30,
    },
    dialog: {
        backgroundColor: '#1a1a1a',
    },
    dialogTitle: {
        color: '#fff',
        opacity: 0.9,
    },
    dialogText: {
        color: '#fff',
        opacity: 0.7,
    },
}); 