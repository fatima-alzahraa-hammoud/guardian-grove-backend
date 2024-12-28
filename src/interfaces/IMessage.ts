import { Document } from "mongoose";

export interface IMessage extends Document{
    sender: 'user' | 'bot';
    message: string;
    timestamp: Date;
  }