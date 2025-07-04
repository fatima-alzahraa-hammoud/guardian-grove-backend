import { Response } from 'express';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import { FamilyMessage } from '../models/FamilyMessage.model';
import { FamilyChat } from '../models/FamilyChat.model';
import { checkId } from '../utils/checkId';
import { User } from '../models/user.model';
import { uploadMessageFile } from '../utils/cloudinary';

// Get all chats for the current user's family
export const getFamilyChats = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!req.user.familyId) {
            return throwError({ message: "User is not part of a family", res, status: 400 });
        }

        // Get all chats where user is a member
        const chats = await FamilyChat.find({
            familyId: req.user.familyId,
            members: req.user._id,
            isActive: true
        })
        .populate('members', 'name avatar role')
        .sort({ 'lastMessage.timestamp': -1 })
        .lean();

        // Add unread count and online status for each chat
        const chatsWithMetadata = await Promise.all(
            chats.map(async (chat) => {
                // Count unread messages
                const unreadCount = await FamilyMessage.countDocuments({
                    chatId: chat._id,
                    'readBy.userId': { $ne: req.user!._id },
                    senderId: { $ne: req.user!._id },
                    isDeleted: false
                });

                // For direct chats, get the other user's online status
                let isOnline = false;
                if (chat.type === 'direct') {
                    const otherMember = chat.members.find(
                        (member: any) => member._id.toString() !== req.user!._id.toString()
                    );
                    if (otherMember) {
                        // You can implement online status tracking here
                        // For now, we'll simulate it
                        isOnline = Math.random() > 0.5;
                    }
                }

                return {
                    ...chat,
                    unreadCount,
                    isOnline: chat.type === 'direct' ? isOnline : undefined
                };
            })
        );

        res.status(200).json({
            message: "Family chats retrieved successfully",
            chats: chatsWithMetadata
        });
    } catch (error) {
        return throwError({ message: "Error retrieving family chats", res, status: 500 });
    }
};

// Create a new group chat
export const createGroupChat = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { name, members, description } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!req.user.familyId) {
            return throwError({ message: "User is not part of a family", res, status: 400 });
        }

        if (!name || !members || !Array.isArray(members) || members.length === 0) {
            return throwError({ message: "Name and members are required", res, status: 400 });
        }

        // Validate all member IDs
        for (const memberId of members) {
            if (!checkId({ id: memberId, res })) return;
        }

        // Verify all members belong to the same family
        const familyMembers = await User.find({
            _id: { $in: [...members, req.user._id] },
            familyId: req.user.familyId
        });

        if (familyMembers.length !== members.length + 1) {
            return throwError({ message: "All members must belong to the same family", res, status: 400 });
        }

        // Create the group chat
        const chat = await FamilyChat.create({
            name,
            type: 'group',
            members: [...members, req.user._id],
            familyId: req.user.familyId,
            description,
            createdBy: req.user._id
        });

        const populatedChat = await FamilyChat.findById(chat._id)
            .populate('members', 'name avatar role')
            .lean();

        res.status(201).json({
            message: "Group chat created successfully",
            chat: {
                ...populatedChat,
                unreadCount: 0
            }
        });
    } catch (error) {
        return throwError({ message: "Error creating group chat", res, status: 500 });
    }
};


// Get messages for a specific chat
export const getChatMessages = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: chatId, res })) return;

        // Verify user is a member of the chat
        const chat = await FamilyChat.findOne({
            _id: chatId,
            members: req.user._id,
            familyId: req.user.familyId
        });

        if (!chat) {
            return throwError({ message: "Chat not found or access denied", res, status: 404 });
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Get messages with pagination
        const messages = await FamilyMessage.find({
            chatId,
            isDeleted: false
        })
        .populate('replyTo', 'content senderName type')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

        // Reverse to get chronological order
        messages.reverse();

        res.status(200).json({
            message: "Chat messages retrieved successfully",
            messages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                hasMore: messages.length === Number(limit)
            }
        });
    } catch (error) {
        return throwError({ message: "Error retrieving chat messages", res, status: 500 });
    }
};


// Send a new message
export const sendMessage = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { chatId, content, type = 'text', replyTo } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: chatId, res })) return;

        if (!content || content.trim() === '') {
            return throwError({ message: "Message content is required", res, status: 400 });
        }

        // Verify user is a member of the chat
        const chat = await FamilyChat.findOne({
            _id: chatId,
            members: req.user._id,
            familyId: req.user.familyId
        });

        if (!chat) {
            return throwError({ message: "Chat not found or access denied", res, status: 404 });
        }

        // Handle file upload if present
        let fileUrl, fileName, fileSize;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const messageFile = files?.messageFile?.[0];

        if (messageFile) {
            try {
                const uploadResult = await uploadMessageFile(messageFile.buffer, messageFile.originalname) as { secure_url: string };
                fileUrl = uploadResult.secure_url;
                fileName = messageFile.originalname;
                fileSize = messageFile.size;
            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                return throwError({ message: "Failed to upload file", res, status: 500 });
            }
        }

        // Create the message
        const message = await FamilyMessage.create({
            chatId,
            senderId: req.user._id,
            senderName: req.user.name,
            senderAvatar: req.user.avatar,
            content: content.trim(),
            type,
            replyTo: replyTo || undefined,
            fileUrl,
            fileName,
            fileSize,
            readBy: [{
                userId: req.user._id,
                readAt: new Date()
            }]
        });

        // Update chat's last message
        await FamilyChat.findByIdAndUpdate(chatId, {
            lastMessage: {
                messageId: message._id,
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                timestamp: message.timestamp,
                type: message.type
            }
        });

        const populatedMessage = await FamilyMessage.findById(message._id)
            .populate('replyTo', 'content senderName type')
            .lean();

        res.status(201).json({
            message: "Message sent successfully",
            messageData: populatedMessage
        });
    } catch (error) {
        return throwError({ message: "Error sending message", res, status: 500 });
    }
};


