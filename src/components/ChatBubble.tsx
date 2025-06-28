import React from 'react';
import { View, StyleSheet, useColorScheme, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface ChatBubbleProps {
    message: string;
    isUser: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser }) => {
    const theme = useTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const bubbleStyle = [
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        {
            backgroundColor: isUser
                ? theme.colors.primary
                : theme.colors.card,
            borderColor: theme.colors.border,
        }
    ];

    const textColor = isUser
        ? theme.colors.background
        : theme.colors.text;

    return (
        <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
            <View style={bubbleStyle}>
                <Text style={[styles.text, { color: textColor }]}>
                    {message}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        marginVertical: 4,
    },
    userContainer: {
        alignSelf: 'flex-end',
    },
    assistantContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    userBubble: {
        borderTopRightRadius: 4,
    },
    assistantBubble: {
        borderTopLeftRadius: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
    }
}); 