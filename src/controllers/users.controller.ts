import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import path from 'path';
import mongoose from 'mongoose';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';


// API to get all users
export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).send(users);
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
            res.status(200).send(user);
            return;
        }
        throwError({ message: "User not found", res, status: 404});
    }catch(error){
        throwError({ message: "Error retrieving user", res, status: 500});
    }
};

// API to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, email, password, birthday, gender, role, avatar, interests } = data;

        // verify all fields are filled
        if (!name || !email || !password || !birthday || !gender || !role || !avatar || !interests) {
            throwError({ message: "All required fields must be filled.", res, status: 400});
            return;
        }

        const existingUser = await User.findOne({
            name: name,
            email: email   
        });
        if (existingUser) {
            throwError({ message: "This username is already taken for this email.", res, status: 409});
            return;
        }

        if (!Array.isArray(interests)) {
            throwError({ message: "Interests must be an array.", res, status: 400 });
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

        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            throwError({ message: "Invalid birthday format.", res, status: 400 });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({...data, password: hashedPassword});

        res.status(201).send(user);
    }catch(error){
        if (error instanceof Error) {
            // Handle MongoDB duplicate key error (11000)
            if ((error as any).code === 11000) {
                throwError({ 
                    message: "A user with this name and email already exists.", 
                    res, 
                    status: 409 
                });
            } else {
                throwError({ message: error.message, res, status: 500 });
            }
        } else {
            throwError({ message: "An unknown error occurred.", res, status: 500 });
        }    
    } 
};

// API to edit user profile
export const editUserProfile = async(req: CustomRequest, res: Response):Promise<void> => {
    try{
        const {userProfileId, name, birthday, gender, avatar, role, email, interests} = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        if (userProfileId && req.user._id.toString() !== userProfileId && req.user.role !== "admin" && req.user.role !== "owner"  && req.user.role !== "parent") {
            throwError({ message: "Forbidden", res, status: 403 });
            return;
        }

        if ((role || email) && req.user.role !== "admin"&& req.user.role !== "owner"  && req.user.role !== "parent") {
            throwError({ message: "Forbidden: You cannot change role nor email", res, status: 403 });
            return;
        }

        let user;

        if(userProfileId)
            user = await User.findById(userProfileId);
        else
            user = req.user;

        if (!user){
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (name) user.name = name;
        if (birthday) user.birthday = birthday;
        if (gender) user.gender = gender;
        if (avatar) user.avatar = avatar;
        if (role) user.role = role; 
        if (email) user.email = email; 
        if (interests) user.interests = interests;

        await user.save();

        res.status(200).send({message: "User profile updated successfully", user});
    }catch(error){
        throwError({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
}

// API to delete user
export const deleteUser = async(req: CustomRequest, res:Response):Promise<void> => {
    try{
        const {userDeleteId} = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        if (userDeleteId && req.user._id.toString() !== userDeleteId && req.user.role !== "admin" && req.user.role !== "owner"  && req.user.role !== "parent") {
            throwError({ message: "Forbidden", res, status: 403 });
            return;
        }

        let deleted;

        if(userDeleteId)
            deleted = await User.findByIdAndDelete(userDeleteId);
        else
            deleted = await User.findByIdAndDelete(req.user._id);

        if (!deleted) {
            throwError({ message: "User not found", res, status: 404});
        }
      
        res.status(200).send({message: "User deleted successfully", deleted});
    }catch(error){
        throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
} 

// API to get user's stars
export const getUserStars = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({stars: req.user.stars});

    }catch(error){
        throwError({ message: "Error retrieving user stars", res, status: 500});
    }
} 

// API to update user's stars
export const updateUserStars = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { stars }: { stars: number } = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        if (stars === undefined || typeof stars !== "number"){
            throwError({ message: "Stars must be a valid number.", res, status: 400});
            return;
        }

        req.user.stars = stars;
        await req.user.save();

        res.status(200).send({ message: "User stars updated successfully", user: req.user });
    }catch(error){
        throwError({ message: "Error updating user stars", res, status: 500});
    }
} 

// API to get user's coins
export const getUserCoins = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({coins: req.user.coins});
    }catch(error){
        throwError({ message: "Error retrieving user coins", res, status: 500});
    }
} 

// API to update user's coins
export const updateUserCoins = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { coins }: { coins: number } = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        if (coins === undefined || typeof coins !== "number"){
            throwError({ message: "Stars must be a valid number.", res, status: 400});
            return;
        }

        req.user.coins = coins;
        await req.user.save();

        res.status(200).send({ message: "User coins updated successfully", user: req.user });
    }catch(error){
        throwError({ message: "Error updating user coins", res, status: 500});
    }
} 


// API to get user's location
export const getLocation = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({location: req.user.currentLocation});

    }catch(error){
        throwError({ message: "Error retrieving user location", res, status: 500});
    }
} 

// API to update user's current location
export const updateLocation = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { currentLocation }: { currentLocation: string } = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        if (typeof currentLocation !== "string" || currentLocation.trim() === ""){
            throwError({ message: "Location must be valid.", res, status: 400});
            return;
        }

        req.user.currentLocation = currentLocation;
        await req.user.save();

        res.status(200).send({ message: "User location updated successfully", user: req.user });
    }catch(error){
        throwError({ message: "Error updating user location", res, status: 500});
    }
} 

// API to get user's rank
export const getUserRank = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({Rank: req.user.rankInFamily});
    }catch(error){
        throwError({ message: "Error retrieving user rank", res, status: 500});
    }
};

// API to update user's rank
export const updateUserRank = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { rank }: { rank: number } = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        if (rank === undefined || typeof rank !== "number"){
            throwError({ message: "Rank must be a valid number.", res, status: 400});
            return;
        }

        req.user.rankInFamily = rank;
        await req.user.save();

        res.status(200).send({ message: "User rank updated successfully", user: req.user });
    }catch(error){
        throwError({ message: "Error updating user rank", res, status: 500});
    }
};