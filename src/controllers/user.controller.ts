import { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { v2 as cloudinary } from 'cloudinary';
import { User } from "../models/user.model";
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { checkId } from '../utils/checkId';
import { Adventure } from '../models/adventure.model';
import { IAdventureProgress } from '../interfaces/IAdventureProgress';
import { Family } from '../models/family.model';
import { recalculateFamilyMemberRanks } from '../utils/recalculateFamilyMemberRanks';
import nodemailer from "nodemailer";
import { sendMail } from '../services/email.service';
import { generateSecurePassword } from '../utils/generateSecurePassword';
import { sanitizePublicId } from '../utils/sanitizePublicId';
import path from 'path';
import { deleteFromCloudinary, extractPublicIdFromUrl, uploadUserAvatar } from '../utils/cloudinary';

// API to get all users
export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try{
        const users = await User.find();
        res.status(200).send(users);
    }catch(error){
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

        let projection = '_id name email birthday role avatar gender stars coins interests nbOfTasksCompleted rankInFamily memberSince familyId dailyMessage isTempPassword';  // Basic user info

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
        return throwError({ message: "Error retrieving user", res, status: 500 });
    }
};

// API to create user
export const createUser = async (req: CustomRequest, res: Response): Promise<void> => {
    try{
        const data = req.body;

        const { name, birthday, gender, role, interests, avatarPath } = data; // Add avatarPath

        if (!req.user) {
            return  throwError({ message: "Unauthorized", res, status: 401 });
        }
        if(req.user.role === "child"){
            return throwError({ message: "Forbidden", res, status: 403 });
        }        

        // Get uploaded avatar file
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const avatarImage = files.avatar?.[0];

        // Parse interests FIRST, before validation
        let parsedInterests = interests;
        if (typeof interests === 'string') {
            try {
                parsedInterests = JSON.parse(interests);
            } catch (parseError) {
                return throwError({ message: "Invalid interests format.", res, status: 400 });
            }
        }

        // verify all fields are filled
        if (!name || !birthday || !gender || !role || !interests) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }
        
        // Check if avatar is provided (either file upload or predefined path)
        if (!avatarImage && !avatarPath) {
            return throwError({ message: "Avatar image is required.", res, status: 400});
        }

        const email = req.user.email;

        const existingUser = await User.findOne({
            name: name,
            email: email   
        });
        if (existingUser) {
            return throwError({ message: "This username is already taken for this email.", res, status: 409});
        }

        // Validate parsed interests is an array
        if (!Array.isArray(parsedInterests)) {
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

        const generatedPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);
        
        // Find the parent's family
        const family = await Family.findOne({ email: req.user.email });
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Handle avatar upload/selection
        let avatarUrl;
        
        if (avatarImage) {
            // Upload new avatar to Cloudinary using utility function
            try {
                const avatarResult = await uploadUserAvatar(avatarImage.buffer, avatarImage.originalname);
                avatarUrl = avatarResult.secure_url;
            } catch (uploadError) {
                return throwError({ message: "Failed to upload avatar image.", res, status: 500 });
            }
        } else if (avatarPath) {
            // Use predefined avatar path
            if (avatarPath.startsWith('/assets/images/avatars/')) {
                avatarUrl = avatarPath;
            } else {
                return throwError({ message: "Invalid avatar path. Only predefined avatars are allowed.", res, status: 400 });
            }
        }

        // Create the user with the parent's familyId
        const user = await User.create({
            ...data,
            avatar: avatarUrl,
            interests: parsedInterests,
            email: email,
            password: hashedPassword,
            isTempPassword: true,  // Mark as temporary password
            familyId: family._id  // Link to parent's family
        });

        // Recalculate the ranks after adding the new user
        await recalculateFamilyMemberRanks(family._id, user);

        const from: string = `"Guardian Grove" <${process.env.EMAIL_USERNAME}>`;
        const to: string = email;
        const subject = `Welcome to Guardian Grove - ${name}'s Account Details`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Welcome to Guardian Grove!</h2>
                    <p>Hello ${req.user.name},</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db;">
                        <p>You've successfully created a <strong>${role}</strong> account for <strong>${name}</strong>.</p>
                        <p>Here are the login details:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd; width: 120px;"><strong>Username:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;"><strong>Temporary Password:</strong></td>
                                <td style="padding: 8px;">${generatedPassword}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #e74c3c; font-weight: bold;">Please change this password after first login.</p>
                    
                    <p>If you didn't request this account creation, please contact our support immediately.</p>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Best regards,</p>
                        <p><strong>The Guardian Grove Team</strong></p>
                        <p style="font-size: 12px; color: #7f8c8d;">This is an automated message - please do not reply directly to this email.</p>
                    </div>
                </div>
            </div>
        `;

        // Send email with the temporary password
        await sendMail(from, to, subject, html);

        await user.save();
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
                return throwError({ message: error.message, res, status: 500 });
            }
        } else {
            return throwError({ message: "An unknown error occurred.", res, status: 500 });
        }    
    } 
};

// API to edit user profile
export const editUserProfile = async(req: CustomRequest, res: Response):Promise<void> => {
    try{
        const {userId, name, birthday, gender, role, avatarPath} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if ((role) && !['parent', 'admin'].includes(req.user.role)) {
            return throwError({ message: "Forbidden: You cannot change role nor email", res, status: 403 });
        }

        let user;

        if(userId){
            if(!checkId({id: userId, res})) return;
            if (req.user._id.toString() !== userId && !['parent', 'admin'].includes(req.user.role)) {
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
        }

        // Handle user avatar update
        let avatarUrl = user.avatar;
        const oldAvatarUrl = user.avatar;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const avatarImage = files?.avatar?.[0];

        // Check if there's a new file upload
        if (avatarImage) {
            try {
                // Upload new avatar to Cloudinary using utility function
                const avatarResult = await uploadUserAvatar(avatarImage.buffer, avatarImage.originalname);
                avatarUrl = avatarResult.secure_url;

                // Delete old avatar from Cloudinary if it exists and is not a predefined avatar
                if (oldAvatarUrl && !oldAvatarUrl.startsWith('/assets/')) {
                    const oldPublicId = extractPublicIdFromUrl(oldAvatarUrl);
                    if (oldPublicId) {
                        try {
                            await deleteFromCloudinary(oldPublicId);
                        } catch (deleteError) {
                            console.warn('Failed to delete old avatar:', deleteError);
                            // Continue execution even if deletion fails
                        }
                    }
                }
            } catch (uploadError) {
                return throwError({ message: "Failed to upload avatar image.", res, status: 500 });
            }
        } 
        // Check if there's a predefined avatar path in the request body
        else if (avatarPath && avatarPath !== user.avatar) {
            // This handles predefined avatars like '/assets/images/avatars/...'
            avatarUrl = avatarPath;

            // Delete old Cloudinary avatar if switching to predefined avatar
            if (oldAvatarUrl && !oldAvatarUrl.startsWith('/assets/')) {
                const oldPublicId = extractPublicIdFromUrl(oldAvatarUrl);
                if (oldPublicId) {
                    try {
                        await deleteFromCloudinary(oldPublicId);
                    } catch (deleteError) {
                        console.warn('Failed to delete old avatar:', deleteError);
                        // Continue execution even if deletion fails
                    }
                }
            }
        }

        // Update user fields
        if (name) user.name = name;
        if (birthday) user.birthday = birthday;
        if (gender) user.gender = gender;
        if (avatarImage || (avatarPath && avatarPath !== user.avatar)) {
            user.avatar = avatarUrl;
        }
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
            if (req.user._id.toString() !== userId && !['parent', 'admin'].includes(req.user.role)) {
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
        }

        // Delete avatar from Cloudinary if it's not a predefined avatar
        if (user.avatar && !user.avatar.startsWith('/assets/')) {
            const publicId = extractPublicIdFromUrl(user.avatar);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId);
                } catch (deleteError) {
                    console.warn('Failed to delete user avatar from Cloudinary:', deleteError);
                    // Continue with user deletion even if avatar deletion fails
                }
            }
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
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.isTempPassword = false;
        await user.save();

        // Return success response
        res.status(200).send({ message: "Password updated successfully.", password: newPassword });

    } catch (error) {
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
        
        // Check if adventure exists in user's profile
        let adventureProgress = user.adventures.find(
            (adventure) => adventure.adventureId.equals(adventureId)
        );

        // If adventure not found in user's profile, automatically start it
        if (!adventureProgress) {
            // Find the adventure by adventureId
            const adventure = await Adventure.findById(adventureId);
            if (!adventure) {
                return throwError({ message: "Adventure not found", res, status: 404 });
            }

            // Create new adventure progress
            const newAdventureProgress: IAdventureProgress = {
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

            user.adventures.push(newAdventureProgress);
            adventureProgress = newAdventureProgress;
        }

        const challenge = adventureProgress.challenges.find(
            (challenge) => challenge.challengeId.equals(challengeId)
        );
        if (!challenge) {
            return throwError({ message: "Challenge not found in adventure", res, status: 404 });
        }

        // Check if challenge is already completed
        if (challenge.isCompleted) {
            return throwError({ message: "Challenge already completed", res, status: 400 });
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

        res.status(200).json({ 
            message: "Challenge completed successfully", 
            adventureProgress,
            adventureAutoStarted: !user.adventures.find(adv => adv.adventureId.equals(adventureId)) // This will be true if we auto-started
        });

    } catch (error) {
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

export const saveFcmToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            return throwError({ message: "Missing userId or fcmToken", res, status: 400});
        }

        if(!checkId({id: userId, res})) return;

        // Add token to user's fcmTokens array if it doesn't exist
        await User.findByIdAndUpdate(userId, {
            $addToSet: { fcmTokens: fcmToken },  // $addToSet avoids duplicates
        });

        res.status(200).json({message: "FCM token saved successfully"});
    } catch (error) {
        return throwError({ message: "Internal server error", res, status: 500});
    }
};

// API to get all users with proper admin access
export const getAllUsers = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return throwError({ message: "Unauthorized - Admin access required", res, status: 401 });
        }

        const users = await User.find()
            .select('_id name email type role status achievements progress stars coins')
            .populate('familyId', 'familyName')
            .sort({ createdAt: -1 });

        if (!users || users.length === 0) {
            res.status(200).json({ message: "No users found", users: [] });
            return;
        }

        // Transform data to match your frontend interface
        const transformedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.role === 'child' ? 'child' : 'parent', // Map role to type
            role: user.role,
            status: user.status || 'active', // Default to active if not set
            achievements: user.achievements?.length || 0,
            progress: Math.round((user.stars / 1000) * 100), // Calculate progress based on stars
            stars: user.stars,
            coins: user.coins
        }));

        res.status(200).json({ 
            message: "Users retrieved successfully", 
            users: transformedUsers 
        });
    } catch (error) {
        return throwError({ message: "Error retrieving users", res, status: 500 });
    }
};

// API to ban/unban user (Admin only)
export const updateUserStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return throwError({ message: "Unauthorized - Admin access required", res, status: 401 });
        }

        const { userId, status } = req.body;

        if (!checkId({ id: userId, res })) return;

        if (!['active', 'banned'].includes(status)) {
            return throwError({ message: "Invalid status. Must be 'active' or 'banned'", res, status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        // Prevent admin from banning themselves
        if (user._id.toString() === req.user._id.toString()) {
            return throwError({ message: "Cannot change your own status", res, status: 400 });
        }

        user.status = status;
        await user.save();

        res.status(200).json({ 
            message: `User ${status === 'banned' ? 'banned' : 'activated'} successfully`, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                status: user.status
            }
        });
    } catch (error) {
        return throwError({ message: "Error updating user status", res, status: 500 });
    }
};

// API to update user role (Admin only)
export const updateUserRole = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return throwError({ message: "Unauthorized - Admin access required", res, status: 401 });
        }

        const { userId, role } = req.body;

        if (!checkId({ id: userId, res })) return;

        const validRoles = ['user', 'admin', 'parent', 'child'];
        if (!validRoles.includes(role)) {
            return throwError({ message: "Invalid role", res, status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        // Prevent admin from demoting themselves
        if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
            return throwError({ message: "Cannot change your own admin role", res, status: 400 });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ 
            message: "User role updated successfully", 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return throwError({ message: "Error updating user role", res, status: 500 });
    }
};

// API to create user by admin
export const createUserByAdmin = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return throwError({ message: "Unauthorized - Admin access required", res, status: 401 });
        }

        const { name, email, birthday, gender, role, interests, familyId, avatarPath } = req.body;

        // Validate required fields
        if (!name || !email || !birthday || !gender || !role) {
            return throwError({ message: "All required fields must be filled.", res, status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email, name });
        if (existingUser) {
            return throwError({ message: "User with this email and name already exists.", res, status: 409 });
        }

        // Validate family exists if familyId is provided
        let family = null;
        if (familyId) {
            if (!checkId({ id: familyId, res })) return;
            family = await Family.findById(familyId);
            if (!family) {
                return throwError({ message: "Family not found.", res, status: 404 });
            }
        }

        // Handle avatar upload/selection
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const avatarImage = files?.avatar?.[0];
        let avatarUrl;

        if (avatarImage) {
            try {
                const avatarResult = await uploadUserAvatar(avatarImage.buffer, avatarImage.originalname);
                avatarUrl = avatarResult.secure_url;
            } catch (uploadError) {
                return throwError({ message: "Failed to upload avatar image.", res, status: 500 });
            }
        } else if (avatarPath && avatarPath.startsWith('/assets/images/avatars/')) {
            avatarUrl = avatarPath;
        } else {
            return throwError({ message: "Avatar is required.", res, status: 400 });
        }

        // Generate secure password
        const generatedPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        // Parse interests if it's a string
        let parsedInterests = interests;
        if (typeof interests === 'string') {
            try {
                parsedInterests = JSON.parse(interests);
            } catch (parseError) {
                return throwError({ message: "Invalid interests format.", res, status: 400 });
            }
        }

        // Create user
        const user = await User.create({
            name,
            email,
            birthday,
            gender,
            role,
            interests: parsedInterests || [],
            avatar: avatarUrl,
            password: hashedPassword,
            isTempPassword: true,
            familyId: family?._id,
            status: 'active'
        });

        // Send email with credentials
        const from = `"Guardian Grove" <${process.env.EMAIL_USERNAME}>`;
        const subject = `Welcome to Guardian Grove - Your Account Details`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Welcome to Guardian Grove!</h2>
                    <p>Hello ${name},</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db;">
                        <p>An administrator has created an account for you.</p>
                        <p>Here are your login details:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd; width: 120px;"><strong>Email:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Username:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;"><strong>Temporary Password:</strong></td>
                                <td style="padding: 8px;">${generatedPassword}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #e74c3c; font-weight: bold;">Please change this password after first login.</p>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Best regards,</p>
                        <p><strong>The Guardian Grove Team</strong></p>
                    </div>
                </div>
            </div>
        `;

        try {
            await sendMail(from, email, subject, html);
        } catch (emailError) {
            // Don't fail user creation if email fails
        }

        res.status(201).json({ 
            message: "User created successfully by admin", 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status || 'active'
            }
        });

    } catch (error) {
        if ((error as any).code === 11000) {
            return throwError({ 
                message: "A user with this email and name already exists.", 
                res, 
                status: 409 
            });
        }
        return throwError({ message: "Failed to create user", res, status: 500 });
    }
};