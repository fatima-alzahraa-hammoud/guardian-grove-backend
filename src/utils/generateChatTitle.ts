import { IMessage } from "../interfaces/IMessage";

// Function to generate a small title from the last 3 messages
export const generateChatTitle = (messages: IMessage[]): string => {
    const lastMessages = messages.slice(-3).map(msg => msg.message);
    const title = lastMessages.join(" ").slice(0, 50);
    return title.length > 0 ? title : "New Chat";
};