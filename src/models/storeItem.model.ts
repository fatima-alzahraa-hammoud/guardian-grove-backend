import { model, Schema } from "mongoose";
import { IStore } from "../interfaces/IStore";

const storeSchema = new Schema<IStore>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true},
    price: { type: Number, required: true },
    image: { type: String, required: true },
});
  
export const StoreItem = model<IStore>("StoreItem", storeSchema);
  