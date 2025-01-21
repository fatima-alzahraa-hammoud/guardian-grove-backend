import { Types } from "mongoose";
import { Chat } from "../../models/chat.model";

export const getLastChatMessages = async (userId: string) => {
  try {
    const lastChats = await Chat.find({ userId }).sort({ updatedAt: -1 }).limit(3)

    // Step 2: Retrieve the last 6 messages for each chat
    const chatMessages = await Promise.all(
        lastChats.map(async (chat) => {
            const messages = chat.messages.slice(-6);  
            return { chatId: chat._id, messages };
        })
    );

    return chatMessages;
  } catch (error) {
        console.error('Error retrieving last chat messages:', error);
        throw new Error('Failed to retrieve last chat messages');
  }
};

export const getLastFourChats = async (userId: string) => {
  try {

    const lastChats = await Chat.find({ userId }).sort({ updatedAt: -1 }).limit(4);

    const lastChatMessages = lastChats.map(chat => chat.messages).flat();

    return lastChatMessages;
  } catch (error) {
    console.error('Error retrieving last chat messages:', error);
    throw new Error('Failed to retrieve last chat messages');
  }
};

