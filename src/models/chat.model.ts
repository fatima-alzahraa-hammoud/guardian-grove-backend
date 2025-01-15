import { Schema, model, Types } from "mongoose";
import { IMessage } from "../interfaces/IMessage";
import { IChat } from "../interfaces/IChat";

const messageSchema = new Schema<IMessage>({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  message: { type: String },
  image: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new Schema<IChat>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

export const Chat = model<IChat>('Chat', chatSchema);
