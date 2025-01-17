import * as fs from "fs";
import { Readable } from "stream";

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceId = "sFSJGretr1hLpWXQZ52E";

export const TextToSpeech = async(text : string, outputFilePath : string) => {
    try {
        if (!elevenLabsApiKey) {
            throw new Error("ELEVEN_LABS_API_KEY is not defined");
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
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const fileWriter = fs.createWriteStream(outputFilePath);      
          
        const readableStream = Readable.fromWeb(response.body as any);
        readableStream.pipe(fileWriter);
        
        return new Promise<string>((resolve, reject) => {
            fileWriter.on("finish", () => resolve(outputFilePath));
            fileWriter.on("error", reject);
        });
    } catch (error) {
        console.log("Error generating text-to-speech")
    }
}