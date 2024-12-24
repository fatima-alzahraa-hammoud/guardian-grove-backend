import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";

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