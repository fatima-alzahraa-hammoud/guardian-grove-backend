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