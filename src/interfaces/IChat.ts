import { Document, Types } from "mongoose";
import { IMessage } from "./IMessage";

export interface IChat extends Document{
    userId: Types.ObjectId;
    title: string;
    messages: IMessage[];
    createdAt?: Date; 
    updatedAt?: Date;
}