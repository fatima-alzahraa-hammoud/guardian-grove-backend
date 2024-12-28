import { Request, Response } from "express";
import { Chat } from "../models/chat.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";
import { IMessage } from "../interfaces/IMessage";

//API to send messages and save (and create new chat if no chat exists)
export const sendMessage = async (req: CustomRequest, res: Response) => {

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
};