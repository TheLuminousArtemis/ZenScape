import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { authService } from '../../src/services/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);
            await authService.signIn({ email, password });
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>Welcome back to your mindful journey</Text>
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{
                    colors: {
                        primary: '#FFFFFF',
                        text: '#FFFFFF',
                        placeholder: '#666666',
                        background: '#000000',
                    },
                }}
                textColor="#FFFFFF"
                outlineColor="#333333"
                activeOutlineColor="#FFFFFF"
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                theme={{
                    colors: {
                        primary: '#FFFFFF',
                        text: '#FFFFFF',
                        placeholder: '#666666',
                        background: '#000000',
                    },
                }}
                textColor="#FFFFFF"
                outlineColor="#333333"
                activeOutlineColor="#FFFFFF"
            />

            <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
                buttonColor="#FFFFFF"
                textColor="#000000"
            >
                Login
            </Button>

            <Link href="/register" asChild>
                <Button
                    mode="text"
                    style={styles.link}
                    textColor="#FFFFFF"
                >
                    Don't have an account? Register
                </Button>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#000000',
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.9,
        letterSpacing: 0.5,
        lineHeight: 30,
        paddingHorizontal: 20,
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#000000',
    },
    button: {
        marginTop: 10,
        borderRadius: 8,
    },
    link: {
        marginTop: 15,
    },
}); 