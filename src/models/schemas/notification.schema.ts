import { Schema } from "mongoose";
import { INotification } from "../../interfaces/INotification";

export const notificationSchema: Schema = new Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    isReadBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});