import { Document, Types } from "mongoose";

export interface IPurchasedItem extends Document {
    itemId: Types.ObjectId; 
    purchasedAt: Date;
}
