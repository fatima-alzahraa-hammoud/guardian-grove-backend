import { Document, Types } from "mongoose";
import { IUser } from "./IUser";

export interface IFamily extends Document {
    _id: Types.ObjectId;
    familyName: string;
    members: Array<{
        _id: Types.ObjectId;
        name: string;
        role: string;
    }>;
    email: string;
    createdAt: Date;
}
