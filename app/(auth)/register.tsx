import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { authService } from '../../src/services/auth';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        try {
            setLoading(true);
            await authService.signUp({ email, password, firstName, lastName });
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>Begin your path to inner peace</Text>
            <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                mode="outlined"
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
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                mode="outlined"
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
                onPress={handleRegister}
                loading={loading}
                style={styles.button}
                buttonColor="#FFFFFF"
                textColor="#000000"
            >
                Register
            </Button>

            <Link href="/login" asChild>
                <Button
                    mode="text"
                    style={styles.link}
                    textColor="#FFFFFF"
                >
                    Already have an account? Login
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