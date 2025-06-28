import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Dimensions, FlatList, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu } from 'react-native-paper';
import quotesData from '../../assets/quotes.json';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AUTO_SCROLL_INTERVAL = 22000; // 22 seconds
const CARD_MARGIN = 16;
const HEADER_HEIGHT = 60;
const TOP_SPACING = 145;
const CARD_HEIGHT = Math.min(550, SCREEN_HEIGHT * 0.7);
const PROGRESS_SIZE = 40;

const BACKGROUNDS = [
    {
        type: 'image',
        url: 'https://unsplash.com/photos/NeH6-YKTwUI/download?force=true',
        credit: 'josefin',
        creditUrl: 'https://unsplash.com/photos/NeH6-YKTwUI'
    },
    {
        type: 'image',
        url: 'https://unsplash.com/photos/UIq0MF3OUZw/download?force=true',
        credit: 'Melanie Weidmann',
        creditUrl: 'https://unsplash.com/photos/UIq0MF3OUZw'
    },
    {
        type: 'solid',
        color: '#1a1a1a'
    }
];

type Quote = {
    id: number;
    text: string;
    author: string;
    category: string;
};

export default function InspirationScreen() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All Quotes");
    const [menuVisible, setMenuVisible] = useState(false);
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
    const [progress] = useState(new Animated.Value(0));
    const flatListRef = useRef<FlatList>(null);
    const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            // Load quotes from JSON file
            const loadedQuotes = quotesData.quotes.map(quote => ({
                id: quote.id,
                text: quote.text,
                author: quote.author,
                category: quote.category
            }));
            setQuotes(loadedQuotes);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading quotes:', error);
            setIsLoading(false);
        }
    }, []);

    const filteredQuotes = selectedCategory === "All Quotes"
        ? quotes
        : quotes.filter(quote => quote.category === selectedCategory);

    const cycleBackground = () => {
        setCurrentBackgroundIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    };

    useEffect(() => {
        setIsAutoScrolling(false);
        progress.setValue(0);
        setCurrentQuoteIndex(0);
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (isAutoScrolling) {
            const startProgressAndTimer = () => {
                progress.setValue(0);
                progressAnimation.current = Animated.timing(progress, {
                    toValue: 1,
                    duration: AUTO_SCROLL_INTERVAL,
                    useNativeDriver: true,
                    easing: Easing.linear,
                });

                progressAnimation.current.start(({ finished }) => {
                    if (finished && isAutoScrolling) {
                        const nextIndex = (currentQuoteIndex + 1) % filteredQuotes.length;
                        scrollToQuote(nextIndex);
                        startProgressAndTimer();
                    }
                });
            };

            startProgressAndTimer();
        } else {
            if (progressAnimation.current) {
                progressAnimation.current.stop();
                progress.setValue(0);
            }
        }

        return () => {
            if (progressAnimation.current) {
                progressAnimation.current.stop();
                progress.setValue(0);
            }
        };
    }, [isAutoScrolling, currentQuoteIndex, filteredQuotes.length]);

    const scrollToQuote = (index: number) => {
        if (index >= 0 && index < filteredQuotes.length) {
            flatListRef.current?.scrollToIndex({
                index,
                animated: true
            });
            setCurrentQuoteIndex(index);
        }
    };

    const renderProgressIndicator = () => {
        const scaleX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
        });

        return (
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    onPress={cycleBackground}
                    style={styles.brushButton}
                >
                    <MaterialCommunityIcons
                        name="brush"
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setIsAutoScrolling(!isAutoScrolling)}
                    style={styles.playButton}
                >
                    <MaterialCommunityIcons
                        name={isAutoScrolling ? "pause" : "play"}
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>
                {isAutoScrolling && (
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    transform: [{ scaleX }],
                                }
                            ]}
                        />
                    </View>
                )}
            </View>
        );
    };

    const renderQuoteItem = ({ item: quote }: { item: Quote }) => {
        const currentBackground = BACKGROUNDS[currentBackgroundIndex];

        const handleCreditPress = async () => {
            if (currentBackground.type === 'image' && currentBackground.creditUrl) {
                await Linking.openURL(currentBackground.creditUrl);
            }
        };

        return (
            <View style={styles.quoteCardContainer}>
                <View style={styles.quoteCard}>
                    {currentBackground.type === 'image' ? (
                        <>
                            <Image
                                source={{ uri: currentBackground.url }}
                                style={styles.backgroundImage}
                            />
                            <TouchableOpacity
                                onPress={handleCreditPress}
                                style={styles.photoCreditContainer}
                            >
                                <Text style={styles.photoCredit}>
                                    {currentBackground.credit}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={[styles.backgroundImage, { backgroundColor: currentBackground.color }]} />
                    )}
                    <LinearGradient
                        colors={currentBackground.type === 'image'
                            ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.65)']
                            : ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                        style={styles.gradient}
                    >
                        <View style={styles.quoteContent}>
                            <Text style={[styles.quoteText, { textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 }]}>"{quote.text}"</Text>
                            <Text style={[styles.authorText, { textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 }]}>- {quote.author}</Text>
                            <Text style={[styles.categoryText, { textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 }]}>{quote.category}</Text>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Loading quotes...</Text>
            </View>
        );
    }

    if (quotes.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No quotes available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <TouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => setMenuVisible(true)}
                        >
                            <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
                            <MaterialCommunityIcons name="chevron-down" size={24} color="#fff" />
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setSelectedCategory("All Quotes");
                            setMenuVisible(false);
                        }}
                        title="All Quotes"
                    />
                    {quotesData.categories.map((category) => (
                        <Menu.Item
                            key={category}
                            onPress={() => {
                                setSelectedCategory(category);
                                setMenuVisible(false);
                            }}
                            title={category}
                        />
                    ))}
                </Menu>
                {renderProgressIndicator()}
            </View>

            <FlatList
                ref={flatListRef}
                data={filteredQuotes}
                renderItem={renderQuoteItem}
                keyExtractor={(item) => item.id.toString()}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(event) => {
                    const offset = event.nativeEvent.contentOffset.y;
                    const index = Math.round(offset / SCREEN_HEIGHT);
                    setCurrentQuoteIndex(index);
                }}
                getItemLayout={(data, index) => ({
                    length: SCREEN_HEIGHT,
                    offset: SCREEN_HEIGHT * index,
                    index,
                })}
                contentContainerStyle={styles.flatListContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        minWidth: 150,
    },
    categoryButtonText: {
        color: '#fff',
        fontSize: 16,
        marginRight: 8,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        width: 60,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 1,
        transform: [{ scaleX: 0 }],
    },
    flatListContent: {
        paddingTop: TOP_SPACING - HEADER_HEIGHT,
    },
    quoteCardContainer: {
        height: SCREEN_HEIGHT,
        paddingHorizontal: CARD_MARGIN,
    },
    quoteCard: {
        height: CARD_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quoteContent: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    quoteText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 32,
    },
    authorText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 6,
    },
    categoryText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    photoCreditContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 2,
    },
    photoCredit: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    brushButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 50,
    },
}); 