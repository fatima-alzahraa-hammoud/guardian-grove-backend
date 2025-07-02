import { Schema } from "mongoose";
import { IBondingEvent } from "../../interfaces/IBondingFamilyEvents";

export const bondingEventSchema = new Schema<IBondingEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });