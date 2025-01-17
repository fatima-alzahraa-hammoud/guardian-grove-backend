import axios from "axios";
import fs from "fs";

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceId = "sFSJGretr1hLpWXQZ52E";

const TextToSpeech = async(text : string, outputFilePath : string) => {
    try {
        if (!elevenLabsApiKey) {
            throw new Error("ELEVEN_LABS_API_KEY is not defined");
        }

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                headers: {
                    "Content-Type" : "application/json",
                    "xi-api-key" : elevenLabsApiKey,
                },
                body: JSON.stringify({
                    text: text,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.7,
                    },
                }),
                responseType: "stream",
            }
        );

        if (!response || !response.data) {
            throw new Error("No response or data received from the API");
        }

        const fileWriter = fs.createWriteStream(outputFilePath);        
        response.data.pipe(fileWriter);

        return new Promise<string>((resolve, reject) => {
            fileWriter.on("finish", () => resolve(outputFilePath));
            fileWriter.on("error", reject);
        });
    } catch (error) {
        console.log("Error generating text-to-speech")
    }
}