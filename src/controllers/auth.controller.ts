import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { createUser } from "./users.controller";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Family } from "../models/family.model";
import { Types } from "mongoose";

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

        res.status(200).send({user: user, token: token});
    }catch(error){
        return throwError({ message: "Something went wrong while logging in.", res, status: 500});
    }
}

// register
export const register = async (req: Request, res: Response) : Promise<void> => {
    try{
        const data = req.body;
        const { name, email, password, confirmPassword, birthday, gender, role, avatar, interests, familyName, familyAvatar } = data;
        
        // verify all fields are filled
        if (!name || !email || !password || !confirmPassword || !birthday || !gender || !role || !avatar || !interests || !familyName || !familyAvatar) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
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
        
        if (!Array.isArray(interests)) {
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

        const hashedPassword = await bcrypt.hash(password, 10);


         // Family Assignment
         let family = await Family.findOne({ email });

         if (!family) {
            family = new Family({
                familyName: familyName,
                email,
                familyAvatar: familyAvatar,
                members: [],
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
        const newUser = await User.create({...data, password: hashedPassword, familyId: family._id}); 

        // Add user to the family members list if not already present
        if (!family.members.includes(newUser.id)) {
            family.members.push({_id: newUser.id, role, name});
            await family.save();
        }


        if (!JWT_SECRET_KEY) {
            return throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        }

        const token = await jwt.sign({ userId: newUser.id, role: newUser.role  }, JWT_SECRET_KEY);

        res.status(200).send({user: newUser, token: token});

    }catch(error){
        console.error(error); 
        return throwError({ message: "Something went wrong while registering.", res, status: 500});
    }
}  