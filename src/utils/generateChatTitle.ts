import { IMessage } from "../interfaces/IMessage";
import { openai } from '../index'; 

// Function to generate a small title from the last 3 messages using AI
export const generateChatTitle = async (messages: IMessage[]): Promise<string> => {
    const lastMessages = messages.slice(-3).map(msg => msg.message).join(" ");

    const aiPrompt = `Summarize the following conversation and create a maximum of three words, relevant title based on the content:
    "${lastMessages}"`;

    try {
        // Get the AI response for summarization
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes messages into concise titles of maximum two three words without word title:." },
                { role: "user", content: aiPrompt }
            ],
            max_tokens: 20,
        });

        // Extract and return the generated title from AI response
        const aiTitle = response.choices[0]?.message?.content?.trim();
        return aiTitle && aiTitle.length > 0 ? aiTitle : "New Chat";
    } catch (error) {
        console.error("Error generating AI title:", error);
        return "New Chat"; // Return default title if AI fails
    }
};
