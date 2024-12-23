import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import path from 'path';

// API to get all users
export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    }catch(error){
        res.status(500).json({ message: "Error retrieving users", error });
    }
};

// API to get a user based on his Id
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

// API to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, email, password, birthday, gender, role, avatar } = data;

        // verify all fields are filled
        if (!name || !email || !password || !birthday || !gender || !role || !avatar) {
            res.status(400).json({ message: "All required fields must be filled." });
            return;
        }

        // Email Validation
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ message: "Invalid email format." });
            return;
        }

        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            res.status(400).json({ message: "Gender must be either 'male' or 'female'." });
            return;
        }

        // Role validation
        const validRoles = ['user', 'father', 'mother', 'child', 'grandfather', 'grandmother', 'admin'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ message: "Invalid role." });
            return;
        }

        // Check for duplicate username with the same email
        const existingUser = await User.findOne({
            name: name,                  // Match by name
            email: email.toLowerCase()   // Match by email (case-insensitive)
        });

        if (existingUser) {
            res.status(409).json({ message: "This username is already taken for this email." });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10); // A salt of 10 rounds is reasonable

        const user = await User.create({...data, password: hashedPassword});

        res.status(201).json(user);
    }catch(error){
        res.status(500).json({message: "An error occurred while adding the user.", error});
    }
};

// API to get user's star

export const getUserStars = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const user = await User.findById({id});
        if (user){
            res.status(200).json({stars: user.stars});
        }
        res.status(404).json({ message: 'User not found' });
        return;
    }catch(error){
        res.status(500).json({message: "Error retrieving user", error});
    }
} 