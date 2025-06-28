import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { authService } from '../src/services/auth';

export default function Profile() {
    const [userDetails, setUserDetails] = useState<any>(null);

    useEffect(() => {
        loadUserDetails();
    }, []);

    const loadUserDetails = async () => {
        const user = await authService.getCurrentUser();
        setUserDetails(user);
    };

    const handleSignOut = async () => {
        try {
            await authService.signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: 'Profile',
                    headerStyle: {
                        backgroundColor: '#000',
                    },
                    headerTintColor: '#fff',
                }}
            />
            {userDetails && (
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>
                            {userDetails.user_metadata?.first_name || 'N/A'} {userDetails.user_metadata?.last_name || ''}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{userDetails.email}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>User ID</Text>
                        <Text style={styles.value}>{userDetails.id}</Text>
                    </View>
                </View>
            )}

            <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.signOutButton}
                textColor="#FFFFFF"
            >
                Sign Out
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        padding: 20,
    },
    detailsContainer: {
        marginTop: 20,
    },
    detailRow: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#999999',
        marginBottom: 5,
    },
    value: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    signOutButton: {
        marginTop: 20,
        borderColor: '#FFFFFF',
        borderRadius: 25,
    },
}); 