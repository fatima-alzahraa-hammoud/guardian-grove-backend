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
exports.updateStory = exports.deleteStory = exports.getStoryById = exports.getStories = exports.createStory = void 0;
const error_1 = require("../utils/error");
const family_model_1 = require("../models/family.model");
const checkId_1 = require("../utils/checkId");
// API to create a new story
const createStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        let { title, content, type } = req.body;
        if (!title || !content) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        if (!type) {
            type = 'personal';
        }
        const story = {
            title,
            content,
            type: type || 'personal',
            createdAt: new Date()
        };
        if (type === 'personal') {
            req.user.personalStories.push(story);
            yield req.user.save();
        }
        else if (type === 'family' && req.user.familyId) {
            const family = yield family_model_1.Family.findById(req.user.familyId);
            if (!family) {
                return (0, error_1.throwError)({ message: 'Family not found', res, status: 404 });
            }
            story.collaborators = family.members.map(member => member._id);
            family.sharedStories.push(story);
            yield family.save();
        }
        else {
            return (0, error_1.throwError)({ message: 'Invalid story type or no family for the user', res, status: 400 });
        }
        res.status(201).json({ message: 'Story created successfully', story });
    }
    catch (error) {
        console.error('Error creating story:', error);
        return (0, error_1.throwError)({ message: 'Error creating story', res, status: 500 });
    }
});
exports.createStory = createStory;
// API to get all stories
const getStories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const personalStories = req.user.personalStories;
        if (!personalStories) {
            return (0, error_1.throwError)({ message: 'Personal stories not found', res, status: 404 });
        }
        const family = req.user.familyId ? (yield family_model_1.Family.findById(req.user.familyId)) : null;
        if (!family) {
            return (0, error_1.throwError)({ message: 'Family not found', res, status: 404 });
        }
        const familyStories = family.sharedStories;
        res.status(200).json({ message: 'Story retrieved successfully', personalStories, familyStories });
    }
    catch (error) {
        console.error('Error getting stories:', error);
        return (0, error_1.throwError)({ message: 'Error getting stories', res, status: 500 });
    }
});
exports.getStories = getStories;
// API to get a story by id
const getStoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { storyId } = req.params;
        if (!(0, checkId_1.checkId)({ id: storyId, res }))
            return;
        const personalStory = req.user.personalStories.find((story) => story.id.toString() === storyId);
        if (personalStory) {
            res.status(200).json({ message: 'Personal story retrieved successfully', story: personalStory });
            return;
        }
        const family = req.user.familyId ? (yield family_model_1.Family.findById(req.user.familyId)) : null;
        if (!family) {
            return (0, error_1.throwError)({ message: 'Family not found', res, status: 404 });
        }
        const familyStory = family.sharedStories.find((story) => story.id.toString() === storyId);
        if (familyStory) {
            res.status(200).json({ message: 'Family story retrieved successfully', story: familyStory });
            return;
        }
        return (0, error_1.throwError)({ message: 'Story not found', res, status: 404 });
    }
    catch (error) {
        console.error('Error getting story:', error);
        return (0, error_1.throwError)({ message: 'Error getting story', res, status: 500 });
    }
});
exports.getStoryById = getStoryById;
// API to delete a story
const deleteStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { storyId } = req.body;
        if (!(0, checkId_1.checkId)({ id: storyId, res }))
            return;
        const personalStoryIndex = req.user.personalStories.findIndex((story) => story.id.toString() === storyId);
        if (personalStoryIndex !== -1) {
            const [deletedStory] = req.user.personalStories.splice(personalStoryIndex, 1);
            ;
            yield req.user.save();
            res.status(200).send({ message: 'Personal story deleted successfully', deletedStory });
            return;
        }
        const family = req.user.familyId ? (yield family_model_1.Family.findById(req.user.familyId)) : null;
        if (!family) {
            return (0, error_1.throwError)({ message: 'Family not found', res, status: 404 });
        }
        const familyStoryIndex = family.sharedStories.findIndex((story) => story.id.toString() === storyId);
        if (familyStoryIndex !== -1) {
            const [deletedStory] = family.sharedStories.splice(familyStoryIndex, 1);
            yield family.save();
            res.status(200).json({ message: 'Family story deleted successfully', deletedStory });
            return;
        }
        return (0, error_1.throwError)({ message: 'Story not found', res, status: 404 });
    }
    catch (error) {
        console.error('Error deleting story:', error);
        return (0, error_1.throwError)({ message: 'Error deleting story', res, status: 500 });
    }
});
exports.deleteStory = deleteStory;
//API to update stories
const updateStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { storyId, title, content } = req.body;
        if (!(0, checkId_1.checkId)({ id: storyId, res }))
            return;
        if (!title || !content) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        let story;
        const personalStoryIndex = req.user.personalStories.findIndex((story) => story.id.toString() === storyId);
        if (personalStoryIndex !== -1) {
            story = req.user.personalStories[personalStoryIndex];
            story.title = title;
            story.content = content;
            yield req.user.save();
            res.status(200).json({ message: 'Personal story updated successfully', story });
            return;
        }
        const family = req.user.familyId ? (yield family_model_1.Family.findById(req.user.familyId)) : null;
        if (!family) {
            return (0, error_1.throwError)({ message: 'Family not found', res, status: 404 });
        }
        const familyStoryIndex = family.sharedStories.findIndex((story) => story.id.toString() === storyId);
        if (familyStoryIndex !== -1) {
            story = family.sharedStories[familyStoryIndex];
            story.title = title;
            story.content = content;
            yield family.save();
            res.status(200).json({ message: 'Family story updated successfully', story });
            return;
        }
        return (0, error_1.throwError)({ message: 'Story not found', res, status: 404 });
    }
    catch (error) {
        console.error('Error updating story:', error);
        return (0, error_1.throwError)({ message: 'Error updating story', res, status: 500 });
    }
});
exports.updateStory = updateStory;
//API to add collaborator
