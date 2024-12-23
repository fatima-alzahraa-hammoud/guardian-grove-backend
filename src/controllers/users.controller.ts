import { Request, Response } from 'express';
import { User } from "../models/user.model";

export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    }catch(error){
        res.status(500).json({ message: "Error retrieving users", error });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const user = await User.findById({id});
        if (user){
            res.status(200).json(user);
        }
        res.status(404).json({ message: 'User not found' });
    }catch(error){
        res.status(500).json({message: "Error retrieving user", error});
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try{
        const data = req.body;
        const user = await User.create({...data});

        res.status(201).json(user);
    }catch(error){
        res.status(500).json({message: "An error occurred while adding the user.", error});
    }
}