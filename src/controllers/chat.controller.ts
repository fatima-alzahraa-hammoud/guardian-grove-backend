import { Request, response, Response } from "express";
import { Chat } from "../models/chat.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";
import { IMessage } from "../interfaces/IMessage";

//API to send messages and save (and create new chat if no chat exists)
/*export const sendMessage = async (req: CustomRequest, res: Response) => {

    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
    
        const { chatId, sender, message, image, title } = req.body;
    
        if (!sender || (!image && !message)) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        let chat;
    
        if(chatId){ 
            if (!checkId({id: chatId, res})) return;
            chat = await Chat.findOne({ _id: chatId });
        }
            
        // If no id exists, create a new one with the provided title
        if (!chatId || !chat) {
            
            if (!title) {
                return throwError({ message: "Title is required when creating a new chat", res, status: 400 });
            }
    
            // Create a new chat with a unique chatId and the provided title
            chat = new Chat({
                userId: req.user._id,
                title,
                messages: [{ sender, message, image, timestamp: new Date() }],
            });
    
            await chat.save();
            res.status(201).send({ message: 'Chat started and message sent', chat });
            return;
        }    
    
        // If chat exists, add the new message to the existing chat
        chat.messages.push({ sender, message, image, timestamp: new Date() } as IMessage);
        await chat.save();
    
        res.status(200).send({ message: 'Message sent', chat });
    
    }catch(error){
        return throwError({ message: "Error occured while sending message or creating chat", res, status: 500 });
    }
};*/

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
export const getUserChats = async (req: CustomRequest, res: Response) => {
    try {
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;

        const chats = await Chat.find({ userId }).select("title createdAt updatedAt");

        res.status(200).send({ message: 'Chats retrieved successfully', chats: chats });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching chats!");
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
