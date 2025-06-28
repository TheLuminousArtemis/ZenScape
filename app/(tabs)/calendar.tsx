import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Activity = {
    id: string;
    activity_type: 'meditation' | 'journal';
    activity_date: string;
    created_at: string;
    journal_entry?: {
        id: string;
        content: string;
        mood: number;
        sleep_quality: number;
    };
};

const CustomDatePicker = ({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (date: Date) => void }) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const addMonths = (date: Date, months: number) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + months);
        return newDate;
    };

    return (
        <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
                <TouchableOpacity
                    onPress={() => onDateChange(addMonths(selectedDate, -1))}
                    style={styles.datePickerButton}
                >
                    <Text style={styles.datePickerButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerMonth}>
                    {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
                <TouchableOpacity
                    onPress={() => onDateChange(addMonths(selectedDate, 1))}
                    style={styles.datePickerButton}
                >
                    <Text style={styles.datePickerButtonText}>→</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.daysContainer}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
            </View>
            <View style={styles.datesContainer}>
                {getDaysInMonth(selectedDate).map((date, index) => (
                    <TouchableOpacity
                        key={`date-${index}`}
                        style={[
                            styles.dateButton,
                            date && isSameDay(date, selectedDate) && styles.selectedDateButton,
                        ]}
                        onPress={() => date && onDateChange(date)}
                        disabled={!date}
                    >
                        <Text style={[
                            styles.dateButtonText,
                            date && isSameDay(date, selectedDate) && styles.selectedDateButtonText,
                            !date && styles.emptyDateButton
                        ]}>
                            {date ? date.getDate() : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }

    // Add empty spaces to complete the last week
    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
};

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

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

export default function CalendarScreen() {
    const [selectedTab, setSelectedTab] = useState<'calendar' | 'history'>('calendar');
    const [currentStreak, setCurrentStreak] = useState(0);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDateActivities, setSelectedDateActivities] = useState<Activity[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activities.length > 0) {
            updateSelectedDateActivities();
        }
    }, [selectedDate, activities]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchStreak(), fetchActivities()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStreak = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.rpc('get_current_streak', {
                user_uuid: user.id
            });

            if (error) throw error;
            setCurrentStreak(data || 0);
        } catch (error) {
            console.error('Error fetching streak:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: activities, error: activitiesError } = await supabase
                .from('user_activities')
                .select('*')
                .eq('user_id', user.id)
                .order('activity_date', { ascending: false });

            if (activitiesError) throw activitiesError;

            const journalActivities = activities?.filter(a => a.activity_type === 'journal') || [];
            const { data: journalEntries, error: journalError } = await supabase
                .from('journal_entries')
                .select('*')
                .in('id', journalActivities.map(a => a.id));

            if (journalError) throw journalError;

            const transformedData = (activities || []).map(activity => ({
                ...activity,
                journal_entry: journalEntries?.find(j => j.id === activity.id)
            }));

            setActivities(transformedData);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const updateSelectedDateActivities = () => {
        // Get the activity_date format to match exactly how it's stored in the database
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const dayActivities = activities.filter(activity =>
            activity.activity_date === dateString
        );
        setSelectedDateActivities(dayActivities);
    };

    const renderCalendarView = () => (
        <ScrollView style={styles.calendarContainer}>
            <CustomDatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />
            <View style={styles.selectedDateActivities}>
                <Text style={styles.selectedDateText}>
                    Activities for {formatDate(selectedDate.toISOString())}:
                </Text>
                {selectedDateActivities.map((activity) => (
                    <View
                        key={activity.id}
                        style={styles.activityCard}
                    >
                        <View style={styles.activityContent}>
                            <View>
                                <Text style={styles.activityType}>
                                    {activity.activity_type === 'meditation' ? 'Meditation' : 'Journal Entry'}
                                </Text>
                                <Text style={styles.activityTime}>
                                    {formatTime(activity.created_at)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
                {selectedDateActivities.length === 0 && (
                    <Text style={styles.noActivitiesText}>
                        No activities for this date
                    </Text>
                )}
            </View>
        </ScrollView>
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <LoadingScreen />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Calendar',
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                }}
            />

            <View style={styles.streakCard}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakText}>Day Streak</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'calendar' && styles.selectedTab
                    ]}
                    onPress={() => setSelectedTab('calendar')}
                >
                    <Text style={[
                        styles.tabText,
                        selectedTab === 'calendar' && styles.selectedTabText
                    ]}>Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'history' && styles.selectedTab
                    ]}
                    onPress={() => setSelectedTab('history')}
                >
                    <Text style={[
                        styles.tabText,
                        selectedTab === 'history' && styles.selectedTabText
                    ]}>History</Text>
                </TouchableOpacity>
            </View>

            {selectedTab === 'calendar' ? renderCalendarView() : (
                <ScrollView style={styles.historyContainer}>
                    {activities.map((activity, index) => (
                        <View
                            key={activity.id}
                            style={[
                                styles.activityCard,
                                index === 0 && styles.firstActivityCard
                            ]}
                        >
                            <View style={styles.activityContent}>
                                <View>
                                    <Text style={styles.activityDate}>
                                        {formatDate(activity.activity_date)}
                                    </Text>
                                    <Text style={styles.activityType}>
                                        {activity.activity_type === 'meditation' ? 'Meditation' : 'Journal Entry'}
                                    </Text>
                                    <Text style={styles.activityTime}>
                                        {formatTime(activity.created_at)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingScreen: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingTitle: {
        color: '#fff',
        fontSize: 32,
        marginBottom: 32,
        opacity: 0.9,
    },
    breatheText: {
        color: '#fff',
        fontSize: 24,
        opacity: 0.6,
        fontWeight: '300',
        letterSpacing: 3,
    },
    streakCard: {
        backgroundColor: '#1a1a1a',
        margin: 16,
        marginTop: 4,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    streakNumber: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    streakText: {
        color: '#fff',
        opacity: 0.7,
        fontSize: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    selectedTab: {
        backgroundColor: '#fff',
    },
    tabText: {
        color: '#fff',
        opacity: 0.7,
        fontSize: 14,
    },
    selectedTabText: {
        color: '#000',
        opacity: 1,
    },
    calendarContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    datePickerContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        margin: 16,
        padding: 16,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    datePickerButton: {
        padding: 8,
    },
    datePickerButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    datePickerMonth: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    daysContainer: {
        flexDirection: 'row',
    },
    dayHeader: {
        flex: 1,
        color: '#666',
        textAlign: 'center',
        fontSize: 12,
    },
    datesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dateButton: {
        width: '14.28%',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 13,
    },
    selectedDateButton: {
        backgroundColor: '#333',
        borderRadius: 16,
    },
    selectedDateButtonText: {
        color: '#fff',
    },
    emptyDateButton: {
        opacity: 0,
    },
    selectedDateActivities: {
        padding: 16,
        paddingTop: 0,
    },
    selectedDateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    noActivitiesText: {
        color: '#fff',
        opacity: 0.7,
        textAlign: 'center',
        marginTop: 20,
    },
    historyContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    activityCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    firstActivityCard: {
        borderWidth: 1,
        borderColor: '#333',
    },
    activityContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityDate: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    activityType: {
        color: '#fff',
        opacity: 0.7,
        fontSize: 14,
        marginTop: 4,
    },
    activityTime: {
        color: '#fff',
        opacity: 0.5,
        fontSize: 12,
        marginTop: 2,
    },
}); 