import { Response } from "express";
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { IStory } from "../interfaces/IStory";
import { Family } from "../models/family.model";
import { checkId } from "../utils/checkId";
import { Types } from "mongoose";

// API to create a new story
export const createStory = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        let { title, content, type } = req.body;

        if (!title || !content) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        if (!type) {
            type = 'personal';
        }

        const story = {
            title,
            content,
            type: type || 'personal',
            createdAt: new Date()
        } as IStory;

        if (type === 'personal') {
            req.user.personalStories.push(story);
            await req.user.save();
        } 
        
        else if (type === 'family' && req.user.familyId) {

            const family = await Family.findById(req.user.familyId);

            if (!family) {
                return throwError({ message: 'Family not found', res, status: 404 });
            }

            family.sharedStories.push(story);
            await family.save();
        } else {
            return throwError({ message: 'Invalid story type or no family for the user', res, status: 400 });
        }

        res.status(201).json({ message: 'Story created successfully', story });
    } catch (error) {
        console.error('Error creating story:', error);
        return throwError({ message: 'Error creating story', res, status: 500 });
    }
};

// API to get all stories
export const getStories = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const personalStories = req.user.personalStories;
        if (!personalStories) {
            return throwError({ message: 'Personal stories not found', res, status: 404 });
        }
        const family = req.user.familyId ? (await Family.findById(req.user.familyId)) : null;
        if (!family) {
            return throwError({ message: 'Family not found', res, status: 404 });
        }

        const familyStories = family.sharedStories;

        res.status(200).json({ message: 'Story retrieved successfully', personalStories, familyStories });
    } catch (error) {
        console.error('Error getting stories:', error);
        return throwError({ message: 'Error getting stories', res, status: 500 });
    }
};

// API to get a story by id
export const getStoryById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { storyId } = req.params;

        if(!checkId({id: storyId, res})) return;


        const personalStory = req.user.personalStories.find((story) => story.id.toString() === storyId);

        if (personalStory) {
            res.status(200).json({ message: 'Personal story retrieved successfully', story: personalStory });
            return;
        }

        const family = req.user.familyId ? (await Family.findById(req.user.familyId)) : null;
        if (!family) {
            return throwError({ message: 'Family not found', res, status: 404 });
        }

        const familyStory = family.sharedStories.find((story) => story.id.toString() === storyId);
        if (familyStory) {
            res.status(200).json({ message: 'Family story retrieved successfully', story: familyStory });
            return;
        }

        return throwError({ message: 'Story not found', res, status: 404 });
    } catch (error) {
        console.error('Error getting story:', error);
        return throwError({ message: 'Error getting story', res, status: 500 });
    }
};

// API to delete a story
export const deleteStory = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { storyId } = req.body;
        if(!checkId({id: storyId, res})) return;

        const personalStoryIndex = req.user.personalStories.findIndex(
            (story) => story.id.toString() === storyId
        );

        if (personalStoryIndex !== -1) {
            const [deletedStory] = req.user.personalStories.splice(personalStoryIndex, 1);            ;
            await req.user.save();
            res.status(200).send({ message: 'Personal story deleted successfully', deletedStory });
            return;
        }

        const family = req.user.familyId ? (await Family.findById(req.user.familyId)) : null;
        if (!family) {
            return throwError({ message: 'Family not found', res, status: 404 });
        }

        const familyStoryIndex = family.sharedStories.findIndex(
            (story) => story.id.toString() === storyId
        );

        if (familyStoryIndex !== -1) {
            const [deletedStory] =family.sharedStories.splice(familyStoryIndex, 1);
            await family.save();
            res.status(200).json({ message: 'Family story deleted successfully', deletedStory });
            return;
        }

        return throwError({ message: 'Story not found', res, status: 404 });
    } catch (error) {
        console.error('Error deleting story:', error);
        return throwError({ message: 'Error deleting story', res, status: 500 });
    }
};