// Mark messages as read
export const markMessagesAsRead = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: chatId, res })) return;

        // Verify user is a member of the chat
        const chat = await FamilyChat.findOne({
            _id: chatId,
            members: req.user._id,
            familyId: req.user.familyId
        });

        if (!chat) {
            return throwError({ message: "Chat not found or access denied", res, status: 404 });
        }

        // Mark all unread messages as read
        await FamilyMessage.updateMany(
            {
                chatId,
                'readBy.userId': { $ne: req.user._id },
                senderId: { $ne: req.user._id },
                isDeleted: false
            },
            {
                $addToSet: {
                    readBy: {
                        userId: req.user._id,
                        readAt: new Date()
                    }
                }
            }
        );

        res.status(200).json({
            message: "Messages marked as read successfully"
        });
    } catch (error) {
        return throwError({ message: "Error marking messages as read", res, status: 500 });
    }
};


// Edit a message
export const editMessage = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: messageId, res })) return;

        if (!content || content.trim() === '') {
            return throwError({ message: "Message content is required", res, status: 400 });
        }

        // Find the message and verify ownership
        const message = await FamilyMessage.findOne({
            _id: messageId,
            senderId: req.user._id,
            isDeleted: false
        });

        if (!message) {
            return throwError({ message: "Message not found or access denied", res, status: 404 });
        }

        // Update the message
        message.content = content.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        res.status(200).json({
            message: "Message edited successfully",
            messageData: message
        });
    } catch (error) {
        return throwError({ message: "Error editing message", res, status: 500 });
    }
};


// Delete a message
export const deleteMessage = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: messageId, res })) return;

        // Find the message and verify ownership or admin rights
        const message = await FamilyMessage.findOne({
            _id: messageId,
            isDeleted: false
        });

        if (!message) {
            return throwError({ message: "Message not found", res, status: 404 });
        }

        // Check if user can delete (owner or admin/parent)
        const canDelete = message.senderId.equals(req.user._id) || 
                         ['admin', 'parent'].includes(req.user.role);

        if (!canDelete) {
            return throwError({ message: "Access denied", res, status: 403 });
        }

        // Soft delete the message
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = "This message was deleted";
        await message.save();

        res.status(200).json({
            message: "Message deleted successfully"
        });
    } catch (error) {
        return throwError({ message: "Error deleting message", res, status: 500 });
    }
};


// Add reaction to a message
export const addReaction = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: messageId, res })) return;

        if (!emoji) {
            return throwError({ message: "Emoji is required", res, status: 400 });
        }
        if (!emoji || typeof emoji !== 'string' || emoji.length > 5) {
            return throwError({ message: "Invalid emoji", res, status: 400 });
        }

        const message = await FamilyMessage.findOne({
            _id: messageId,
            isDeleted: false
        });

        if (!message) {
            return throwError({ message: "Message not found", res, status: 404 });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            reaction => reaction.userId.equals(req.user!._id) && reaction.emoji === emoji
        );

        if (existingReaction) {
            // Remove the reaction
            message.reactions = message.reactions.filter(
                reaction => !(reaction.userId.equals(req.user!._id) && reaction.emoji === emoji)
            );
        } else {
            // Add the reaction
            message.reactions.push({
                userId: req.user._id,
                emoji,
                timestamp: new Date()
            });
        }

        await message.save();

        res.status(200).json({
            message: "Reaction updated successfully",
            reactions: message.reactions
        });
    } catch (error) {
        return throwError({ message: "Error updating reaction", res, status: 500 });
    }
};

// Create or get direct chat with another family member
export const createOrGetDirectChat = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { memberId } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (!checkId({ id: memberId, res })) return;

        if (memberId === req.user._id.toString()) {
            return throwError({ message: "Cannot create chat with yourself", res, status: 400 });
        }

        // Verify the other member belongs to the same family
        const otherMember = await User.findOne({
            _id: memberId,
            familyId: req.user.familyId
        });

        if (!otherMember) {
            return throwError({ message: "Member not found in your family", res, status: 404 });
        }

        // Check if direct chat already exists
        let chat = await FamilyChat.findOne({
            type: 'direct',
            familyId: req.user.familyId,
            members: { $all: [req.user._id, memberId], $size: 2 }
        }).populate('members', 'name avatar role').lean();

        if (!chat) {
            // Create new direct chat
            const newChat = await FamilyChat.create({
                name: `${req.user.name} & ${otherMember.name}`,
                type: 'direct',
                members: [req.user._id, memberId],
                familyId: req.user.familyId,
                createdBy: req.user._id
            });

            chat = await FamilyChat.findById(newChat._id)
                .populate('members', 'name avatar role')
                .lean();
        }

        res.status(200).json({
            message: "Direct chat retrieved successfully",
            chat: {
                ...chat,
                unreadCount: 0,
                isOnline: Math.random() > 0.5 // Simulate online status
            }
        });
    } catch (error) {
        return throwError({ message: "Error creating/retrieving direct chat", res, status: 500 });
    }
};