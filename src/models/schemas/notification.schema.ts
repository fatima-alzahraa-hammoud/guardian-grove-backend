import { Schema } from "mongoose";
import { INotification } from "../../interfaces/INotification";

export const notificationSchema: Schema = new Schema<INotification>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: {type: String, required: true},
    type: { type: String, required: true, enum: ['personal', 'family'] },
    category: { type: String, required: true, enum: ['tip', 'alert', 'suggestion', 'notification'] },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    isReadBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
});  