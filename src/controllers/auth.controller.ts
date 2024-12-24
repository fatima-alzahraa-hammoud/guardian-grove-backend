import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { createUser } from "./users.controller";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET;


// login
export const login = async ( req: Request, res: Response) : Promise<void> => {

    try{
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            throwError({ message: "Name, email, and password are required.", res, status: 400 });
            return;
        }
    
        const user = await User.findOne({
            name: name,
            email: email, 
        });

        if (!user) {
            throwError({ message: "Invalid credentials. User not found.", res, status: 404 });
            return; 
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throwError({ message: "Invalid password.", res, status: 401 });
            return;
        }

        if (!JWT_SECRET_KEY) {
            throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
            return;
        }

        const token = await jwt.sign({ userId: user.id }, JWT_SECRET_KEY);

        res.status(200).send({user, token});
    }catch(error){
        throwError({ message: "Something went wrong while logging in.", res, status: 500});
    }
}

// register
export const register = async (req: Request, res: Response) : Promise<void> => {
    try{
        const data = req.body;
        const { name, email, password, birthday, gender, role, avatar, interests } = data;
        
        // verify all fields are filled
        if (!name || !email || !password || !birthday || !gender || !role || !avatar || !interests) {
            throwError({ message: "All required fields must be filled.", res, status: 400});
            return;
        }

        const existingUser = await User.findOne({
            email: email, 
        });

        if(existingUser){
            throwError({ message: "Family with this email exists", res, status: 400 });
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

        const newUser = await User.create({...data, password: hashedPassword});
        

        if (!JWT_SECRET_KEY) {
            throwError({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
            return;
        }

        const token = await jwt.sign({ userId: newUser.id }, JWT_SECRET_KEY);

        res.status(200).send({newUser, token});

    }catch(error){
        throwError({ message: "Something went wrong while registering.", res, status: 500});
    }
}  