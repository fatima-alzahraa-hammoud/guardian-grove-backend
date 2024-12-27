import { Document, Types } from "mongoose";
import { IUser } from "./IUser";

export interface IFamily extends Document {
    _id: Types.ObjectId;
    familyName: string;
    members: Pick<IUser, "_id" | "name" | "role">[];
    email: string;
    createdAt: Date;
}
