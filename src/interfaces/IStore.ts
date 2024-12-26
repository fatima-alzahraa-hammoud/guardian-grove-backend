import { Document, Types } from "mongoose";

export interface IStore extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    type: string;
    price: number;
    image: string;
}