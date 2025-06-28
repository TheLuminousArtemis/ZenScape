import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton, Portal, Dialog, TextInput, ProgressBar } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { audioService } from '../../src/services/audioService';

type MusicCategory = 'hertz' | 'ambient';

interface Track {
    id: string;
    title: string;
    category: MusicCategory;
}

const SAMPLE_TRACKS: Track[] = [
    {
        id: '1',
        title: '432 Hz - Deep Healing',
        category: 'hertz',
    },
    {
        id: '2',
        title: '528 Hz - Miracle Tone',
        category: 'hertz',
    },
    {
        id: '3',
        title: '639 Hz - Heart Chakra',
        category: 'hertz',
    },
    {
        id: 'fireplace',
        title: 'Crackling Fireplace',
        category: 'ambient',
    },
    {
        id: 'crickets',
        title: 'Crickets at Night',
        category: 'ambient',
    },
    {
        id: 'stream',
        title: 'Mountain Stream',
        category: 'ambient',
    },
    {
        id: 'waves',
        title: 'Ocean Waves',
        category: 'ambient',
    },
    {
        id: 'rainforest',
        title: 'Rainforest Ambience',
        category: 'ambient',
    },
    {
        id: 'rain',
        title: 'Rain Sounds',
        category: 'ambient',
    },
];

