import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WelcomeCardProps {
    onDismiss: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onDismiss }) => {
    const handleDismiss = async () => {
        try {
            await AsyncStorage.setItem('welcomeCardDismissed', 'true');
            onDismiss();
        } catch (error) {
            console.error('Error saving welcome card state:', error);
        }
    };

    return (
        <Animated.View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome to ZenScape</Text>
                    <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Your Journey to Mindfulness</Text>
                <Text style={styles.description}>
                    Begin your path to inner peace and self-discovery with our guided meditation, mindful chat, and daily inspiration.
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#007AFF',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#CCCCCC',
        lineHeight: 20,
    },
}); 