"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatTitle = void 0;
const index_1 = require("../index");
// Function to generate a small title from the last 3 messages using AI
const generateChatTitle = (messages) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const lastMessages = messages.slice(-3).map(msg => msg.message).join(" ");
    const aiPrompt = `Summarize the following conversation and create a maximum of three words, relevant title based on the content:
    "${lastMessages}"`;
    try {
        // Get the AI response for summarization
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes messages into concise titles of maximum two three words without word title:." },
                { role: "user", content: aiPrompt }
            ],
            max_tokens: 20,
        });
        // Extract and return the generated title from AI response
        const aiTitle = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        return aiTitle && aiTitle.length > 0 ? aiTitle : "New Chat";
    }
    catch (error) {
        console.error("Error generating AI title:", error);
        return "New Chat"; // Return default title if AI fails
    }
});
exports.generateChatTitle = generateChatTitle;
