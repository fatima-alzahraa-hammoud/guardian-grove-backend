import { Document } from "mongoose";

export interface IStore extends Document {
    name: string;
    description: string;
    price: number;
    image: string;
    type: string;
}