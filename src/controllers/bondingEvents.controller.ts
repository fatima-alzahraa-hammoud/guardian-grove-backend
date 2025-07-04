import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { Family } from "../models/family.model";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { Types } from "mongoose";
import { openai } from "../index";
import { createNotificationToMultiple } from "../services/notification.service";

// Generate bonding events using AI
export const generateBondingEvents = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;
        if (!user.familyId) {
            throwError({ message: "User is not part of a family", res, status: 400 });
            return;
        }

        // Get family members to personalize suggestions
        const family = await Family.findById(user.familyId).populate('members');
        if (!family) {
            throwError({ message: "Family not found", res, status: 404 });
            return;
        }

        const memberNames = family.members.map(member => (member as any).name);
        const familySize = family.members.length;

        // AI prompt to generate bonding events
        const aiPrompt = `
            Generate 3 creative family bonding activity suggestions for a family with ${familySize} members (${memberNames.join(', ')}).
            The activities should:
            - Be suitable for all ages in the family
            - Require minimal preparation
            - Be fun and engaging
            - Promote family bonding
            - Include indoor and outdoor options
            
            Format each suggestion as a JSON object with:
            - title: Short activity name (5-7 words)
            - description: Detailed description (2-3 sentences)
            - idealTime: Suggested time of day (morning/afternoon/evening)
            - duration: Estimated duration (e.g., "1 hour")
            - location: Suggested location (indoor/outdoor/specific place)
            
            Return ONLY a valid JSON array of these objects, with no additional text or explanations.
            
            Example:
            [
                {
                    "title": "Backyard Camping Night",
                    "description": "Set up a tent in the backyard and have a mini camping adventure with stories and stargazing.",
                    "idealTime": "evening",
                    "duration": "2-3 hours",
                    "location": "outdoor (backyard)"
                }
            ]
        `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 500,
        });

        let events;
        try {
            // Parse the AI response
            const content = response.choices[0].message.content;
            if (!content) {
                throwError({ message: "AI response content is empty", res, status: 500 });
                return;
            }
            // Clean the response by removing markdown code blocks if present
            const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            events = JSON.parse(cleanedContent);
        } catch (parseError) {
            throwError({ message: "Failed to generate events", res, status: 500 });
            return;
        }

        if (!Array.isArray(events)) {
            throwError({ message: "Invalid events format", res, status: 500 });
            return;
        }

        // Create bonding events in the family with pending status
        const newEvents = events.map(event => ({
            title: event.title,
            description: event.description,
            date: new Date(), // Default to today, can be adjusted by parent
            time: event.idealTime === 'morning' ? '09:00 AM' : 
                  event.idealTime === 'afternoon' ? '02:00 PM' : '06:00 PM',
            location: event.location,
            status: 'pending',
            createdBy: user._id,
        }));

        // Add events to family using Mongoose's create method to ensure all fields (_id, createdAt, updatedAt) are generated
        newEvents.forEach(event => family.bondingEvents.push(event as any));
        await family.save();

        // Send notification to parent(s) to approve events
        const parents = family.members.filter((member: any) => member.role === 'parent');
        if (parents.length > 0) {
            const parentTokens = parents
                .map((parent: any) => parent.fcmTokens || [])
                .flat();

            if (parentTokens.length > 0) {
                await createNotificationToMultiple({
                    tokens: parentTokens,
                    title: "New Bonding Events to Review",
                    body: `${user.name} has generated ${newEvents.length} family bonding suggestions. Please review them!`,
                    data: { 
                        type: "bonding-event", 
                        familyId: family._id.toString() 
                    },
                });
            }
        }

        res.status(201).json({ 
            message: "Bonding events generated and pending approval", 
            events: newEvents 
        });

    } catch (error) {
        throwError({ message: "Failed to generate bonding events", res, status: 500 });
    }
};

// Approve or reject a bonding event
export const reviewBondingEvent = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;
        const { eventId, status } = req.body;

        if (!checkId({ id: eventId, res })) return;
        if (!['approved', 'rejected'].includes(status)) {
            throwError({ message: "Invalid status", res, status: 400 });
            return;
        }

        // Find the family and event
        const family = await Family.findOne({
            _id: user.familyId,
            'bondingEvents._id': eventId
        });

        if (!family) {
            throwError({ message: "Family or event not found", res, status: 404 });
            return;
        }

        // Update the event status
        const eventIndex = family.bondingEvents.findIndex(
            e => e._id.toString() === eventId
        );

        if (eventIndex === -1) {
            throwError({ message: "Event not found", res, status: 404 });
            return;
        }

        family.bondingEvents[eventIndex].status = status;
        await family.save();

        // If approved, notify all family members
        if (status === 'approved') {
            const approvedEvent = family.bondingEvents[eventIndex];
            const members = await User.find({ familyId: family._id });
            const allTokens = members
                .map(member => member.fcmTokens || [])
                .flat();

            if (allTokens.length > 0) {
                await createNotificationToMultiple({
                    tokens: allTokens,
                    title: "New Family Bonding Event!",
                    body: `${approvedEvent.title} - ${approvedEvent.description}`,
                    data: { 
                        type: "bonding-event-approved", 
                        familyId: family._id.toString(),
                        eventId: approvedEvent._id.toString()
                    },
                });
            }
        }

        res.status(200).json({ 
            message: `Event ${status} successfully`,
            event: family.bondingEvents[eventIndex]
        });

    } catch (error) {
        throwError({ message: "Failed to review event", res, status: 500 });
    }
};

// Get all bonding events for a family
export const getFamilyBondingEvents = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;
        if (!user.familyId) {
            throwError({ message: "User is not part of a family", res, status: 400 });
            return;
        }

        const family = await Family.findById(user.familyId)
            .select('bondingEvents')
            .populate('bondingEvents.createdBy', 'name avatar');

        if (!family) {
            throwError({ message: "Family not found", res, status: 404 });
            return;
        }

        // Filter based on user role - parents see all, children only see approved
        let events = family.bondingEvents;
        if (user.role !== 'parent') {
            events = events.filter(event => event.status === 'approved');
        }

        res.status(200).json({ 
            message: "Bonding events retrieved successfully",
            events 
        });

    } catch (error) {
        throwError({ message: "Failed to get bonding events", res, status: 500 });
    }
};