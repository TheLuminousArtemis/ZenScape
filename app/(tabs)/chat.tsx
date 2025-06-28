import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { geminiChat, ChatMessage, DetectedResources } from '../../services/geminiService';
import { setClearChatCallback } from './_layout';
import { useNavigation } from '@react-navigation/native';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    resources?: DetectedResources;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleClearChat = () => {
        Alert.alert(
            'Clear Chat',
            'Are you sure you want to clear all messages?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Clear',
                    onPress: () => setMessages([]),
                    style: 'destructive',
                },
            ],
            { cancelable: true }
        );
    };

    useEffect(() => {
        // Set up the header menu
        navigation.setOptions({
            headerRight: () => (
                <Menu>
                    <MenuTrigger>
                        <MaterialCommunityIcons
                            name="dots-vertical"
                            size={24}
                            color="#FFFFFF"
                            style={{ marginRight: 16 }}
                        />
                    </MenuTrigger>
                    <MenuOptions customStyles={menuStyles}>
                        <MenuOption onSelect={handleClearChat}>
                            <View style={styles.menuItem}>
                                <MaterialCommunityIcons name="delete-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.menuText}>Clear Chat</Text>
                            </View>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
            ),
        });
    }, [navigation]);

    // Update the clear chat callback when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setClearChatCallback(() => handleClearChat);
        } else {
            setClearChatCallback(null);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Convert messages to ChatMessage format for Gemini
            const chatMessages: ChatMessage[] = [
                {
                    role: 'system',
                    content: 'You are Zen, a supportive and empathetic AI assistant. Always refer to yourself as Zen when talking about yourself. Your responses should be calm, mindful, and promote emotional well-being.'
                },
                ...messages.map(msg => ({
                    role: msg.sender as 'user' | 'assistant',
                    content: msg.text,
                })),
                { role: 'user', content: userMessage.text },
            ];

            const response = await geminiChat(chatMessages);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.response,
                sender: 'assistant',
                timestamp: new Date(),
                resources: response.detectedResources,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'I apologize, but I encountered an error. Please try again.',
                sender: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Scroll to bottom after new message
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const renderResourceIndicators = (resources: DetectedResources) => {
        if (!resources.suicide && !resources.domesticViolence && !resources.mentalHealth) {
            return null;
        }

        return (
            <View style={styles.resourcesContainer}>
                {resources.suicide && (
                    <View style={[styles.resourceBadge, styles.resourceSuicide]}>
                        <Text style={styles.resourceText}>Crisis Resources Provided</Text>
                    </View>
                )}
                {resources.domesticViolence && (
                    <View style={[styles.resourceBadge, styles.resourceDV]}>
                        <Text style={styles.resourceText}>Support Resources Provided</Text>
                    </View>
                )}
                {resources.mentalHealth && (
                    <View style={[styles.resourceBadge, styles.resourceMH]}>
                        <Text style={styles.resourceText}>Mental Health Resources Provided</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={[
                    styles.messagesContent,
                    { paddingBottom: insets.bottom + 80 }
                ]}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBubble,
                            message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                message.sender === 'user' && styles.userMessageText
                            ]}
                        >
                            {message.text}
                        </Text>
                        {message.resources && renderResourceIndicators(message.resources)}
                    </View>
                ))}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[
                    styles.inputContainer,
                    { paddingBottom: Math.max(insets.bottom, 16) }
                ]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { maxHeight: 100 }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor="#666666"
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isLoading}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={24}
                                color={!inputText.trim() || isLoading ? '#666666' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const menuStyles = {
    optionsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 4,
        marginTop: 8,
        width: 160,
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    userMessage: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantMessage: {
        backgroundColor: '#1C1C1E',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#1C1C1E',
        backgroundColor: '#000000',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        paddingVertical: 8,
        paddingRight: 40,
    },
    sendButton: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    menuText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 12,
    },
    resourcesContainer: {
        marginTop: 8,
        flexDirection: 'column',
        gap: 4,
    },
    resourceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    resourceText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    resourceSuicide: {
        backgroundColor: '#d32f2f',
    },
    resourceDV: {
        backgroundColor: '#7b1fa2',
    },
    resourceMH: {
        backgroundColor: '#1976d2',
    },
}); 