import { Document } from "mongoose";
import { IUser } from "./IUser";

export interface IFamily extends Document {
    _id: string;
    familyName: string;
    members: Pick<IUser, "_id" | "name" | "role">[];
    email: string;
    totalStars: number;
    createdAt: Date;
}
