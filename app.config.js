export default {
    expo: {
        name: "ZenScape",
        slug: "ZenScape2",
        version: "0.7.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        userInterfaceStyle: "dark",
        splash: {
            image: "./assets/images/icon.png",
            resizeMode: "contain",
            backgroundColor: "#000000",
            hideExponentText: true,
            androidRoundedCorners: false
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.zenscape.app',
            infoPlist: {
                NSAppTransportSecurity: {
                    NSAllowsArbitraryLoads: true
                }
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#000000"
            },
            package: 'com.zenscape.app',
            permissions: [
                "INTERNET",
                "ACCESS_NETWORK_STATE"
            ]
        },
        web: {
            favicon: "./assets/images/favicon.png"
        },
        extra: {
            eas: {
                projectId: "5dd7cda3-ecee-4615-9b8c-14f4cbbe6365"
            },
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        plugins: [
            "expo-router"
        ]
    }
}; 