import { Request, Response } from 'express';
import { User } from "../models/user.model";

export const getUsers = async(req: Request, res: Response): Promise<Response> => {
    try{
        const users = await User.find();
        return res.status(200).json(users);
    }catch(error){
        return res.status(500).json({ message: 'Error retrieving users', error });
    }
}