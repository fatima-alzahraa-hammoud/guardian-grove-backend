import dotenv from "dotenv";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceId = process.env.VOICE_ID;

// Updated function to return Buffer instead of saving to file
export const TextToSpeechBuffer = async (text: string): Promise<Buffer> => {
    try {
        if (!elevenLabsApiKey) {
            throw new Error("ELEVEN_LABS_API_KEY is not defined");
        }

        if (!voiceId) {
            throw new Error("VOICE_ID is not defined");
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": elevenLabsApiKey,
                },
                body: JSON.stringify({
                    text: text,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.7,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`Failed to fetch: ${response.statusText}`);
            console.error(`Error Text: ${errorText}`);
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        // Convert response to buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Audio buffer generated successfully");
        return buffer;
    } catch (error) {
        console.error("Error generating text-to-speech:", error);
        throw error;
    }
};

// Keep the original function for backward compatibility (if needed elsewhere)
export const TextToSpeech = async (text: string, outputFilePath: string): Promise<string> => {
    try {
        const buffer = await TextToSpeechBuffer(text);
        
        // Import fs only when needed for file operations
        const fs = await import("fs");
        
        // Ensure directory exists
        const path = './audio-responses';
        if (!fs.existsSync(path)) {
            console.log(`Directory does not exist, creating: ${path}`);
            fs.mkdirSync(path, { recursive: true });
        }

        // Write buffer to file
        await fs.promises.writeFile(outputFilePath, buffer);
        
        console.log("Audio file saved successfully:", outputFilePath);
        return outputFilePath;
    } catch (error) {
        console.error("Error generating text-to-speech:", error);
        throw error;
    }
};