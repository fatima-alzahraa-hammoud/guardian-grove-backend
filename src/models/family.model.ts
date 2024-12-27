import { Schema, model, Types } from "mongoose";
import { IFamily } from "../interfaces/IFamily";
import { User } from "./user.model";

const familySchema = new Schema<IFamily>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    familyName: { type: String, required: true, unique: true },
    members: [
        {
            _id: { type: Types.ObjectId, ref: "User", required: true },
            name: { type: String, required: true },
            role: { type: String, required: true, enum: ['parent', 'grandparent', 'admin', 'child'] },
        },
    ],

    email: { type: String, required:true, unique: true},
    createdAt: {type: Date, required: true},
});

// Virtual for calculating total stars
familySchema.virtual("totalStars").get(async function () {
    const members = await User.find({ _id: { $in: this.members } });
    return members.reduce((sum, user) => sum + (user.stars || 0), 0);
});

// Ensure virtuals are included in JSON response
familySchema.set("toJSON", { virtuals: true });
familySchema.set("toObject", { virtuals: true });


export const Family = model<IFamily>("Family", familySchema);
