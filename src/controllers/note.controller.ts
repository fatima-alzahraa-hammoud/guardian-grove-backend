import { Response } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { INote } from "../interfaces/INote";
import { User } from "../models/user.model";


//API to create note
export const createNote = async (req: CustomRequest, res: Response) => {
    try {

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        
        const { title, content, type } = req.body;

        if (!type || !content || !type) {
            return throwError({message: "All required fields must be filled", res, status: 400});
        }

        if(type !== "personal" && type !=="family"){
            return throwError({message: "Invalid type", res, status: 400});
        }
        
        const user = req.user;

        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const newNote = ({
            title,
            content,
            type,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
        });

        await User.findOneAndUpdate(
            { _id: user._id },
            { $push: { notes: newNote } },
            { new: true } 
        );

        await user.save();
        res.status(201).json({ message: "Note created", note: newNote });
    } catch (error) {
        return throwError({ message: "Error creating note", res, status: 500 });
    }
};

//API to get notes of the user/users
export const getNotes = async (req: Request, res: Response) => {
    try {
        const userId = req.body;
        if (userId) {
            const user = await User.findById(userId);

            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            return res.json(user.notes);
        }
        const users = await User.find();
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users in the database" });
        }

        const allNotes = users.map(user => ({
            userId: user._id,
            notes: user.notes
        }));


        res.status(200).json({message: "Retrieving notes successfully", notes: allNotes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving notes", error });
    }
};
