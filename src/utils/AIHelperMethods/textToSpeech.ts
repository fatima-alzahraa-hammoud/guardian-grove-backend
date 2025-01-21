
import * as fs from "fs";
import { Readable } from "stream";
import dotenv from "dotenv";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceId = process.env.VOICE_ID;

export const TextToSpeech = async(text : string, outputFilePath : string) => {
    try {
        if (!elevenLabsApiKey) {
            throw new Error("ELEVEN_LABS_API_KEY is not defined");
        }

        const path = './audio-responses';
        if (!fs.existsSync(path)) {
            console.log(`Directory does not exist, creating: ${path}`);
            fs.mkdirSync(path, { recursive: true });
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

        const fileWriter = fs.createWriteStream(outputFilePath);      

        const readableStream = Readable.fromWeb(response.body as any);
        readableStream.pipe(fileWriter);
        
        return new Promise<string>((resolve, reject) => {
            fileWriter.on("finish", () => {
                console.log("Audio file saved successfully:", outputFilePath);
                resolve(outputFilePath);
            });
            fileWriter.on("error", (err) => {
                console.error("Error writing audio file:", err);
                reject(err);
            });
        });
    } catch (error) {
        console.log("Error generating text-to-speech")
    }
}

export const audioFileToBase64 = async (filePath: string): Promise<string> => {
    try {

        const data = await fs.promises.readFile(filePath);
        const base64 = data.toString("base64");

        return base64;
    } catch (error) {
        console.error("Error reading or converting audio file to base64:", error);
        throw error;
    }
};