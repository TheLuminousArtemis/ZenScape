import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent, TextInput, Animated } from 'react-native';
import { Text, Button, Portal, Dialog, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type JournalEntry = {
    id: string;
    user_id: string;
    mood: number;
    sleep_quality: number;
    content: string;
    created_at: string;
};

const MOOD_CONFIG = {
    1: { emoji: '😫', description: 'Very Sad' },
    2: { emoji: '😕', description: 'Sad' },
    3: { emoji: '😐', description: 'Neutral' },
    4: { emoji: '🙂', description: 'Happy' },
    5: { emoji: '😄', description: 'Very Happy' },
} as const;

const SLEEP_CONFIG = {
    1: { emoji: '😴', description: 'Poor' },
    2: { emoji: '🛏️', description: 'Fair' },
    3: { emoji: '💤', description: 'Good' },
    4: { emoji: '✨', description: 'Very Good' },
    5: { emoji: '🌟', description: 'Excellent' },
} as const;

const LoadingScreen = () => {
    const breatheAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const breathe = () => {
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                })
            ]).start(() => breathe());
        };

        breathe();
        return () => breatheAnim.stopAnimation();
    }, []);

    return (
        <View style={styles.loadingScreen}>
            <Text style={styles.loadingTitle}>Take a deep breath</Text>
            <Animated.Text
                style={[
                    styles.breatheText,
                    {
                        opacity: breatheAnim,
                        transform: [{
                            scale: breatheAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.95, 1.05]
                            })
                        }]
                    }
                ]}
            >
                breathe
            </Animated.Text>
        </View>
    );
};

