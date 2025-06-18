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
exports.getLastFourChats = exports.getLastChatMessages = void 0;
const chat_model_1 = require("../../models/chat.model");
const getLastChatMessages = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lastChats = yield chat_model_1.Chat.find({ userId }).sort({ updatedAt: -1 }).limit(3);
        // Step 2: Retrieve the last 6 messages for each chat
        const chatMessages = yield Promise.all(lastChats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
            const messages = chat.messages.slice(-6);
            return { chatId: chat._id, messages };
        })));
        return chatMessages;
    }
    catch (error) {
        console.error('Error retrieving last chat messages:', error);
        throw new Error('Failed to retrieve last chat messages');
    }
});
exports.getLastChatMessages = getLastChatMessages;
const getLastFourChats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lastChats = yield chat_model_1.Chat.find({ userId }).sort({ updatedAt: -1 }).limit(4);
        const lastChatMessages = lastChats.map(chat => chat.messages).flat();
        return lastChatMessages;
    }
    catch (error) {
        console.error('Error retrieving last chat messages:', error);
        throw new Error('Failed to retrieve last chat messages');
    }
});
exports.getLastFourChats = getLastFourChats;
