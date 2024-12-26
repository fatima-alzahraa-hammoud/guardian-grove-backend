export interface IAchievement extends Document{
    _id: string;
    title: string;
    description: string;
    rewardStars?: number;
    rewardCoins?: number;
    criteria: string; 
    photo: string;
}
