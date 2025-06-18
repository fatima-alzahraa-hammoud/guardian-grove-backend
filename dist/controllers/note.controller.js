"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.getNotes = exports.createNote = void 0;
const error_1 = require("../utils/error");
const user_model_1 = require("../models/user.model");
const checkId_1 = require("../utils/checkId");
//API to create note
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { title, content, type } = req.body;
        if (!type || !content || !type) {
            return (0, error_1.throwError)({ message: "All required fields must be filled", res, status: 400 });
        }
        if (type !== "personal" && type !== "family") {
            return (0, error_1.throwError)({ message: "Invalid type", res, status: 400 });
        }
        const user = req.user;
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const newNote = ({
            title,
            content,
            type,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
        });
        const updatedUser = yield user_model_1.User.findOneAndUpdate({ _id: user._id }, { $push: { notes: newNote } }, { new: true });
        if (!updatedUser) {
            return (0, error_1.throwError)({ message: "Failed to update user notes.", res, status: 500 });
        }
        res.status(201).json({ message: "Note created", note: newNote });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error creating note", res, status: 500 });
    }
});
exports.createNote = createNote;
//API to get notes of the user/users
const getNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            res.status(200).json({ message: "Retrieving user notes successfully", notes: user.notes });
            return;
        }
        if (!req.user || req.user.role !== 'admin') {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const users = yield user_model_1.User.find();
        if (!users || users.length === 0) {
            return (0, error_1.throwError)({ message: "No users in the database", res, status: 404 });
        }
        const allNotes = users.map(user => ({
            userId: user._id,
            notes: user.notes
        }));
        res.status(200).json({ message: "Retrieving all users' notes successfully", notes: allNotes });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error retrieving notes", res, status: 500 });
    }
});
exports.getNotes = getNotes;
//API to update note
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, noteId, title, content, isPinned } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: noteId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const note = user.notes.find(note => note._id.toString() === noteId);
        if (!note) {
            return (0, error_1.throwError)({ message: "Note not found", res, status: 404 });
        }
        note.title = title || note.title;
        note.content = content || note.content;
        note.isPinned = isPinned || note.isPinned;
        note.updatedAt = new Date();
        yield user.save();
        res.status(200).json({ message: "Note updated", note });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error updating note", res, status: 500 });
    }
});
exports.updateNote = updateNote;
//API to delete note
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, noteId } = req.body;
        if (!(0, checkId_1.checkId)({ id: noteId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const noteIndex = user.notes.findIndex((note) => note._id.toString() === noteId);
        if (noteIndex === -1) {
            return (0, error_1.throwError)({ message: "Note not found", res, status: 404 });
        }
        const [deletedNote] = user.notes.splice(noteIndex, 1);
        yield user.save();
        res.status(200).json({ message: 'Note deleted successfully', DeletedNote: deletedNote });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error deleting note", res, status: 500 });
    }
});
exports.deleteNote = deleteNote;
