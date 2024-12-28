import { Document, Types } from "mongoose";
import { IMessage } from "./IMessage";

export interface IChat extends Document{
    userId: Types.ObjectId;
    messages: IMessage[];
    createdAt?: Date; 
    updatedAt?: Date;
  }