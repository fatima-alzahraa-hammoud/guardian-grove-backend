import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { FamilyChat } from '../models/FamilyChat.model';
import { FamilyMessage } from '../models/FamilyMessage.model';

interface UserSocket {
    userId: string;
    familyId: string;
    socketId: string;
    userName: string;
    userAvatar: string;
}

class SocketManager {
    private io: SocketIOServer;
    private connectedUsers: Map<string, UserSocket> = new Map();
    private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupSocketAuthentication();
        this.setupSocketEvents();
    }

    private setupSocketAuthentication() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                const user = await User.findById(decoded.id).select('_id name avatar familyId');
                
                if (!user || !user.familyId) {
                    return next(new Error('User not found or not in family'));
                }

                socket.data = {
                    userId: user._id.toString(),
                    userName: user.name,
                    userAvatar: user.avatar,
                    familyId: user.familyId.toString()
                };

                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
    }

    private setupSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.data.userName} connected with socket ${socket.id}`);
            
            // Add user to connected users
            this.addConnectedUser(socket);
            
            // Join user to their family room
            socket.join(`family_${socket.data.familyId}`);
            
            // Send current online users to the newly connected user
            const onlineUsers = this.getOnlineUsersInFamily(socket.data.familyId);
            socket.emit('online_users', onlineUsers);
            
            // Notify family members that user is online
            this.broadcastUserStatus(socket.data.familyId, socket.data.userId, true);

            // Handle joining specific chat rooms
            socket.on('join_chat', async (chatId: string) => {
                try {
                    console.log(`User ${socket.data.userName} attempting to join chat ${chatId}`);
                    
                    // Verify user is member of this chat
                    const chat = await FamilyChat.findOne({
                        _id: chatId,
                        members: socket.data.userId,
                        familyId: socket.data.familyId
                    });

                    if (chat) {
                        socket.join(`chat_${chatId}`);
                        console.log(`✅ User ${socket.data.userName} joined chat ${chatId}`);
                    } else {
                        console.log(`❌ User ${socket.data.userName} denied access to chat ${chatId}`);
                        socket.emit('error', { message: 'Access denied to chat' });
                    }
                } catch (error) {
                    console.error('Error joining chat:', error);
                    socket.emit('error', { message: 'Failed to join chat' });
                }
            });

            // Handle leaving chat rooms
            socket.on('leave_chat', (chatId: string) => {
                socket.leave(`chat_${chatId}`);
                console.log(`User ${socket.data.userName} left chat ${chatId}`);
            });

            // Handle new message
            socket.on('send_message', async (data) => {
                try {
                    const { chatId, content, type = 'text', replyTo } = data;
                    
                    console.log(`📤 Received message from ${socket.data.userName}: ${content}`);
                    
                    // Verify user is member of this chat
                    const chat = await FamilyChat.findOne({
                        _id: chatId,
                        members: socket.data.userId,
                        familyId: socket.data.familyId
                    });

                    if (!chat) {
                        socket.emit('error', { message: 'Chat not found or access denied' });
                        return;
                    }

                    // Create the message
                    const message = await FamilyMessage.create({
                        chatId,
                        senderId: socket.data.userId,
                        senderName: socket.data.userName,
                        senderAvatar: socket.data.userAvatar,
                        content: content.trim(),
                        type,
                        replyTo: replyTo || undefined,
                        readBy: [{
                            userId: socket.data.userId,
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
                        },
                        updatedAt: new Date()
                    });

                    // Populate reply-to message if exists
                    const populatedMessage = await FamilyMessage.findById(message._id)
                        .populate('replyTo', 'content senderName type')
                        .lean();

                    console.log(`📨 Broadcasting message to chat_${chatId}:`, populatedMessage);

                    // Broadcast to all members of the chat (including sender for confirmation)
                    this.io.to(`chat_${chatId}`).emit('new_message', populatedMessage);
                    
                    // Send push notifications to offline users
                    this.sendPushNotifications(chat.members, socket.data.userId, message);

                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle typing indicators
            socket.on('typing_start', (chatId: string) => {
                console.log(`⌨️ ${socket.data.userName} started typing in chat ${chatId}`);
                socket.to(`chat_${chatId}`).emit('user_typing', {
                    userId: socket.data.userId,
                    userName: socket.data.userName,
                    chatId
                });
            });

            socket.on('typing_stop', (chatId: string) => {
                console.log(`⌨️ ${socket.data.userName} stopped typing in chat ${chatId}`);
                socket.to(`chat_${chatId}`).emit('user_stop_typing', {
                    userId: socket.data.userId,
                    chatId
                });
            });

            // Handle message reactions
            socket.on('add_reaction', async (data) => {
                try {
                    const { messageId, emoji } = data;
                    
                    console.log(`😊 ${socket.data.userName} reacting with ${emoji} to message ${messageId}`);
                    
                    const message = await FamilyMessage.findById(messageId);
                    if (!message) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    // Check if user already reacted with this emoji
                    const existingReaction = message.reactions.find(
                        reaction => reaction.userId.toString() === socket.data.userId && reaction.emoji === emoji
                    );

                    if (existingReaction) {
                        // Remove the reaction
                        message.reactions = message.reactions.filter(
                            reaction => !(reaction.userId.toString() === socket.data.userId && reaction.emoji === emoji)
                        );
                        console.log(`❌ Removed reaction ${emoji} from ${socket.data.userName}`);
                    } else {
                        // Add the reaction
                        message.reactions.push({
                            userId: socket.data.userId as any,
                            emoji,
                            timestamp: new Date()
                        });
                        console.log(`✅ Added reaction ${emoji} from ${socket.data.userName}`);
                    }

                    await message.save();

                    // Broadcast reaction update to chat members
                    this.io.to(`chat_${message.chatId}`).emit('reaction_updated', {
                        messageId,
                        reactions: message.reactions
                    });

                } catch (error) {
                    console.error('Error adding reaction:', error);
                    socket.emit('error', { message: 'Failed to add reaction' });
                }
            });

            // Handle marking messages as read
            socket.on('mark_messages_read', async (chatId: string) => {
                try {
                    console.log(`📖 ${socket.data.userName} marking messages as read in chat ${chatId}`);
                    
                    await FamilyMessage.updateMany(
                        {
                            chatId,
                            'readBy.userId': { $ne: socket.data.userId },
                            senderId: { $ne: socket.data.userId },
                            isDeleted: false
                        },
                        {
                            $addToSet: {
                                readBy: {
                                    userId: socket.data.userId,
                                    readAt: new Date()
                                }
                            }
                        }
                    );

                    // Notify other chat members
                    socket.to(`chat_${chatId}`).emit('messages_read', {
                        userId: socket.data.userId,
                        userName: socket.data.userName,
                        chatId
                    });

                } catch (error) {
                    console.error('Error marking messages as read:', error);
                }
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`User ${socket.data.userName} disconnected: ${reason}`);
                this.removeConnectedUser(socket);
                
                // Check if user has other active connections
                const userConnections = this.userSockets.get(socket.data.userId) || [];
                if (userConnections.length === 0) {
                    // User is completely offline
                    console.log(`User ${socket.data.userName} is now completely offline`);
                    this.broadcastUserStatus(socket.data.familyId, socket.data.userId, false);
                }
            });

            // Handle connection errors
            socket.on('error', (error) => {
                console.error(`Socket error for user ${socket.data.userName}:`, error);
            });
        });
    }

    private addConnectedUser(socket: any) {
        const userSocket: UserSocket = {
            userId: socket.data.userId,
            familyId: socket.data.familyId,
            socketId: socket.id,
            userName: socket.data.userName,
            userAvatar: socket.data.userAvatar
        };

        this.connectedUsers.set(socket.id, userSocket);
        
        // Track multiple connections per user
        const userConnections = this.userSockets.get(socket.data.userId) || [];
        userConnections.push(socket.id);
        this.userSockets.set(socket.data.userId, userConnections);
        
        console.log(`Added user ${socket.data.userName}, total connections: ${userConnections.length}`);
    }

    private removeConnectedUser(socket: any) {
        this.connectedUsers.delete(socket.id);
        
        // Remove from user connections
        const userConnections = this.userSockets.get(socket.data.userId) || [];
        const updatedConnections = userConnections.filter(id => id !== socket.id);
        
        if (updatedConnections.length === 0) {
            this.userSockets.delete(socket.data.userId);
        } else {
            this.userSockets.set(socket.data.userId, updatedConnections);
        }
        
        console.log(`Removed user ${socket.data.userName}, remaining connections: ${updatedConnections.length}`);
    }

    private broadcastUserStatus(familyId: string, userId: string, isOnline: boolean) {
        console.log(`📡 Broadcasting user status: ${userId} is ${isOnline ? 'online' : 'offline'}`);
        
        // Broadcast to family room
        this.io.to(`family_${familyId}`).emit('user_status_changed', {
            userId,
            isOnline,
            timestamp: new Date()
        });

        // Send updated online users list to family
        const onlineUsers = this.getOnlineUsersInFamily(familyId);
        this.io.to(`family_${familyId}`).emit('online_users', onlineUsers);
    }

    private async sendPushNotifications(members: any[], senderId: string, message: any) {
        try {
            // Get offline family members
            const onlineUserIds = Array.from(this.userSockets.keys());
            const offlineMembers = await User.find({
                _id: { $in: members, $ne: senderId, $nin: onlineUserIds },
                fcmTokens: { $exists: true, $not: { $size: 0 } }
            }).select('fcmTokens name');

            // Send push notifications to offline users
            // Implementation depends on your push notification service (FCM, etc.)
            for (const member of offlineMembers) {
                // Send push notification logic here
                console.log(`📱 Would send push notification to ${member.name} for message: ${message.content}`);
            }
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }

    // Public method to get online users in a family
    public getOnlineUsersInFamily(familyId: string): string[] {
        const onlineUsers: string[] = [];
        this.connectedUsers.forEach((userSocket) => {
            if (userSocket.familyId === familyId && !onlineUsers.includes(userSocket.userId)) {
                onlineUsers.push(userSocket.userId);
            }
        });
        return onlineUsers;
    }

    // Public method to check if user is online
    public isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    // Public method to get socket instance (for external use)
    public getIO() {
        return this.io;
    }

    // Public method to broadcast to specific chat
    public broadcastToChat(chatId: string, event: string, data: any) {
        this.io.to(`chat_${chatId}`).emit(event, data);
    }

    // Public method to broadcast to family
    public broadcastToFamily(familyId: string, event: string, data: any) {
        this.io.to(`family_${familyId}`).emit(event, data);
    }
}

export default SocketManager;