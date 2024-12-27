import { Request, Response } from "express";
import { Family } from "../models/family.model";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";

//API get all families
export const getAllFamilies = async (req: Request, res: Response): Promise<void> => {
    try {
        const families = await Family.find();
        
        if (!families || families.length === 0) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving all families successfully", families });
    } catch (error) {
        return throwError({ message: "Failed to retrieve all families.", res, status: 500 });
    }
};

// Get Family by ID
export const getFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        const family = await Family.findById(familyId);
        
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving family successfully", family });
    } catch (error) {
        return throwError({ message: "Failed to retrieve family.", res, status: 500 });
    }
};

// Get family members of a family
export const getFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        
        // Find family and populate members with full user details
        const family = await Family.findById(familyId).populate({ path: "members._id", model: "User"}).lean();

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Flatten the structure to avoid `_id` nesting
        const familyWithMembers = {
            ...family,
            members: family.members.map(member => ({
                ...member._id,
                role: member.role
            }))
        };

        res.status(200).json({ message:"Retrieving family members successfully", familyWithMembers});

    } catch (error) {
        return throwError({ message: "Failed to retrieve family members.", res, status: 500 });
    }
};