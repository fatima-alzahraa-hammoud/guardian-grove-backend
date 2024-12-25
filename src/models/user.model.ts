import { model, Schema } from "mongoose";
import { IUser } from "../interfaces/IUser";

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Email is invalid",
        ],
    },
    password: {
        type: String,
        required: true,
    },
    birthday:{
        type: Date,
        required: true,
    },
    gender:{
        type: String,
        enum: ['female', 'male'],
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'owner', 'parent', 'child', 'grandfather', 'grandmother', 'admin'],
        required: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    interests: {
        type: [String],
        required: true,
        default: [],
    },
    memberSince: {
        type: Date,
        required: true,
        default: Date.now,  
    },
    currentLocation:{
        type: String,
        required: true,
        default: "not specified",
    },
    stars: {
        type: Number,
        required: true,
        default: 0,
    },
    coins: {
        type: Number,
        required: true,
        default: 0,
    },
    rankInFamily: {
        type: Number,
        required: true,
        default: 0,
    },
});

userSchema.index({ name: 1, email: 1 }, { unique: true });

export const User = model<IUser>("User", userSchema);