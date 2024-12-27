import { Request, Response } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { INote } from "../interfaces/INote";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";


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

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $push: { notes: newNote } },
            { new: true } 
        );

        if (!updatedUser) {
            return throwError({ message: "Failed to update user notes.", res, status: 500 });
        }

        res.status(201).json({ message: "Note created", note: newNote });
    } catch (error) {
        return throwError({ message: "Error creating note", res, status: 500 });
    }
};

//API to get notes of the user/users
export const getNotes = async (req: CustomRequest, res: Response) => {
    try {
        const {userId} = req.body;
        
        if (userId) {
            if(!checkId({id: userId, res})) return;
            const user = await User.findById(userId);

            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            res.status(200).json({message: "Retrieving user notes successfully", notes: user.notes });
            return;
        }

        if(!req.user || req.user.role !== 'admin'){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const users = await User.find();
        if (!users || users.length === 0) {
            return throwError({ message: "No users in the database", res, status: 404 });
        }

        const allNotes = users.map(user => ({
            userId: user._id,
            notes: user.notes
        }));


        res.status(200).json({message: "Retrieving all users' notes successfully", notes: allNotes });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error retrieving notes", res, status: 500 });
    }
};

//API to update note
export const updateNote = async (req: Request, res: Response) => {
    try {

        const { userId, noteId, title, content, isPinned } = req.body;

        if(!checkId({id: userId, res})) return;
        if(!checkId({id: noteId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const note = user.notes.find(note => note._id.toString() === noteId);
        if (!note) {
            return throwError({ message: "Notes not found", res, status: 404 });
        }

        note.title = title || note.title;
        note.content = content || note.content;
        note.isPinned = isPinned || note.isPinned;
        note.updatedAt = new Date();

        await user.save();
        res.status(200).json({ message: "Note updated", note });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error updating notes", res, status: 500 });
    }
};

//API to delete note
export const deleteNote = async (req: Request, res: Response) => {
    try {
        const { userId, noteId } = req.body;

        if(!checkId({id: noteId, res})) return;
        if(!checkId({id: userId, res})) return;


        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const noteIndex = user.notes.findIndex(
            (note) => note._id.toString() === noteId
        );        
        if (noteIndex === -1) {
            return throwError({ message: "Note not found", res, status: 404 });
        }

        const [deletedNote] = user.notes.splice(noteIndex, 1);

        await user.save();

        res.status(200).json({ message: 'Note deleted successfully', DeletedNote: deletedNote });
    } catch (error) {
        console.error(error);
        return throwError({message: "Error deleting note", res, status: 500});
    }
};