import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Family } from "../models/family.model";
import { generateSecurePassword } from "../utils/generateSecurePassword";
import { sendMail } from "../services/email.service";
import { uploadFamilyAvatar, uploadUserAvatar } from "../utils/cloudinary";

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET;


// login
export const login = async ( req: Request, res: Response) : Promise<void> => {

    try{
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            return throwError({ message: "Name, email, and password are required.", res, status: 400 });
        }
    
        const user = await User.findOne({
            name: name,
            email: email, 
        });

        if (!user) {
            return throwError({ message: "Invalid credentials. User not found.", res, status: 404 });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return throwError({ message: "Invalid password.", res, status: 401 });
        }

        if (!JWT_SECRET_KEY) {
            return throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        }

        const token = await jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY);

        res.status(200).json({
            user: user,
            token,
            requiresPasswordChange: user.isTempPassword || false,
            message: user.isTempPassword 
                ? 'Please set a new password' 
                : 'Login successful'
        });
    }catch(error){
        return throwError({ message: "Something went wrong while logging in.", res, status: 500});
    }
}

// register
export const register = async (req: Request, res: Response) : Promise<void> => {
    try{
        const data = req.body;
        const { name, email, password, confirmPassword, birthday, gender, role, avatarPath, interests, familyName, familyAvatarPath } = data;
        
        // Get uploaded files
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const avatarImage = files?.avatar?.[0];
        const familyAvatarImage = files?.familyAvatar?.[0];

        // Parse interests if it's a string
        let parsedInterests = interests;
        if (typeof interests === 'string') {
            try {
                parsedInterests = JSON.parse(interests);
            } catch (parseError) {
                return throwError({ message: "Invalid interests format.", res, status: 400 });
            }
        }
        
        // verify all fields are filled
        if (!name || !email || !password || !confirmPassword || !birthday || !gender || !role || !parsedInterests || !familyName) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        // Check is avatar is provided (either file or path)
        if (!avatarImage && !avatarPath) {
            return throwError({ message: "Avatar is required.", res, status: 400});
        }

        // Check if family avatar is provided (either file or path)
        if (!familyAvatarImage && !familyAvatarPath) {
            return throwError({ message: "Family avatar is required.", res, status: 400});
        }

        if (password !== confirmPassword){
            return throwError({ message: "Passwords do not match", res, status: 400 });
        }

        // Email Validation
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return throwError({ message: "Invalid email format.", res, status: 400});
        }

        // Role validation
        const validRoles = ['parent', 'admin'];
        if (!validRoles.includes(role)) {
            if (role === "child"){
                return throwError({ message: "Children must be added by a parent.", res, status: 400});
            }
            return throwError({ message: "Invalid role.", res, status: 400});
        }
        
        if (!Array.isArray(parsedInterests)) {
            return throwError({ message: "Interests must be an array.", res, status: 400 });
        }

        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            return throwError({ message: "Gender must be either 'male' or 'female'.", res, status: 400});
        }

        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            return throwError({ message: "Invalid birthday format.", res, status: 400 });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return throwError({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Upload user avatar to Cloudinary
        let userAvatarUrl;
        if (avatarImage) {
            try {
                const avatarResult = await uploadUserAvatar(avatarImage.buffer, avatarImage.originalname);
                userAvatarUrl = avatarResult.secure_url;
            } catch (uploadError) {
                return throwError({ message: "Failed to upload user avatar image.", res, status: 500 });
            }
        }else if (avatarPath) {
            // Use predefined family avatar path
            if (avatarPath.startsWith('/assets/images/avatars/')) {
                userAvatarUrl = avatarPath;
            } else {
                return throwError({ message: "Invalid avatar path. Only predefined avatars are allowed.", res, status: 400 });
            }
        }

        // Handle family avatar upload
        let familyAvatarUrl;
        if (familyAvatarImage) {
            try {
                const familyAvatarResult = await uploadFamilyAvatar(familyAvatarImage.buffer, familyAvatarImage.originalname);
                familyAvatarUrl = familyAvatarResult.secure_url;
            } catch (uploadError) {
                return throwError({ message: "Failed to upload family avatar image.", res, status: 500 });
            }
        } else if (familyAvatarPath) {
            // Use predefined family avatar path
            if (familyAvatarPath.startsWith('/assets/images/avatars/')) {
                familyAvatarUrl = familyAvatarPath;
            } else {
                return throwError({ message: "Invalid family avatar path. Only predefined avatars are allowed.", res, status: 400 });
            }
        }

        // Family Assignment
        let family = await Family.findOne({ email });

        if (!family) {
            family = new Family({
                familyName: familyName,
                email,
                familyAvatar: familyAvatarUrl,
                createdAt: new Date()
            });
            await family.save();
        }
        else{
            if (family.familyName !== familyName){
                return throwError({ message: "Wrong family name", res, status: 400 })
            }
        }

        // Check if a family member with the same name already exists
        const existingFamilyMember = await User.findOne({ name, familyId: family._id });
        if (existingFamilyMember) {
            return throwError({ message: "A member with this name already exists in the family.", res, status: 400 });
        }

        // Create the user and link to family
        const newUser = await User.create({
            ...data, 
            password: hashedPassword, 
            familyId: family._id,
            avatar: userAvatarUrl,
            interests: parsedInterests
        }); 

        if (!JWT_SECRET_KEY) {
            return throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        }

        const token = await jwt.sign({ userId: newUser.id, role: newUser.role  }, JWT_SECRET_KEY);

        res.status(200).send({user: newUser, token: token, family: family});

    }catch(error){
        return throwError({ message: "Something went wrong while registering.", res, status: 500});
    }
}

// forget password API
export const forgetPassword = async (req: Request, res: Response) : Promise<void> => {
    try {
        const { name, email } = req.body;
        const user = await User.findOne({ email, name });

        if (!user) {
            return throwError({ message: "Invalid credentials. User not found.", res, status: 404 });
        }

        const tempPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        user.password = hashedPassword;
        user.isTempPassword = true;
        user.passwordChangedAt = new Date();
        await user.save();


        const from: string = `"Guardian Grove" <${process.env.EMAIL_USERNAME}>`;
        const to: string = email;
        const subject: string = "Your Temporary Password";

        const html: string = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Hello ${user.name},</h2>
                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                <p>This password will expire in 1 hour.</p>
                <p>Please use this to login and change your password immediately.</p>
                <br/>
                <p>Thank you,</p>
                <p><strong>Guardian Grove Team</strong></p>
            </div>
        `

        // Send email with the temporary password
        await sendMail(from, to, subject, html);

        res.status(200).send({ message: "Temporary password sent to your email." });

    } catch (error) {
        return throwError({ message: "Error sending temporary password.", res, status: 500});
    }
}