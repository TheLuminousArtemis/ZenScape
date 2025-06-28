import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SignUpData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export const authService = {
    async signUp({ email, password, firstName, lastName }: SignUpData) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) throw error;

        // Set the new signup flag
        await AsyncStorage.setItem('isNewSignup', 'true');

        return data;
    },

    async signIn({ email, password }: SignInData) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },
}; 