import { Document } from "mongoose";
import { IChallenge } from "./IChallenge";

export interface IAdventure extends Document{
    _id: string;
    title: string;
    description: string;
    starsReward: number;
    coinsReward: number;
    iscompleted: boolean;
    startDate : Date;
    endDate : Date;
    challenges: IChallenge[];
    status: string;
}