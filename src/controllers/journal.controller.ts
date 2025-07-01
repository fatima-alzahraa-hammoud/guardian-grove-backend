import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { Family } from "../models/family.model";
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { checkId } from '../utils/checkId';
import { deleteFromCloudinary, extractPublicIdFromUrl } from '../utils/cloudinary';

// API to create a journal entry
export const createJournalEntry = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { type, title, content } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        // Validate required fields
        if (!type || !title) {
            return throwError({ message: "Type and title are required.", res, status: 400 });
        }

        // Validate type
        const validTypes = ['text', 'image', 'video', 'audio'];
        if (!validTypes.includes(type)) {
            return throwError({ message: "Invalid entry type.", res, status: 400 });
        }

        // Find user's family
        const family = await Family.findById(req.user.familyId);
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        let entryContent = content;
        let thumbnail = undefined;

        // Handle file upload for media entries
        if (type !== 'text') {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const mediaFile = files.media?.[0];

            if (!mediaFile) {
                return throwError({ message: "Media file is required for this entry type.", res, status: 400 });
            }

            try {
                // Upload to Cloudinary
                const uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: `guardian_grove/journal/${family._id}`,
                            resource_type: type === 'video' ? 'video' : 'auto',
                            transformation: type === 'image' ? [
                                { width: 800, height: 600, crop: 'limit' },
                                { quality: 'auto' }
                            ] : undefined
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(mediaFile.buffer);
                });

                const result = uploadResult as any;
                entryContent = result.secure_url;

                // Generate thumbnail for videos
                if (type === 'video') {
                    thumbnail = result.secure_url.replace(/\.(mp4|mov|avi)$/, '.jpg');
                }
            } catch (uploadError) {
                console.error('Media upload error:', uploadError);
                return throwError({ message: "Failed to upload media file.", res, status: 500 });
            }
        } else {
            // For text entries, content is required
            if (!content) {
                return throwError({ message: "Content is required for text entries.", res, status: 400 });
            }
        }

        // Create journal entry
        const journalEntry = {
            familyId: family._id,
            userId: req.user._id,
            type,
            title,
            content: entryContent,
            thumbnail,
            _id: undefined,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add to family's journal entries
        family.journalEntries.push(journalEntry as any);
        await family.save();

        res.status(201).json({ 
            message: "Journal entry created successfully", 
            journalEntry: family.journalEntries[family.journalEntries.length - 1]
        });

    } catch (error) {
        console.error('Create journal entry error:', error);
        return throwError({ message: "Failed to create journal entry.", res, status: 500 });
    }
};

// API to get all journal entries for a family
export const getJournalEntries = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const family = await Family.findById(req.user.familyId)
            .populate('journalEntries.userId', 'name avatar')
            .select('journalEntries');

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Sort journal entries by date (newest first)
        const sortedEntries = family.journalEntries.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        res.status(200).json({ 
            message: "Journal entries retrieved successfully", 
            journalEntries: sortedEntries 
        });

    } catch (error) {
        return throwError({ message: "Error retrieving journal entries", res, status: 500 });
    }
};