export default function JournalScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const [currentPage, setCurrentPage] = useState(0);
    const [mood, setMood] = useState(3);
    const [sleep, setSleep] = useState(3);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const getMoodDescription = useCallback((value: number) => {
        return MOOD_CONFIG[value as keyof typeof MOOD_CONFIG].description;
    }, []);

    const getSleepDescription = useCallback((value: number) => {
        return SLEEP_CONFIG[value as keyof typeof SLEEP_CONFIG].description;
    }, []);

    const getMoodEmoji = useCallback((value: number) => {
        return MOOD_CONFIG[value as keyof typeof MOOD_CONFIG].emoji;
    }, []);

    const getSleepEmoji = useCallback((value: number) => {
        return SLEEP_CONFIG[value as keyof typeof SLEEP_CONFIG].emoji;
    }, []);

    useEffect(() => {
        checkTodayEntry();
    }, []);

    const checkTodayEntry = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            // Check if we're editing a specific entry
            if (params?.id) {
                const { data: entry, error: entryError } = await supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (entryError) throw entryError;
                if (entry) {
                    setExistingEntry(entry);
                    setMood(Number(entry.mood));
                    setSleep(Number(entry.sleep_quality));
                    setContent(entry.content);
                    setLoading(false);
                    return;
                }
            }

            // If no specific entry ID, check for today's entry
            const { data: entry, error: entryError } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id)
                .filter('created_at', 'gte', new Date().toISOString().split('T')[0])
                .filter('created_at', 'lt', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0])
                .maybeSingle();

            if (entryError && entryError.code !== 'PGRST116') {
                throw entryError;
            }

            if (entry) {
                console.log('Found entry:', entry);  // Debug log
                setExistingEntry(entry);
                setMood(Number(entry.mood));
                setSleep(Number(entry.sleep_quality));
                setContent(entry.content);
            }
        } catch (error) {
            console.error('Error checking entry:', error);
            setSnackbarMessage('Failed to load journal entry');
            setSnackbarVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const page = Math.round(offsetX / SCREEN_WIDTH);
                if (page >= 0 && page <= 2 && page !== currentPage) {
                    setCurrentPage(page);
                }
            }
        }
    );

    const scrollToPage = useCallback((page: number) => {
        setCurrentPage(page);
        scrollViewRef.current?.scrollTo({
            x: page * SCREEN_WIDTH,
            animated: true,
        });
    }, []);

    const handleSave = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            let error;
            if (existingEntry) {
                console.log('Updating entry:', existingEntry.id);  // Debug log

                // First verify we can still update this entry
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Then perform the update with a raw query to match the RLS policy exactly
                const { data, error: updateError } = await supabase
                    .rpc('update_journal_entry', {
                        p_entry_id: existingEntry.id,
                        p_mood: mood,
                        p_sleep_quality: sleep,
                        p_content: content
                    });

                error = updateError;
                console.log('Update result:', { error: updateError, data });  // Debug log

                if (!error) {
                    // Verify the update by fetching the entry again
                    const { data: verifyData, error: verifyError } = await supabase
                        .from('journal_entries')
                        .select('*')
                        .eq('id', existingEntry.id)
                        .single();

                    console.log('Verification fetch:', { data: verifyData, error: verifyError }); // Debug log

                    if (!verifyError && verifyData) {
                        setExistingEntry(verifyData);
                    }
                }
            } else {
                // For new entries:
                // 1. First create the activity record
                const { data: activityData, error: activityError } = await supabase
                    .from('user_activities')
                    .insert([{
                        user_id: user.id,
                        activity_type: 'journal',
                        activity_date: new Date().toISOString().split('T')[0]
                    }])
                    .select()
                    .single();

                if (activityError) {
                    error = activityError;
                } else {
                    // 2. Then create the journal entry
                    const { error: journalError, data: journalData } = await supabase
                        .from('journal_entries')
                        .insert([{
                            id: activityData.id,
                            user_id: user.id,
                            mood,
                            sleep_quality: sleep,
                            content
                        }])
                        .select()
                        .single();

                    if (journalError) {
                        error = journalError;
                    } else if (journalData) {
                        setExistingEntry(journalData);
                    }
                }
            }

            if (error) throw error;

            setSnackbarMessage('Journal entry saved successfully');
            setSnackbarVisible(true);
            setTimeout(() => router.back(), 1500);
        } catch (error) {
            console.error('Error saving journal entry:', error);
            setSnackbarMessage('Failed to save journal entry');
            setSnackbarVisible(true);
        }
    };

    const handleBack = () => {
        if (currentPage > 0) {
            scrollToPage(currentPage - 1);
        } else {
            router.back();
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    iconColor="#fff"
                    size={24}
                    onPress={handleBack}
                />
                <View style={styles.pageIndicators}>
                    {[0, 1, 2].map((index) => {
                        const width = scrollX.interpolate({
                            inputRange: [
                                (index - 1) * SCREEN_WIDTH,
                                index * SCREEN_WIDTH,
                                (index + 1) * SCREEN_WIDTH,
                            ],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });

                        const opacity = scrollX.interpolate({
                            inputRange: [
                                (index - 1) * SCREEN_WIDTH,
                                index * SCREEN_WIDTH,
                                (index + 1) * SCREEN_WIDTH,
                            ],
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.pageIndicator,
                                    {
                                        width,
                                        opacity,
                                    }
                                ]}
                            />
                        );
                    })}
                </View>
                <IconButton
                    icon="close"
                    iconColor="#fff"
                    size={24}
                    onPress={() => router.back()}
                />
            </View>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Mood Page */}
                <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.question}>How are you feeling today?</Text>
                        <Text style={styles.emoji}>{getMoodEmoji(mood)}</Text>
                        <Text style={styles.description}>{getMoodDescription(mood)}</Text>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={5}
                                step={1}
                                value={mood}
                                onValueChange={setMood}
                                minimumTrackTintColor="#fff"
                                maximumTrackTintColor="#666"
                                thumbTintColor="#fff"
                            />
                        </View>
                    </View>
                </View>

                {/* Sleep Page */}
                <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.question}>How did you sleep?</Text>
                        <Text style={styles.emoji}>{getSleepEmoji(sleep)}</Text>
                        <Text style={styles.description}>{getSleepDescription(sleep)}</Text>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={5}
                                step={1}
                                value={sleep}
                                onValueChange={setSleep}
                                minimumTrackTintColor="#fff"
                                maximumTrackTintColor="#666"
                                thumbTintColor="#fff"
                            />
                        </View>
                    </View>
                </View>

                {/* Journal Page */}
                <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.question}>
                            How are you feeling about today?
                        </Text>
                        <TextInput
                            value={content}
                            onChangeText={setContent}
                            multiline
                            style={styles.textInput}
                            placeholder="Start writing..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            cursorColor="#fff"
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                {currentPage < 2 ? (
                    <Button
                        mode="contained"
                        onPress={() => scrollToPage(currentPage + 1)}
                        style={styles.button}
                        buttonColor="#fff"
                        textColor="#000"
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        style={styles.button}
                        buttonColor="#fff"
                        textColor="#000"
                        disabled={!content.trim()}
                    >
                        {existingEntry ? 'Update Entry' : 'Save Entry'}
                    </Button>
                )}
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    } as const,
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 48,
        paddingHorizontal: 8,
        paddingBottom: 8,
        backgroundColor: '#000',
    } as const,
    pageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    } as const,
    pageIndicator: {
        height: 4,
        borderRadius: 2,
        marginHorizontal: 4,
        backgroundColor: '#fff',
    } as const,
    page: {
        width: SCREEN_WIDTH,
        padding: 20,
        alignItems: 'center',
    } as const,
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        padding: 20,
        flex: 1,
    } as const,
    question: {
        fontSize: 32,
        color: '#fff',
        marginBottom: 40,
        fontWeight: '500',
        textAlign: 'center',
    } as const,
    emoji: {
        fontSize: 96,
        marginBottom: 20,
    } as const,
    description: {
        color: '#fff',
        fontSize: 24,
        marginBottom: 40,
        textAlign: 'center',
    } as const,
    sliderContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 0,
    } as const,
    slider: {
        width: SCREEN_WIDTH - 80,
        height: 40,
    } as const,
    textInput: {
        width: '100%',
        flex: 1,
        color: '#fff',
        fontSize: 18,
        lineHeight: 24,
        textAlignVertical: 'top',
        padding: 0,
    } as const,
    bottomBar: {
        padding: 16,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#333',
    } as const,
    button: {
        width: '100%',
        borderRadius: 30,
    } as const,
    loadingScreen: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    } as const,
    loadingTitle: {
        color: '#fff',
        fontSize: 32,
        marginBottom: 32,
        opacity: 0.9,
    } as const,
    breatheText: {
        color: '#fff',
        fontSize: 24,
        opacity: 0.6,
        fontWeight: '300',
        letterSpacing: 3,
    } as const,
}); 