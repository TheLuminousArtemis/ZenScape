import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API with proper API key configuration
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
console.log('Initializing Gemini API with key:', API_KEY ? 'Key exists' : 'No key found');

if (!API_KEY) {
    console.error('No Gemini API key found in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Emergency keywords for crisis detection
export const EMERGENCY_KEYWORDS = {
    suicide: [
        'suicide', 'kill myself', 'end my life', 'don\'t want to live',
        'better off dead', 'want to die', 'no reason to live'
    ],
    domesticViolence: [
        'abuse', 'hitting me', 'violent', 'threatens me', 'afraid of partner',
        'domestic violence', 'physical abuse', 'emotional abuse'
    ],
    mentalHealth: [
        'severe depression', 'panic attack', 'anxiety attack',
        'hearing voices', 'hallucinating', 'mental breakdown'
    ]
};

// System prompt to guide the model's behavior
export const SYSTEM_PROMPT = `You are a supportive listener trained to provide emotional support and guidance. Your role is to:

1. Listen empathetically and provide non-judgmental support
2. Never give medical advice or try to diagnose conditions
3. Encourage professional help when appropriate
4. Maintain appropriate boundaries
5. Focus on emotional support and coping strategies
6. Be direct and clear about your limitations
7. Recognize and respond appropriately to crisis situations

If someone expresses thoughts of self-harm or suicide, immediately provide crisis resources and encourage professional help.

Remember: You are not a replacement for professional mental health care. Make this clear when appropriate.`;

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type DetectedResources = {
    suicide?: boolean;
    domesticViolence?: boolean;
    mentalHealth?: boolean;
};

// Helper function to detect emergency keywords in a message
export const detectEmergencyKeywords = (message: string): DetectedResources => {
    const lowercaseMessage = message.toLowerCase();
    return {
        suicide: EMERGENCY_KEYWORDS.suicide.some(keyword =>
            lowercaseMessage.includes(keyword.toLowerCase())),
        domesticViolence: EMERGENCY_KEYWORDS.domesticViolence.some(keyword =>
            lowercaseMessage.includes(keyword.toLowerCase())),
        mentalHealth: EMERGENCY_KEYWORDS.mentalHealth.some(keyword =>
            lowercaseMessage.includes(keyword.toLowerCase()))
    };
};

// Crisis resources to be provided when emergency keywords are detected
// export const CRISIS_RESOURCES = {
//     suicide: `If you're having thoughts of suicide, please know that you're not alone.
//     Contact the 988 Suicide & Crisis Lifeline:
//     - Call or text 988
//     - Chat at 988lifeline.org
//     Available 24/7 for free, confidential support.`,

//     domesticViolence: `If you're experiencing domestic violence, help is available:
//     - National Domestic Violence Hotline: 1-800-799-SAFE (7233)
//     - Visit thehotline.org to chat online
//     They can help you find local resources and create a safety plan.`,

//     mentalHealth: `For mental health support:
//     - SAMHSA's National Helpline: 1-800-662-4357
//     - Available 24/7 for free, confidential treatment referrals
//     - Visit samhsa.gov for more resources`
// };

export const CRISIS_RESOURCES = {
    suicide: `If you're having thoughts of suicide, please know that help is available:
    - **Vandrevala Foundation Helpline**: Call 1860-2662-345 or 1800-2333-330 (24/7)  
    - **iCall Psychosocial Helpline**: WhatsApp/Call +91-9152987821 (Mon-Sat, 10 AM to 8 PM)  
    - **AASRA Suicide Prevention**: Call +91-9820466726 (24/7)  
    - **Roshni Helpline (Hyderabad)**: +91-4066202000 (24/7)  
    You are not alone. Reach out for confidential support.`,

    domesticViolence: `If you're experiencing domestic violence, these services can help:
    - **National Commission for Women (NCW) Helpline**: Call 7827-170-170 (24/7)  
    - **Police Emergency**: Dial 100 or 112 (Pan-India)  
    - **Women Helpline (Govt. of India)**: Call 181 (24/7)  
    - **Shakti Shalini (Delhi NGO)**: +91-8800799971 (Shelter & legal aid)  
    - **Majlis Legal Centre (Mumbai)**: +91-9833054422 (Legal support)`,

    mentalHealth: `For mental health support in India:
    - **KIRAN Mental Health Helpline (Govt.)**: Call 1800-599-0019 (24/7)  
    - **NIMHANS Helpline (Bengaluru)**: +91-8046110000 (Mon-Sat, 8 AM to 10 PM)  
    - **Fortis Stress Helpline**: +91-8376804102 (24/7)  
    - **The Live Love Laugh Foundation**: Visit livelovelaughfoundation.org for resources  
    - **Manas Foundation (Delhi)**: +91-9818106144 (Counselling services)`
};


export const geminiChat = async (
    messages: ChatMessage[],
    temperature = 0.7
): Promise<{ response: string; detectedResources: DetectedResources }> => {
    try {
        console.log('Starting chat with messages:', messages);

        // Get the model - using gemini-2.0-flash instead of gemini-pro
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',  // Updated model name
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
            generationConfig: {
                temperature,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        console.log('Model configured, attempting direct content generation...');

        // Get the last user message
        const userMessage = messages[messages.length - 1].content;
        console.log('Sending message:', userMessage);

        // Generate content using the text directly
        const result = await model.generateContent(userMessage);
        console.log('Response received from Gemini');

        const response = result.response.text();

        // Get the last user message to check for emergency keywords
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        const detectedResources = lastUserMessage
            ? detectEmergencyKeywords(lastUserMessage.content)
            : {};

        // If emergency keywords were detected, append crisis resources
        let finalResponse = response;
        if (detectedResources.suicide) {
            finalResponse += '\n\n' + CRISIS_RESOURCES.suicide;
        }
        if (detectedResources.domesticViolence) {
            finalResponse += '\n\n' + CRISIS_RESOURCES.domesticViolence;
        }
        if (detectedResources.mentalHealth) {
            finalResponse += '\n\n' + CRISIS_RESOURCES.mentalHealth;
        }

        return {
            response: finalResponse,
            detectedResources,
        };
    } catch (error) {
        console.error('Detailed Gemini API Error:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }
        throw error;
    }
}; 