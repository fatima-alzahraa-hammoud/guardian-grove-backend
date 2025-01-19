import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { checkId } from '../utils/checkId';
import { Adventure } from '../models/adventure.model';
import { IAdventureProgress } from '../interfaces/IAdventureProgress';
import { Family } from '../models/family.model';
import { recalculateFamilyMemberRanks } from '../utils/recalculateFamilyMemberRanks';
import nodemailer from "nodemailer";

// API to get all users
export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).send(users);
    }catch(error){
        console.error("Error retrieving users:", error);
        return throwError({ message: "Error retrieving users", res, status: 500});
    }
};

// API to get a user based on his Id
export const getUserById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const targetUserId = userId || req.user._id;

        if (!checkId({ id: targetUserId, res })) return;

        let projection = '_id name email birthday role avatar gender stars coins interests nbOfTasksCompleted rankInFamily memberSince familyId dailyMessage';  // Basic user info

        // Fetch the user with specific fields
        const user = await User.findById(targetUserId).select(projection);

        // If user not found, return 404
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        if (req.user._id.toString() !== targetUserId.toString() && ['parent', 'child'].includes(req.user.role) && req.user.email != user.email){
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        res.status(200).json({ message: "Retrieving user successfully", user });
    } catch (error) {
        console.error("Error retrieving user:", error);
        return throwError({ message: "Error retrieving user", res, status: 500 });
    }
};

// API to create user
export const createUser = async (req: CustomRequest, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, birthday, gender, role, avatar, interests } = data;

        if (!req.user) {
            return  throwError({ message: "Unauthorized", res, status: 401 });
        }
        if(req.user.role === "child"){
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        // verify all fields are filled
        if (!name || !birthday || !gender || !role || !avatar || !interests) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const email = req.user.email;

        const existingUser = await User.findOne({
            name: name,
            email: email   
        });
        if (existingUser) {
            return throwError({ message: "This username is already taken for this email.", res, status: 409});
        }

        if (!Array.isArray(interests)) {
            return throwError({ message: "Interests must be an array.", res, status: 400 });
        }

        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            return throwError({ message: "Gender must be either 'male' or 'female'.", res, status: 400});
        }

        // Role validation
        const validRoles = ['owner', 'parent', 'child', 'admin'];
        if (!validRoles.includes(role)) {
            return throwError({ message: "Invalid role.", res, status: 400});
        }

        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            return throwError({ message: "Invalid birthday format.", res, status: 400 });
        }

        const generatedPassword = Math.random().toString(36).slice(-10); // Generate a 10-character password
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Find the parent's family
        const family = await Family.findOne({ email: req.user.email });
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Create the user with the parent's familyId
        const user = await User.create({
            ...data,
            email: email,
            password: hashedPassword,
            familyId: family._id  // Link to parent's family
        });

        // Add the new user to the family's members list
        if (!family.members.includes(user.id)) {
            family.members.push({_id: user.id, role, name, gender, avatar});
            await family.save();
        }

        // Recalculate the ranks after adding the new user
        await recalculateFamilyMemberRanks(family._id, user);

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: "Your Account Password",
            text: `Hello ${req.user.name},\n\nYour ${role} ${name} account has been created successfully. Here are their login details:\n\nUsername: ${name}\nPassword: ${generatedPassword}\n\nPlease change your password after logging in.\n\nThank you,\nYour App Team`,
        });

        await user.save();
        console.log(user)
        res.status(200).send({ message: "User created successfully, password email sent.", user });
    }catch(error){
        if (error instanceof Error) {
            // Handle MongoDB duplicate key error (11000)
            if ((error as any).code === 11000) {
                return throwError({ 
                    message: "A user with this name and email already exists.", 
                    res, 
                    status: 409 
                });
            } else {
                console.error("Error creating user:", error);
                return throwError({ message: error.message, res, status: 500 });
            }
        } else {
            console.error("Unknown error creating user:", error);
            return throwError({ message: "An unknown error occurred.", res, status: 500 });
        }    
    } 
};

