import { Document } from "mongoose";

export interface IChallnge extends Document{
    _id: string;
    title: string;
    content: string;
    starsReward: number;
    coinsReward: number;
    iscompleted: boolean;
}