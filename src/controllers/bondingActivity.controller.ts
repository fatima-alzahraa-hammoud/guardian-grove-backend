import { Request, Response } from 'express';
import { BondingActivityModel } from '../models/bondingActivity.model';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { checkId } from '../utils/checkId';

export const createBondingActivity = async (req: CustomRequest, res: Response) => {
    try {
        const { title, description, category, duration, difficulty, ageGroup, participants, materials, downloadUrl, thumbnail } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        // Validate required fields
        if (!title || !description || !category || !duration || !difficulty || 
            !ageGroup || !participants || !materials || !downloadUrl || !thumbnail) {
            return throwError({ message: "All fields are required", res, status: 400 });
        }

        const newActivity = new BondingActivityModel({
            title,
            description,
            category,
            duration,
            difficulty,
            ageGroup,
            participants,
            materials,
            downloadUrl,
            thumbnail,
            familyId: req.user.familyId,
            createdBy: req.user._id
        });

        await newActivity.save();

        res.status(201).json({
            message: "Bonding activity created successfully",
            activity: newActivity
        });

    } catch (error) {
        console.error('Error creating bonding activity:', error);
        return throwError({ message: "Failed to create bonding activity", res, status: 500 });
    }
};


export const getBondingActivities = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { category } = req.query;
        let query: any = { familyId: req.user.familyId };

        if (category && category !== 'All Activities') {
            query.category = category;
        }

        const activities = await BondingActivityModel.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name avatar');

        res.status(200).json({
            message: "Bonding activities retrieved successfully",
            activities
        });

    } catch (error) {
        console.error('Error fetching bonding activities:', error);
        return throwError({ message: "Failed to fetch bonding activities", res, status: 500 });
    }
};