// API to edit user profile
export const editUserProfile = async(req: CustomRequest, res: Response):Promise<void> => {
    try{
        const {userId, name, birthday, gender, avatar, role} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if ((role) && !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return throwError({ message: "Forbidden: You cannot change role nor email", res, status: 403 });
        }

        let user;

        if(userId){
            if(!checkId({id: userId, res})) return;
            if (req.user._id.toString() !== userId && !['parent', 'admin', 'owner'].includes(req.user.role)) {
                return throwError({ message: "Forbidden", res, status: 403 });
            }

            user = await User.findById(userId);

            if (!user){
                return throwError({ message: "User not found", res, status: 404});
            }

            if(req.user.role !== "admin" && req.user.email !== user.email){
                return throwError({ message: "Forbidden", res, status: 403 });
            }
        }
        else{
            user = req.user;
        }

        // Check if a user with the same email and name exists
        if (name) {
            const existingUser = await User.findOne({ email: user.email, name, _id: { $ne: user._id } });
            if (existingUser) {
                return throwError({ message: "A user with the same email and name already exists.", res, status: 400 });
            }
            user.name = name;
        }

        if (name) user.name = name;
        if (birthday) user.birthday = birthday;
        if (gender) user.gender = gender;
        if (avatar) user.avatar = avatar;
        if (role) user.role = role; 

        await user.save();

        res.status(200).send({message: "User profile updated successfully", user});
    }catch(error){
        return throwError({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
}

// API to delete user
export const deleteUser = async(req: CustomRequest, res:Response):Promise<void> => {
    try{
        const {userId} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        let user;
        if(userId){
            if(!checkId({id: userId, res})) return;
            if (req.user._id.toString() !== userId && !['parent', 'admin', 'owner'].includes(req.user.role)) {
                return throwError({ message: "Forbidden", res, status: 403 });
            }

            user = await User.findById(userId);

            if (!user){
                return throwError({ message: "User not found", res, status: 404});
            }

            if(req.user.role !== "admin" && req.user.email !== user.email){
                return throwError({ message: "Forbidden", res, status: 403 });
            }
        }
        else{
            user = req.user;
        }


        // Prevent deleting the last parent in a family
        const family = await Family.findById(user.familyId);
        if (family) {
            const parentsCount = await User.countDocuments({ familyId: family._id, role: 'parent' });
            if (user.role === 'parent' && parentsCount <= 1) {
                return throwError({ message: "Cannot delete the last parent in the family", res, status: 400 });
            }

            // Remove user from the family members list
            family.members = family.members.filter((member) => member._id.toString() !== user._id.toString());
            await family.save();
        }

        // Delete the user
        await User.findByIdAndDelete(user._id);
      
        res.status(200).send({message: "User deleted successfully", user});
    }catch(error){
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
} 

// API to update password
export const updatePassword = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {userId, oldPassword, newPassword, confirmPassword } = req.body;
        
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        let user;

        if(userId){
            if(!checkId({id: userId, res})) return;
            if (req.user._id.toString() !== userId && req.user.role !== "admin") {
                return throwError({ message: "Forbidden", res, status: 403 });
            }

            user = await User.findById(userId);

            if (!user){
                return throwError({ message: "User not found", res, status: 404});
            }
        }
        else{
            user = req.user;
        }

        // Validate required fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            return throwError({ message: "All fields are required.", res, status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return throwError({ message: "Passwords do not match.", res, status: 400 });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return throwError({ message: "Old password is incorrect.", res, status: 400 });
        }

        // Check if the new password is different from the old one
        const isSamePassword = await bcrypt.compare(newPassword, req.user.password);
        if (isSamePassword) {
            return throwError({ message: "New password cannot be the same as the old password.", res, status: 400 });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return throwError({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Return success response
        res.status(200).send({ message: "Password updated successfully.", password: newPassword });

    } catch (error) {
        console.error("Error updating password: ", error);
        return throwError({ message: "Failed to update password.", res, status: 500 });
    }
};

// API to get user's stars
export const getUserStars = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({message:"Stars retrieved successfully", stars: req.user.stars});

    }catch(error){
        return throwError({ message: "Error retrieving user stars", res, status: 500});
    }
} 

// API to update user's stars
export const updateUserStars = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { stars }: { stars: number } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        if (stars === undefined || typeof stars !== "number" || stars < 0){
            return throwError({ message: "Stars must be a valid number.", res, status: 400});
        }

        req.user.stars += stars;
        await req.user.save();

        if(!req.user.familyId){
            return throwError({ message: "No family id", res, status: 400});
        }
        await Family.findByIdAndUpdate(req.user.familyId, { $inc: { totalStars: stars } });
        
        await recalculateFamilyMemberRanks(req.user.familyId, req.user);

        res.status(200).send({ message: "User stars updated successfully", user: req.user });
    }catch(error){
        console.error('Error updating user stars:', error);
        return throwError({ message: "Error updating user stars", res, status: 500});
    }
} 

