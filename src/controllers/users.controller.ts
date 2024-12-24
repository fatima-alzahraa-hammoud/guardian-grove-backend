import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import path from 'path';
import mongoose from 'mongoose';
import { throwError } from '../utils/error';

// API to get all users
export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    }catch(error){
        throwError({ message: "Error retrieving users", res, status: 500});
    }
};

// API to get a user based on his Id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const user = await User.findById(id);
        if (user){
            res.status(200).json(user);
        }
        throwError({ message: "User not found", res, status: 404});
    }catch(error){
        throwError({ message: "Error retrieving users", res, status: 500});
    }
};

// API to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, email, password, birthday, gender, role, avatar } = data;

        // verify all fields are filled
        if (!name || !email || !password || !birthday || !gender || !role || !avatar) {
            throwError({ message: "All required fields must be filled.", res, status: 400});
            return;
        }

        // Email Validation
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throwError({ message: "Invalid email format.", res, status: 400});
            return;
        }

        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            throwError({ message: "Gender must be either 'male' or 'female'.", res, status: 400});
            return;
        }

        // Role validation
        const validRoles = ['user', 'father', 'mother', 'child', 'grandfather', 'grandmother', 'admin'];
        if (!validRoles.includes(role)) {
            throwError({ message: "Invalid role.", res, status: 400});
            return;
        }

        // Check for duplicate username with the same email
        const existingUser = await User.findOne({
            name: name,                  // Match by name
            email: email.toLowerCase()   // Match by email (case-insensitive)
        });

        if (existingUser) {
            throwError({ message: "This username is already taken for this email.", res, status: 409});
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10); // A salt of 10 rounds is reasonable

        const user = await User.create({...data, password: hashedPassword});

        res.status(201).json(user);
    }catch(error){
        throwError({ message: "An error occurred while adding the user.", res, status: 500});
    } 
};

// API to get user's stars
export const getUserStars = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (user){
            res.status(200).json({stars: user.stars});
        }
        throwError({ message: "User not found", res, status: 404});
        return;
    }catch(error){
        throwError({ message: "Error retrieving user stars", res, status: 500});
    }
} 

// API to update user's stars
export const updateUserStars = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const { stars }: { stars: number } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (!user){
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (stars === undefined || typeof stars !== "number"){
            throwError({ message: "Stars must be a valid number.", res, status: 400});
            return;
        }

        user.stars = stars;
        await user.save();

        res.status(200).json({ message: "User stars updated successfully", user });
    }catch(error){
        throwError({ message: "Error updating user stars", res, status: 500});
    }
} 

// API to get user's coins
export const getUserCoins = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (user){
            res.status(200).json({coins: user.coins});
        }
        throwError({ message: "User not found", res, status: 404});
        return;
    }catch(error){
        throwError({ message: "Error retrieving user coins", res, status: 500});
    }
} 

// API to update user's coins
export const updateUserCoins = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const { coins }: { coins: number } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (!user){
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (coins === undefined || typeof coins !== "number"){
            throwError({ message: "Coins must be a valid number.", res, status: 400});
            return;
        }

        user.coins = coins;
        await user.save();

        res.status(200).json({ message: "User Coins updated successfully", user });
    }catch(error){
        throwError({ message: "Error updating user coins", res, status: 500});
    }
} 


// API to get user's location
export const getLocation = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (user){
            res.status(200).json({location: user.currentLocation});
        }
        throwError({ message: "User not found", res, status: 404});
        return;
    }catch(error){
        throwError({ message: "Error retrieving user location", res, status: 500});
    }
} 

// API to update user's current location
export const updateLocation = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const { currentLocation }: { currentLocation: string } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (!user) {
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (typeof currentLocation !== "string" || currentLocation.trim() === ""){
            throwError({ message: "Location must be valid.", res, status: 400});
            return;
        }

        user.currentLocation = currentLocation;
        await user.save();

        res.status(200).json({ message: "User current location updated successfully", user });
    }catch(error){
        throwError({ message: "Error updating user location", res, status: 500});
    }
} 

// API to get user's rank
export const getUserRank = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (user){
            res.status(200).json({Rank: user.rankInFamily});
        }
        throwError({ message: "User not found", res, status: 404});
        return;
    }catch(error){
        throwError({ message: "Error retrieving user rank", res, status: 500});
    }
};

// API to update user's rank
export const updateUserRank = async(req:Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const { rank }: { rank: number } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throwError({ message: "Invalid user ID format", res, status: 400});
            return;
        }

        const user = await User.findById(id);
        if (!user){
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (rank === undefined || typeof rank !== "number"){
            throwError({ message: "Rank must be a valid number.", res, status: 400});
            return;
        }

        user.rankInFamily = rank;
        await user.save();

        res.status(200).json({ message: "User rank updated successfully", user });
    }catch(error){
        throwError({ message: "Error updating user rank", res, status: 500});
    }
};