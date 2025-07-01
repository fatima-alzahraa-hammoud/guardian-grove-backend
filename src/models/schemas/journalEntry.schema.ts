import { Schema } from "mongoose";
import { JournalEntry } from "../../interfaces/IJournalEntry";

export const journalEntrySchema = new Schema<JournalEntry>({
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Can be text or file URL
    thumbnail: { type: String }, // For media entries
    date: { type: Date, default: Date.now },
    backgroundColor: { type: String, default: "#FFF2E5" },
    rotation: { type: Number, default: 0 }
}, { timestamps: true });