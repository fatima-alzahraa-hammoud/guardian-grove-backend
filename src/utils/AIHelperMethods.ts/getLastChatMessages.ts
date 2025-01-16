import { Types } from "mongoose";
import { Chat } from "../../models/chat.model";

export const getLastChatMessages = async (userId: Types.ObjectId) => {
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
