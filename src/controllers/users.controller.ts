import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import mongoose from 'mongoose';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { checkId } from '../utils/checkId';
import { Adventure } from '../models/adventure.model';
import { IAdventureProgress } from '../interfaces/IAdventureProgress';

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
export const getUserById = async (req: CustomRequest, res: Response): Promise<void> => {
    try{

        // if there is id in the body so it is trying to get its data, while if no he need his data
        const {id} = req.body;

        if(!checkId({id: id, res})) return;
        

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        if (id && req.user._id.toString() !== id && req.user.role !== "admin" && req.user.role !== "owner"  && req.user.role !== "parent") {
            throwError({ message: "Forbidden", res, status: 403 });
            return;
        }

        let user;
        if (id)
            user = await User.findById(id);
        else 
            user = req.user;

        if (!user){
            throwError({ message: "User not found", res, status: 404});
            return;
        }

        if (id && (req.user.role === "parent" || req.user.role === "owner") && user.email !== req.user.email){
            throwError({ message: "Forbidden", res, status: 403 });
            return;
        }
        res.status(200).send(user);
    }catch(error){
        throwError({ message: "Error retrieving user", res, status: 500});
    }
};

// API to create user
export const createUser = async (req: CustomRequest, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, password, birthday, gender, role, avatar, interests } = data;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        // verify all fields are filled
        if (!name || !password || !birthday || !gender || !role || !avatar || !interests) {
            throwError({ message: "All required fields must be filled.", res, status: 400});
            return;
        }

        const email = req.user.email;

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

        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            throwError({ message: "Gender must be either 'male' or 'female'.", res, status: 400});
            return;
        }

        // Role validation
        const validRoles = ['user', 'parent', 'child', 'grandfather', 'grandmother', 'admin'];
        if (!validRoles.includes(role)) {
            throwError({ message: "Invalid role.", res, status: 400});
            return;
        }

        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            throwError({ message: "Invalid birthday format.", res, status: 400 });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            throwError({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({...data, email:email , password: hashedPassword});

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

        if (userProfileId && (req.user.role === "parent" || req.user.role === "owner") && user.email !== req.user.email){
            throwError({ message: "Forbidden", res, status: 403 });
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
            return;
        }

        if (userDeleteId && (req.user.role === "parent" || req.user.role === "owner") && deleted.email !== req.user.email){
            throwError({ message: "Forbidden", res, status: 403 });
            return;
        }
      
        res.status(200).send({message: "User deleted successfully", deleted});
    }catch(error){
        throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
} 

// API to update password
export const updatePassword = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        // Validate required fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            throwError({ message: "All fields are required.", res, status: 400 });
            return;
        }

        if (newPassword !== confirmPassword) {
            throwError({ message: "Passwords do not match.", res, status: 400 });
            return;
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, req.user.password);
        if (!isMatch) {
            throwError({ message: "Old password is incorrect.", res, status: 400 });
            return;
        }

        // Check if the new password is different from the old one
        const isSamePassword = await bcrypt.compare(newPassword, req.user.password);
        if (isSamePassword) {
            throwError({ message: "New password cannot be the same as the old password.", res, status: 400 });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            throwError({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
            return;
        }


        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        req.user.password = hashedPassword;
        await req.user.save();

        // Return success response
        res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error("Error updating password: ", error);
        throwError({ message: "Failed to update password.", res, status: 500 });
    }
};

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

// API to get user's interesets
export const getUserInterests = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({Interests: req.user.interests});
    }catch(error){
        throwError({ message: "Error retrieving user interests", res, status: 500});
    }
};

// API to start an adventure
export const startAdventure = async (req: CustomRequest, res: Response) => {
    try {
        const {adventureId} = req.body;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const userId = req.user._id;

        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: userId, res})) return;

        // Find the adventure by adventureId
        const adventure = await Adventure.findById(adventureId);
        if (!adventure) {
            return throwError({ message: "Adventure not found", res, status: 404 });
        }

        const existingAdventureProgress = req.user.adventures.find(
            (adventureProgress) => adventureProgress.adventureId.toString() === adventureId
        );
        if (existingAdventureProgress) {
            return throwError({ message: "Adventure already started", res, status: 400 });
        }


        // Add adventure to user's adventures
        const newAdventureProgress : IAdventureProgress = {
            adventureId: adventureId,
            challenges: adventure.challenges.map((challenge) => ({
                challengeId: challenge._id,
                isCompleted: false,  
            })),
            status: "in-progress",
            isAdventureCompleted: false,
            progress: 0,
        };

        req.user.adventures.push(newAdventureProgress);
        await req.user.save();

        res.status(200).json({ message: "Adventure started successfully", user: req.user });

    } catch (error) {
        return throwError({ message: "An unknown error occurred while starting the adventure.", res, status: 500 });
    }
};

// API to complete a challenge
export const completeChallenge = async (req: CustomRequest, res: Response) => {
    try {
        const { adventureId, challengeId } = req.body;

        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: challengeId, res})) return;

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;

        // Find the user's adventure
        const adventureProgress = user.adventures.find(adventure => adventure.adventureId.toString() === adventureId);
        if (!adventureProgress) {
            return throwError({ message: "Adventure not found in user's profile", res, status: 404 });
        }

        // Find the challenge within the adventure
        const challenge = adventureProgress.challenges.find(challenge => challenge.challengeId.toString() === challengeId);
        if (!challenge) {
            return throwError({ message: "Challenge not found in adventure", res, status: 404 });
        }

        // Mark the challenge as completed
        challenge.isCompleted = true;
        challenge.completedAt = new Date();

        // Calculate progress 
        adventureProgress.progress = (adventureProgress.challenges.filter(challenge => challenge.isCompleted).length / adventureProgress.challenges.length) * 100;

        // Check if all challenges are completed and mark the adventure as completed
        if (adventureProgress.challenges.every(challenge => challenge.isCompleted)) {
            adventureProgress.isAdventureCompleted = true;
            adventureProgress.status = 'completed';
        }

        // Save the user's updated adventure progress
        await user.save();

        res.status(200).json({ message: "Challenge completed successfully", adventureProgress });

    } catch (error) {
        return throwError({ message: "An unknown error occurred while completing the challenge.", res, status: 500 });
    }
}

// API to get user's adventures
export const getUserAdventures = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401});
            return;
        }

        res.status(200).send({Rank: req.user.adventures});
    }catch(error){
        throwError({ message: "Error retrieving user adventures", res, status: 500});
    }
};