// API to get user's coins
export const getUserCoins = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({message:"Coins retrieved successfully", coins: req.user.coins});
    }catch(error){
        return throwError({ message: "Error retrieving user coins", res, status: 500});
    }
} 

// API to update user's coins
export const updateUserCoins = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { coins }: { coins: number } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        if (coins === undefined || typeof coins !== "number"){
            return throwError({ message: "Stars must be a valid number.", res, status: 400});
        }

        req.user.coins += coins;
        await req.user.save();

        res.status(200).send({ message: "User coins updated successfully", user: req.user });
    }catch(error){
        return throwError({ message: "Error updating user coins", res, status: 500});
    }
} 


// API to get user's location
export const getLocation = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({message:"Location retrieved successfully", location: req.user.currentLocation});

    }catch(error){
        return throwError({ message: "Error retrieving user location", res, status: 500});
    }
} 

// API to update user's current location
export const updateLocation = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { currentLocation }: { currentLocation: string } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        if (typeof currentLocation !== "string" || currentLocation.trim() === ""){
            return throwError({ message: "Location must be valid.", res, status: 400});
        }

        req.user.currentLocation = currentLocation;
        await req.user.save();

        res.status(200).send({ message: "User location updated successfully", user: req.user });
    }catch(error){
        return throwError({ message: "Error updating user location", res, status: 500});
    }
}  

// API to get user's rank
export const getUserRank = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({message:"Rank retrieved successfully", Rank: req.user.rankInFamily});
    }catch(error){
        return throwError({ message: "Error retrieving user rank", res, status: 500});
    }
};

// API to update user's rank
/*export const updateUserRank = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { rank }: { rank: number } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        if (rank === undefined || typeof rank !== "number"){
            return throwError({ message: "Rank must be a valid number.", res, status: 400});
        }

        req.user.rankInFamily = rank;
        await req.user.save();

        res.status(200).send({ message: "User rank updated successfully", user: req.user });
    }catch(error){
        return throwError({ message: "Error updating user rank", res, status: 500});
    }
};*/

// API to get user's interesets
export const getUserInterests = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({ message: "Interests retrieved successfully", Interests: req.user.interests});
    }catch(error){
        throwError({ message: "Error retrieving user interests", res, status: 500});
    }
};

// API to start an adventure
export const startAdventure = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {adventureId} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const userId = req.user._id;

        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: userId.toString(), res})) return;

        // Find the adventure by adventureId
        const adventure = await Adventure.findById(adventureId);
        if (!adventure) {
            return throwError({ message: "Adventure not found", res, status: 404 });
        }

        const existingAdventureProgress = req.user.adventures.find(
            (adventureProgress) => 
                adventureProgress.adventureId.equals(adventureId)
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
            starsReward: adventure.starsReward,
            coinsReward: adventure.coinsReward,
            progress: 0,
        };

        req.user.adventures.push(newAdventureProgress);
        await req.user.save();

        res.status(200).send({ message: "Adventure started successfully", user: req.user });

    } catch (error) {
        return throwError({ message: "An unknown error occurred while starting the adventure.", res, status: 500 });
    }
};

