import OpenAI from 'openai';

// Initialize the OpenAI client with DeepSeek configuration
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',  // Using v1 endpoint for better compatibility
    apiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
});

export type DeepSeekModel =
    | 'deepseek-chat'  // DeepSeek-V3
    | 'deepseek-reasoner'  // DeepSeek-R1
    | 'deepseek-coder'  // For code-related tasks
    | 'deepseek-chat-v1';  // Older version, might be more economical

export interface DeepSeekResponse {
    content: string;
    error?: string;
    model?: string;
}

export const getDeepSeekResponse = async (
    prompt: string,
    model: DeepSeekModel = 'deepseek-chat-v1' // Using v1 as default
): Promise<DeepSeekResponse> => {
    try {
        console.log('Attempting with model:', model);

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a helpful and insightful assistant.' },
                { role: 'user', content: prompt },
            ],
            model,
            max_tokens: 150,  // Limiting token usage for testing
            temperature: 0.7,
        });

        return {
            content: completion.choices[0]?.message?.content || 'No response generated',
            model: model,
        };
    } catch (error) {
        console.error('DeepSeek API Error:', error);

        // Enhanced error handling
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            if (error.message.includes('402')) {
                errorMessage = `Insufficient balance for model "${model}". This model requires credits.`;
            } else if (error.message.includes('401')) {
                errorMessage = 'Invalid API key or authentication error.';
            } else if (error.message.includes('404')) {
                errorMessage = `Model "${model}" not found or not available.`;
            } else {
                errorMessage = error.message;
            }
        }

        return {
            content: '',
            error: errorMessage,
            model: model,
        };
    }
}; 