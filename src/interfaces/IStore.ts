import { Document } from "mongoose";

export interface IStore extends Document {
    name: string;
    description: string;
    type: string;
    price: number;
    image: string;
}