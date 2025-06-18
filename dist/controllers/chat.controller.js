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
exports.renameChat = exports.deleteChat = exports.getChatById = exports.getUserChatsOrCreate = exports.startNewChat = exports.handleChat = void 0;
const chat_model_1 = require("../models/chat.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
const __1 = require("..");
const generateChatTitle_1 = require("../utils/generateChatTitle");
const textToSpeech_1 = require("../utils/AIHelperMethods/textToSpeech");
//API to send messages and save (and create new chat if no chat exists)
const handleChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;
        const { chatId, message, sender, image, isCall } = req.body;
        if (!sender || (!message && !image)) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        let chat;
        if (chatId) {
            if (!(0, checkId_1.checkId)({ id: chatId, res }))
                return;
            chat = yield chat_model_1.Chat.findOne({ _id: chatId });
        }
        // If no id exists or no chat with that id, create a new one
        if (!chatId || !chat) {
            chat = new chat_model_1.Chat({ userId, title: "New Chat", messages: [] });
        }
        // Add user message to the chat
        chat.messages.push({
            sender: sender,
            message: message,
            image,
            timestamp: new Date(),
        });
        // Check if chat title is "New Chat" and there are 3 messages
        if (chat.title === "New Chat" && chat.messages.length >= 3) {
            const generatedTitle = yield (0, generateChatTitle_1.generateChatTitle)(chat.messages);
            chat.title = generatedTitle; // Update chat title
        }
        // Prepare last 6 messages for AI context
        const lastMessages = chat.messages.slice(-6).map((msg) => ({
            role: msg.sender === "bot" ? "assistant" : "user",
            content: msg.message || "",
        }));
        if (sender === "bot") {
            const sendedMessage = { sender, message };
            yield chat.save();
            res.status(200).send({ message: 'Message sent', chat: chat, sendedMessage });
            return;
        }
        // Add instructions and conversation context to the prompt
        const aiPrompt = [
            {
                role: "system",
                content: `
                    Always respond with friendly way
                    You are the Guardian Grove AI, a family companion designed to help and support both parents and children. As an AI friend for the entire family, your role is to:

                    - Assist with real-time support, answering any questions that parents or children have.
                    - Offer parenting tips and advice based on the child’s age, interests, and behavior.
                    - Track the child’s routine, mood, and location, alerting parents when necessary.
                    - Suggest fun and educational activities like reading, sports, and learning new skills for the child.
                    - Encourage collaboration by setting tasks that parents and children can do together, rewarding achievements with stars and coins.
                    - Provide step-by-step guidance on completing tasks or solving problems.
                    - Support parents with personalized growth plans for their children.
                    - Be a friendly voice for the family, providing advice and helping them in all aspects of their lives.
                    
                    Your purpose is to make the family's life easier, safer, and more fulfilling by fostering growth, communication, and bonding.

                    Always generate organized and structured in a beautiful and friendly way. Bold the important ideas!

                    Bold the important ideas, and user break line!
                `,
            },
            ...lastMessages,
        ];
        // Generate AI response
        const response = yield __1.openai.chat.completions.create({
            model: "gpt-4",
            messages: aiPrompt,
        });
        const aiMessage = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        // Add AI response to chat
        if (aiMessage) {
            chat.messages.push({
                sender: "bot",
                message: aiMessage,
                timestamp: new Date(),
            });
        }
        yield chat.save();
        const sendedMessage = { sender, message };
        if (isCall) {
            const outputFilePath = `./audio-responses/message_${chatId}_${new Date().getTime()}.mp3`;
            yield (0, textToSpeech_1.TextToSpeech)(aiMessage || "no message found", outputFilePath); // Save audio
            const audio = yield (0, textToSpeech_1.audioFileToBase64)(outputFilePath);
            res.status(200).send({
                message: 'Message sent',
                chat: chat,
                sendedMessage,
                aiResponse: response.choices[0].message,
                audio
            });
            return;
        }
        // Respond with AI message without the audio file
        res.status(200).send({
            message: 'Message sent',
            chat: chat,
            sendedMessage,
            aiResponse: response.choices[0].message,
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error occured while sending message or creating chat", res, status: 500 });
    }
});
exports.handleChat = handleChat;
// Create a new chat
const startNewChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;
        const { sender, message, image } = req.body;
        if (!sender || (!image && !message)) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const newChat = new chat_model_1.Chat({
            userId,
            title: "New Chat",
            messages: []
        });
        newChat.messages.push({
            sender: sender,
            message: message,
            image,
            timestamp: new Date(),
        });
        yield newChat.save();
        res.status(200).send({ message: 'Chat started and message sent', chat: newChat });
    }
    catch (err) {
        console.error(err);
        return (0, error_1.throwError)({ message: "Error starting chat!", res, status: 500 });
    }
});
exports.startNewChat = startNewChat;
//API to get all chats for user
const getUserChatsOrCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;
        const existingChats = yield chat_model_1.Chat.find({ userId });
        if (existingChats.length > 0) {
            res.status(200).json({ message: "Chats retrieved successfully", chats: existingChats });
            return;
        }
        const newChat = new chat_model_1.Chat({
            title: "Welcome Chat",
            messages: [],
            userId,
        });
        const aiPrompt = [
            {
                role: "system",
                content: `
                    You are the Guardian Grove AI, a family companion designed to help and support both parents and children. As an AI friend for the entire family, your role is to:

                    Your purpose is to make the family's life easier, safer, and more fulfilling by fostering growth, communication, and bonding.

                    Write a warm, short, and inviting message welcoming the user, briefly explaining the purpose of Guardian Grove, and include a friendly question. The message should be structured with line breaks for clarity and organized with bold and friendly emojies
                    
                    Always generate organized and structured in a beautiful and friendly way. Bold the important ideas!

                    Bold the important ideas, and user break line!
                `
            },
        ];
        const aiResponse = yield __1.openai.chat.completions.create({
            model: "gpt-4",
            messages: aiPrompt,
            max_tokens: 200,
        });
        let welcomingMessage = ((_a = aiResponse.choices[0]) === null || _a === void 0 ? void 0 : _a.message.content) || "Welcome to Guardian Grove! 🌳💚";
        welcomingMessage = welcomingMessage.replace(/\n\n/g, " ");
        // Add the generated welcoming message to the new chat
        newChat.messages.push({
            sender: "bot",
            message: welcomingMessage,
            timestamp: new Date(),
        });
        yield newChat.save();
        res.status(201).json({ message: 'Chat created successfully', chats: newChat });
    }
    catch (err) {
        console.error(err);
        if (err instanceof Error) {
            res.status(500).json({ message: 'Error fetching chats!', error: err.message });
            return;
        }
        return (0, error_1.throwError)({ message: "An unknown error occurred", res, status: 500 });
    }
});
exports.getUserChatsOrCreate = getUserChatsOrCreate;
// Get chat by ID
const getChatById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;
        const { chatId } = req.body;
        const chat = yield chat_model_1.Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return (0, error_1.throwError)({ message: "Chat not found!", res, status: 404 });
        }
        res.status(200).send({ message: 'Chat retrieved successfully', chat: chat });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error fetching chat!");
    }
});
exports.getChatById = getChatById;
//API to delete a chat
const deleteChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { chatId } = req.body;
        if (!(0, checkId_1.checkId)({ id: chatId, res }))
            return;
        const userId = req.user._id;
        const chat = yield chat_model_1.Chat.findByIdAndDelete({ _id: chatId, userId });
        if (!chat) {
            return (0, error_1.throwError)({ message: "Chat not found!", res, status: 404 });
        }
        if (chat.userId.toString() !== req.user.id) {
            return (0, error_1.throwError)({ message: "Unauthorized to delete this chat.", res, status: 403 });
        }
        res.status(200).send({ message: 'Chat deleted successfully!', chat: chat });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error deleting chat!");
    }
});
exports.deleteChat = deleteChat;
//API to rename a chat
const renameChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { chatId, title } = req.body;
        if (!(0, checkId_1.checkId)({ id: chatId, res }))
            return;
        if (!title || title.trim() === "") {
            return (0, error_1.throwError)({ message: "Title is required.", res, status: 400 });
        }
        const chat = yield chat_model_1.Chat.findById(chatId);
        if (!chat) {
            return (0, error_1.throwError)({ message: "Chat not found.", res, status: 404 });
        }
        if (chat.userId.toString() !== req.user.id) {
            return (0, error_1.throwError)({ message: "Unauthorized to rename this chat.", res, status: 403 });
        }
        // Update the chat title
        chat.title = title;
        yield chat.save();
        res.status(200).json({ message: "Chat renamed successfully.", chat });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error renaming chat!");
    }
});
exports.renameChat = renameChat;
