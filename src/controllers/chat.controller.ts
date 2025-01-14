import { Request, response, Response } from "express";
import { Chat } from "../models/chat.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";
import { IMessage } from "../interfaces/IMessage";
import { openai } from "..";
import { ChatCompletionMessageParam } from "openai/resources";

//API to send messages and save (and create new chat if no chat exists)

export const handleChat = async (req: CustomRequest, res: Response) => {

    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
    
        const userId = req.user._id;

        const { chatId, message, sender, image } = req.body;
    
        if (!sender || (!message && !image)) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        let chat;
    
        if(chatId){ 
            if (!checkId({id: chatId, res})) return;
            chat = await Chat.findOne({ _id: chatId });
        }
            
        // If no id exists or no chat with that id, create a new one
        if (!chatId || !chat) {
            chat = new Chat({ userId, title: "New Chat", messages: [] });
        }    

        // Add user message to the chat
        chat.messages.push({
            sender: "user",
            message: message,
            image,
            timestamp: new Date(),
        } as IMessage);
    
        // Prepare last 6 messages for AI context
        const lastMessages : ChatCompletionMessageParam[] = chat.messages.slice(-6).map((msg) => ({
            role: msg.sender === "bot" ? "assistant" : "user",
            content: msg.message || "",
        }));

        // Add instructions and conversation context to the prompt
        const aiPrompt : ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: "You are a helpful assistant, providing relevant responses based on the conversation history. Make sure to remember context from previous messages and respond thoughtfully to the user's message.",
            },
            ...lastMessages,
        ];

        // Generate AI response
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: aiPrompt,
            max_tokens: 150,
        });

        // Add AI response to chat
        if (response.choices[0]?.message) {
            chat.messages.push({
            sender: "bot",
            message: response.choices[0].message.content,
            timestamp: new Date(),
            } as IMessage);
        }

        const sendedMessage = {sender, message};

        await chat.save();
        res.status(200).send({ message: 'Message sent', chat: chat, sendedMessage, aiResponse: response.choices[0].message });
    
    }catch(error){
        return throwError({ message: "Error occured while sending message or creating chat", res, status: 500 });
    }
};

// helper function to generate a welcoming message:

//API to handle chat

// Create a new chat
export const startNewChat = async (req: CustomRequest, res: Response) => {
    try {

        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
    
        const userId = req.user._id;
        const { sender, message, title, image } = req.body;

        if (!sender || (!image && !message)) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newChat = new Chat({
            userId,
            title: title || message.substring(0, 40),
            messages: [{ sender: sender, message: message , image: image}]
        });

        const savedChat = await newChat.save();
        res.status(201).send({ message: 'Chat started and message sent', chat: savedChat });
    } catch (err) {
        console.error(err);
        return throwError({ message: "Error starting chat!", res, status: 500 });
    }
};

//API to send message and receive bot response
export const sendMessage = async (req: CustomRequest, res: Response) => {
    try {

        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
    
        const userId = req.user._id;
    
        const { chatId, text, image } = req.body;
        if (!checkId({id: chatId, res})) return;
    
        if (!image && !text) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const chat = await Chat.findOne({ _id: chatId, userId });
        if (!chat){
            return throwError({ message: "Chat not found!", res, status: 404 });
        }

        // Add user message
        chat.messages.push({
            sender: "user",
            message: text,
            image: image,
            timestamp: new Date()
        } as IMessage);

        // Simulate bot response (you can integrate with OpenAI API here)
        const botResponse = `AI: ${text}`;

        chat.messages.push({
            sender: "bot",
            message: botResponse,
            image: image,
            timestamp: new Date()
        } as IMessage);

        await chat.save();
        res.status(200).send({ message: 'AI response generated successfully and Chat saved', response: botResponse, chat: chat });
        
    } catch (err) {
        console.error(err);
        return throwError({ message: "Error sending message!", res, status: 500 });
    }
};

//API to get all chats for user
export const getUserChatsOrCreate = async (req: CustomRequest, res: Response) => {
    try {
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;

        const existingChats = await Chat.find({ userId });

        if (existingChats.length > 0) {
            res.status(200).json({message: "Chats retrieved successfully", chats: existingChats });
            return;
        }

        const newChat = new Chat({
            title: "Welcome Chat",
            messages: [],
            userId,
        });

        await newChat.save();

        res.status(201).json({message: 'Chat created successfully', chats: newChat });

    } catch (err) {
        console.error(err);
        if (err instanceof Error) { 
            res.status(500).json({ message: 'Error fetching chats!', error: err.message });
            return;
        }
        return throwError({ message: "An unknown error occurred", res, status: 500 });
    }
};

// Get chat by ID
export const getChatById = async (req: CustomRequest, res: Response) => {
    try {
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;

        const { chatId } = req.body;

        const chat = await Chat.findOne({ _id: chatId, userId });
        if (!chat) {
            return throwError({ message: "Chat not found!", res, status: 404 });
        }

        res.status(200).send({ message: 'Chat retrieved successfully', chat: chat});
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching chat!");
    }
};

//API to delete a chat
export const deleteChat = async (req: CustomRequest, res: Response) => {

    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { chatId } = req.body;

        if (!checkId({id: chatId, res})) return;

        const userId = req.user._id;
    
        const chat = await Chat.findByIdAndDelete({ _id: chatId, userId });
        if (!chat) {
            return throwError({ message: "Chat not found!", res, status: 404 });
        }

        if (chat.userId.toString() !== req.user.id) {
            return throwError({ message: "Unauthorized to delete this chat.", res, status: 403 });
        }

        res.status(200).send({ message: 'Chat deleted successfully!', chat: chat});
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting chat!");
    }
};

//API to rename a chat
export const renameChat = async (req: CustomRequest, res: Response) => {

    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { chatId, title } = req.body;

        if (!checkId({id: chatId, res})) return;

        if (!title || title.trim() === "") {
            return throwError({ message: "Title is required.", res, status: 400 });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return throwError({ message: "Chat not found.", res, status: 404 });
        }

        if (chat.userId.toString() !== req.user.id) {
            return throwError({ message: "Unauthorized to rename this chat.", res, status: 403 });
        }

        // Update the chat title
        chat.title = title;
        await chat.save();

        res.status(200).json({ message: "Chat renamed successfully.", chat });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error renaming chat!");
    }
};