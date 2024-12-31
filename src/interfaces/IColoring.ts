import { Document } from "mongoose";

export interface IColoring extends Document{
    title: string;
    imageUrl: string;
    createdAt: Date;
}
