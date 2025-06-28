import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#000000',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    headerTitle: 'Login',
                    headerTitleAlign: 'center',
                    title: 'Login',
                    headerSubtitle: 'Welcome back to your mindful journey',
                    headerSubtitleStyle: {
                        color: '#FFFFFF',
                        fontSize: 12,
                    },
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    headerTitle: 'Register',
                    headerTitleAlign: 'center',
                    title: 'Register',
                    headerSubtitle: 'Begin your path to inner peace',
                    headerSubtitleStyle: {
                        color: '#FFFFFF',
                        fontSize: 12,
                    },
                }}
            />
        </Stack>
    );
} 