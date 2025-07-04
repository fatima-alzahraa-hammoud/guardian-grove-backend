// Update src/controllers/note.controller.ts
import { Request, Response } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { INote } from "../interfaces/INote";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";

// Create Note
export const createNote = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        
        const { 
            title, 
            content, 
            type, 
            backgroundColor, 
            textColor, 
            fontSize, 
            isPinned, 
            isChecklist, 
            checklistItems 
        } = req.body;

        if (!content) {
            return throwError({message: "Content is required", res, status: 400});
        }

        const user = req.user;

        const newNote: Partial<INote> = {
            title: title || "",
            content,
            type: type || "personal",
            backgroundColor: backgroundColor || "#FFF9C4",
            textColor: textColor || "#000000",
            fontSize: fontSize || 14,
            isPinned: isPinned || false,
            isChecklist: isChecklist || false,
            checklistItems: checklistItems || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $push: { notes: newNote } },
            { new: true } 
        );

        if (!updatedUser) {
            return throwError({ message: "Failed to update user notes.", res, status: 500 });
        }

        const createdNote = updatedUser.notes[updatedUser.notes.length - 1];
        res.status(201).json({ message: "Note created", note: createdNote });
    } catch (error) {
        return throwError({ message: "Error creating note", res, status: 500 });
    }
};

// Get Notes
export const getNotes = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = await User.findById(req.user._id).select('notes');
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        // Sort notes - pinned first, then by updatedAt
        const sortedNotes = user.notes.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        });

        res.status(200).json({ notes: sortedNotes });
    } catch (error) {
        return throwError({ message: "Error retrieving notes", res, status: 500 });
    }
};

// Update Note
export const updateNote = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { 
            noteId, 
            title, 
            content, 
            backgroundColor, 
            textColor, 
            fontSize, 
            isPinned, 
            isChecklist, 
            checklistItems 
        } = req.body;

        if (!noteId || !checkId({id: noteId, res})) return;

        const user = await User.findById(req.user._id);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const noteIndex = user.notes.findIndex(n => n._id.toString() === noteId);
        if (noteIndex === -1) {
            return throwError({ message: "Note not found", res, status: 404 });
        }

        const updatedNote = {
            ...user.notes[noteIndex],
            title: title !== undefined ? title : user.notes[noteIndex].title,
            content: content !== undefined ? content : user.notes[noteIndex].content,
            backgroundColor: backgroundColor !== undefined ? backgroundColor : user.notes[noteIndex].backgroundColor,
            textColor: textColor !== undefined ? textColor : user.notes[noteIndex].textColor,
            fontSize: fontSize !== undefined ? fontSize : user.notes[noteIndex].fontSize,
            isPinned: isPinned !== undefined ? isPinned : user.notes[noteIndex].isPinned,
            isChecklist: isChecklist !== undefined ? isChecklist : user.notes[noteIndex].isChecklist,
            checklistItems: checklistItems !== undefined ? checklistItems : user.notes[noteIndex].checklistItems,
            updatedAt: new Date()
        };

        user.notes[noteIndex] = updatedNote as any;
        await user.save();

        res.status(200).json({ message: "Note updated", note: updatedNote });
    } catch (error) {
        return throwError({ message: "Error updating note", res, status: 500 });
    }
};

// Delete Note
export const deleteNote = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { noteId } = req.body;
        if (!noteId || !checkId({id: noteId, res})) return;

        const user = await User.findById(req.user._id);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const noteIndex = user.notes.findIndex(n => n._id.toString() === noteId);
        if (noteIndex === -1) {
            return throwError({ message: "Note not found", res, status: 404 });
        }

        const [deletedNote] = user.notes.splice(noteIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Note deleted successfully', note: deletedNote });
    } catch (error) {
        return throwError({message: "Error deleting note", res, status: 500});
    }
};