export const completeChallenge = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { adventureId, challengeId } = req.body;

        if (!checkId({ id: adventureId, res })) return;
        if (!checkId({ id: challengeId, res })) return;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        const adventureProgress = user.adventures.find(
            (adventure) => adventure.adventureId.equals(adventureId)
        );
        if (!adventureProgress) {
            return throwError({ message: "Adventure not found in user's profile", res, status: 404 });
        }

        const challenge = adventureProgress.challenges.find(
            (challenge) => challenge.challengeId.equals(challengeId)
        );
        if (!challenge) {
            return throwError({ message: "Challenge not found in adventure", res, status: 404 });
        }

        // Fetch the full adventure to get challenge rewards
        const adventure = await Adventure.findById(adventureId).lean();

        if (!adventure) {
            return throwError({ message: "Adventure not found", res, status: 404 });
        }

        const targetChallenge = adventure.challenges.find(ch =>
            ch._id.equals(challengeId)
        );

        if (!targetChallenge) {
            return throwError({ message: "Challenge data not found in adventure", res, status: 404 });
        }

        // Mark challenge as complete and add rewards
        challenge.isCompleted = true;
        challenge.completedAt = new Date();

        const starsReward = targetChallenge.starsReward;
        const coinsReward = targetChallenge.coinsReward;

        user.stars += starsReward;
        user.coins += coinsReward;

        adventureProgress.progress = (adventureProgress.challenges.filter(challenge => challenge.isCompleted).length / adventureProgress.challenges.length) * 100;

        let adventureStars = 0;
        if (adventureProgress.progress === 100) {
            adventureProgress.isAdventureCompleted = true;
            adventureProgress.status = 'completed';
            adventureStars = adventureProgress.starsReward;

            user.coins += adventureProgress.coinsReward;
            user.stars += adventureStars;
        }

        // Update the family total stars
        if (user.familyId) {
            const totalStars = starsReward + adventureStars;
            await Family.findByIdAndUpdate(user.familyId, {
                $inc: { totalStars: totalStars }
            });
            await recalculateFamilyMemberRanks(user.familyId, user);
        }

        await user.save();

        res.status(200).json({ message: "Challenge completed successfully", adventureProgress });

    } catch (error) {
        console.error("Error completing challenge:", error);
        return throwError({ message: "An unknown error occurred while completing the challenge.", res, status: 500 });
    }
};

// API to get user's adventures
export const getUserAdventures = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        res.status(200).send({ message: "User adventures retrieved successfully", Adventure: req.user.adventures});
    }catch(error){
        return throwError({ message: "Error retrieving user adventures", res, status: 500});
    }
};

//API to get user's purchased items
export const getUserPurchasedItems = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const targetUserId = userId || req.user._id;

        if (!checkId({ id: targetUserId, res })) return;

        const isAuthorized = req.user._id.toString() === targetUserId.toString();
        if (!isAuthorized) {
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        // Fetch only itemIds from purchasedItems
        const user = await User.findById(targetUserId).select('purchasedItems.itemId');

        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const purchasedItemIds = user.purchasedItems.map((item: any) => item.itemId);

        res.status(200).json({ message: "Purchased items retrieved successfully", purchasedItems: purchasedItemIds });
    } catch (error) {
        console.error("Error retrieving purchased items:", error);
        return throwError({ message: "Error retrieving purchased items", res, status: 500 });
    }
};

//API to get user's avatar
export const getUserAvatar = async (req: CustomRequest, res: Response) => {
    try {

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        const user = req.user;

        res.status(200).json({message: "Avatar retrieved successfully", avatar: user.avatar });
    } catch (error) {
        return throwError({ message: "Error fetching avatar", res, status: 500});
    }
};