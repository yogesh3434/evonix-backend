import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment');
}

const genAI = new GoogleGenAI({ apiKey });


export const generateReply = async (
    systemInstruction: string,
    userMessage: string
): Promise<string> => {
    const response = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: userMessage,
        config: {
            systemInstruction,
        },
    });

    return response.text ?? 'Sorry, I could not generate a response.';
};