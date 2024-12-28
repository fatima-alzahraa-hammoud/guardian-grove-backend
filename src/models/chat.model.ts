import { Schema, model, Types } from "mongoose";
import { IMessage } from "../interfaces/IMessage";

const messageSchema = new Schema<IMessage>({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