export default function MusicScreen() {
    const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('hertz');
    const [showDurationDialog, setShowDurationDialog] = useState(false);
    const [showStopDialog, setShowStopDialog] = useState(false);
    const [showBackDialog, setShowBackDialog] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [customDuration, setCustomDuration] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [timerCompleted, setTimerCompleted] = useState(false);

    const filteredTracks = SAMPLE_TRACKS.filter(
        (track) => track.category === selectedCategory
    );

    const handleTrackSelect = (track: Track) => {
        setSelectedTrack(track);
        setShowDurationDialog(true);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStartPlaying = async (duration: number) => {
        if (!selectedTrack) return;

        try {
            await audioService.loadTrack(selectedTrack, duration);
            await audioService.startPlayback();

            setDuration(duration * 60);
            setTimeLeft(duration * 60);
            setIsPlaying(true);
            setIsPaused(false);
            setTimerCompleted(false);
            setShowDurationDialog(false);
            activateKeepAwake();

            audioService.onSessionComplete = handleTimerComplete;
        } catch (error) {
            console.error('Error starting playback:', error);
            // Reset state on error
            setIsPlaying(false);
            setShowDurationDialog(false);
        }
    };

    const handlePause = async () => {
        try {
            if (isPaused) {
                await audioService.resumePlayback();
            } else {
                await audioService.pausePlayback();
            }
            setIsPaused(!isPaused);
        } catch (error) {
            console.error('Error toggling pause:', error);
        }
    };

    const handleStop = () => {
        setShowStopDialog(true);
    };

    const confirmStop = async () => {
        try {
            await audioService.stopPlayback();
            setIsPlaying(false);
            setIsPaused(false);
            setTimeLeft(null);
            setDuration(null);
            setShowStopDialog(false);
            setTimerCompleted(false);
            deactivateKeepAwake();
        } catch (error) {
            console.error('Error stopping playback:', error);
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
            await audioService.stopPlayback();
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

    const handleTimerComplete = () => {
        setIsPlaying(false);
        setTimeLeft(null);
        setDuration(null);
        setTimerCompleted(true);
        deactivateKeepAwake();
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && !isPaused && timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                const remaining = audioService.getRemainingTime();
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(timer);
                    handleTimerComplete();
                }
            }, 1000);
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isPlaying, isPaused, timeLeft]);

    useEffect(() => {
        return () => {
            audioService.stopPlayback();
            deactivateKeepAwake();
        };
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
                        Music
                    </Text>
                    <View style={styles.headerButton} />
                </View>

                {isPlaying ? (
                    <View style={styles.fullScreenContent}>
                        <Text variant="titleLarge" style={styles.meditationTitle}>
                            {selectedTrack?.title}
                        </Text>
                        <View style={styles.timerContainer}>
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
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.categoryButtons}>
                            <Button
                                mode={selectedCategory === 'hertz' ? 'contained' : 'outlined'}
                                onPress={() => setSelectedCategory('hertz')}
                                style={styles.categoryButton}
                                buttonColor={selectedCategory === 'hertz' ? '#fff' : undefined}
                                textColor={selectedCategory === 'hertz' ? '#000' : '#fff'}
                            >
                                Frequencies
                            </Button>
                            <Button
                                mode={selectedCategory === 'ambient' ? 'contained' : 'outlined'}
                                onPress={() => setSelectedCategory('ambient')}
                                style={styles.categoryButton}
                                buttonColor={selectedCategory === 'ambient' ? '#fff' : undefined}
                                textColor={selectedCategory === 'ambient' ? '#000' : '#fff'}
                            >
                                Ambient
                            </Button>
                        </View>

                        <ScrollView style={styles.scrollView}>
                            {filteredTracks.map((track) => (
                                <Card
                                    key={track.id}
                                    style={styles.trackCard}
                                    mode="outlined"
                                >
                                    <Card.Content style={styles.cardContent}>
                                        <View style={styles.trackInfo}>
                                            <Text variant="titleMedium" style={styles.trackTitle}>
                                                {track.title}
                                            </Text>
                                        </View>
                                        <IconButton
                                            icon="play"
                                            mode="contained"
                                            size={24}
                                            onPress={() => handleTrackSelect(track)}
                                            containerColor="#fff"
                                            iconColor="#000"
                                        />
                                    </Card.Content>
                                </Card>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <Portal>
                    <Dialog
                        visible={showDurationDialog}
                        onDismiss={() => setShowDurationDialog(false)}
                        style={styles.dialog}
                    >
                        <Dialog.Title style={styles.dialogTitle}>Choose Duration</Dialog.Title>
                        <Dialog.Content>
                            <View style={styles.durationButtons}>
                                {[25, 53].map((mins) => (
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
                            <View style={styles.customDurationContainer}>
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
                                    onPress={() => {
                                        const mins = parseInt(customDuration, 10);
                                        if (!isNaN(mins) && mins > 0) {
                                            handleStartPlaying(mins);
                                        }
                                    }}
                                    style={styles.customDurationButton}
                                    buttonColor="#fff"
                                    textColor="#000"
                                >
                                    Start Custom Duration
                                </Button>
                            </View>
                        </Dialog.Content>
                    </Dialog>

                    <Dialog visible={showStopDialog} onDismiss={() => setShowStopDialog(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>End Session?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                Are you sure you want to end your music session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowStopDialog(false)} textColor="#fff">
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

                    <Dialog visible={showBackDialog} onDismiss={() => setShowBackDialog(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>Leave Session?</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                Are you sure you want to leave your music session?
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setShowBackDialog(false)} textColor="#fff">
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
    content: {
        flex: 1,
        padding: 16,
    },
    categoryButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    categoryButton: {
        flex: 1,
        borderColor: '#fff',
        borderRadius: 28,
    },
    scrollView: {
        flex: 1,
    },
    trackCard: {
        backgroundColor: 'transparent',
        marginBottom: 8,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        color: '#fff',
        opacity: 0.9,
        fontSize: 16,
    },
    fullScreenContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    durationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 16,
    },
    durationButton: {
        flex: 1,
        borderRadius: 28,
    },
    customDurationContainer: {
        gap: 16,
        marginTop: 8,
    },
    input: {
        backgroundColor: 'transparent',
        height: 52,
    },
    customDurationButton: {
        borderRadius: 28,
    },
    meditationTitle: {
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 32,
        fontSize: 24,
    },
}); 