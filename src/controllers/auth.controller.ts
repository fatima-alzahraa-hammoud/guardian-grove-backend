import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { createUser } from "./users.controller";

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

        res.status(200).send(user);
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

        const user = await User.findOne({
            email: email, 
        });

        if(user){
            throwError({ message: "Family with this email exists", res, status: 400 });
            return;
        }
        
        const newUser = await createUser(req, res);

    }catch(error){
        throwError({ message: "Something went wrong while registering.", res, status: 500});
    }
}  