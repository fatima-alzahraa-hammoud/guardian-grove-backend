"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioFileToBase64 = exports.TextToSpeech = void 0;
const fs = __importStar(require("fs"));
const stream_1 = require("stream");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceId = process.env.VOICE_ID;
const TextToSpeech = (text, outputFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!elevenLabsApiKey) {
            throw new Error("ELEVEN_LABS_API_KEY is not defined");
        }
        const path = './audio-responses';
        if (!fs.existsSync(path)) {
            console.log(`Directory does not exist, creating: ${path}`);
            fs.mkdirSync(path, { recursive: true });
        }
        const response = yield fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
        });
        if (!response.ok) {
            const errorText = yield response.text();
            console.log(`Failed to fetch: ${response.statusText}`);
            console.error(`Error Text: ${errorText}`);
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const fileWriter = fs.createWriteStream(outputFilePath);
        const readableStream = stream_1.Readable.fromWeb(response.body);
        readableStream.pipe(fileWriter);
        return new Promise((resolve, reject) => {
            fileWriter.on("finish", () => {
                console.log("Audio file saved successfully:", outputFilePath);
                resolve(outputFilePath);
            });
            fileWriter.on("error", (err) => {
                console.error("Error writing audio file:", err);
                reject(err);
            });
        });
    }
    catch (error) {
        console.log("Error generating text-to-speech");
    }
});
exports.TextToSpeech = TextToSpeech;
const audioFileToBase64 = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield fs.promises.readFile(filePath);
        const base64 = data.toString("base64");
        return base64;
    }
    catch (error) {
        console.error("Error reading or converting audio file to base64:", error);
        throw error;
    }
});
exports.audioFileToBase64 = audioFileToBase64;
