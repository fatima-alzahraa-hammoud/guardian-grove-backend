export interface IUser {
    _id: string;
    name: string;
    email: string;
    password: string;
    birthday: Date;
    gender: string;
    role: string;
    avatar: string; 
    interests: string[];
    memberSince: Date;
    currentLocation?: string;
    stars: number;
    coins: number;
    rankInFamily: number;
}