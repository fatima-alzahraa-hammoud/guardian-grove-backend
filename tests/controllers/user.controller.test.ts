import { testUtils } from '../setup';
import {  getUsers, getUserById, createUser, editUserProfile,
    deleteUser, updatePassword, getUserStars, updateUserStars,
    getUserCoins, updateUserCoins, getLocation, updateLocation,
    getUserRank, getUserInterests, startAdventure, completeChallenge,
    getUserAdventures, getUserPurchasedItems, getUserAvatar
} from '../../src/controllers/user.controller';
import { User } from '../../src/models/user.model';
import * as generateSecurePassword from '../../src/utils/generateSecurePassword';
import * as checkId from '../../src/utils/checkId';
import { Adventure } from '../../src/models/adventure.model';
import { Family } from '../../src/models/family.model';
import * as emailService from '../../src/services/email.service';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';


// Mock all dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/adventure.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/services/email.service');
jest.mock('../../src/utils/generateSecurePassword');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/checkId');
jest.mock('bcrypt');

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn()
        }
    }
}));

const mockUser = User as jest.Mocked<typeof User>;
const mockAdventure = Adventure as jest.Mocked<typeof Adventure>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockGenerateSecurePassword = generateSecurePassword as jest.Mocked<typeof generateSecurePassword>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

describe('User Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup User model methods
        mockUser.find = jest.fn();
        mockUser.findOne = jest.fn();
        mockUser.findById = jest.fn();
        mockUser.create = jest.fn();
        mockUser.findByIdAndUpdate = jest.fn();
        mockUser.findByIdAndDelete = jest.fn();
        mockUser.countDocuments = jest.fn();

        // Setup Adventure model methods
        mockAdventure.findById = jest.fn();

        // Setup Family model methods
        mockFamily.findOne = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        
        // Setup utility mocks
        mockGenerateSecurePassword.generateSecurePassword.mockReturnValue('TempPass123!');
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockEmailService, 'sendMail').mockResolvedValue(undefined);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
        
        (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashedPassword');
        (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

        mockCloudinary.uploader.upload_stream = jest.fn().mockImplementation((options, callback) => {
            const mockResult = {
                secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/guardian%20grove%20project/avatars/test-avatar.png',
                public_id: 'guardian grove project/avatars/test-avatar'
            };
            callback(null, mockResult);
            return {
                end: jest.fn()
            };
        });
    });

    // 1. test getUsers API
    describe('getUsers', () => {
        it('should return all users successfully', async () => {
            const mockUsers = [
                testUtils.createMockUser({ name: 'John' }),
                testUtils.createMockUser({ name: 'Jane', _id: '507f1f77bcf86cd799439013' })
            ];
            mockUser.find.mockResolvedValue(mockUsers as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getUsers(mockReq as any, mockRes as any);

            expect(mockUser.find).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith(mockUsers);
        });

        it('should handle database errors', async () => {
            mockUser.find.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getUsers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error retrieving users' });
        });
    });

    // 2. test getUserById API
    describe('getUserById', () => {
        it('should return user by ID successfully', async () => {
            const mockUser_data = testUtils.createMockUser();
            const mockUserDoc = {
                ...mockUser_data,
                select: jest.fn().mockResolvedValue(mockUser_data)
            };
            mockUser.findById.mockReturnValue(mockUserDoc as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving user successfully",
                user: mockUser_data
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if user not found', async () => {
            const mockUserDoc = {
                select: jest.fn().mockResolvedValue(null)
            };
            mockUser.findById.mockReturnValue(mockUserDoc as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 403 if forbidden access', async () => {
            const mockUser_data = testUtils.createMockUser({ email: 'different@email.com' });
            const mockUserDoc = {
                select: jest.fn().mockResolvedValue(mockUser_data)
            };
            mockUser.findById.mockReturnValue(mockUserDoc as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ _id: 'different-id', role: 'child' }),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });
    });

    // 3. test createUser API
    describe('createUser', () => {
        const validUserData = {
            name: 'Test Child',
            birthday: '2010-01-01',
            gender: 'male',
            role: 'child',
            interests: ['reading', 'sports']
        };

        const mockFiles = {
            avatar: [{
                fieldname: 'avatar',
                originalname: 'test-avatar.png',
                mimetype: 'image/png',
                size: 1024,
                buffer: Buffer.from('fake-image-data')
            }]
        };

        it('should create user successfully', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com', members: [] });
            const mockCreatedUser = testUtils.createMockUser({
                ...validUserData,
                avatar: 'https://res.cloudinary.com/test/image/upload/v1234567890/guardian%20grove%20project/avatars/test-avatar.png'
            });

            mockUser.findOne.mockResolvedValue(null); // No existing user
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent,
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockUser.create).toHaveBeenCalled();
            expect(mockEmailService.sendMail).toHaveBeenCalled();
            expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null, 
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 if user is child', async () => {
            const mockChild = testUtils.createMockUser({ role: 'child' });
            const mockReq = testUtils.createMockRequest({ 
                user: mockChild, 
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('should return 400 if required fields missing', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const incompleteData = { name: 'Test' }; // Missing required fields

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: incompleteData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'All required fields must be filled.' });
        });

        it('should return 400 if avatar file is missing', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: validUserData,
                files: {} // No avatar file
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Avatar image is required.' });
        });

        it('should return 409 if username already taken', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const existingUser = testUtils.createMockUser({ name: 'Test Child', email: 'parent@test.com' });

            mockUser.findOne.mockResolvedValue(existingUser as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'This username is already taken for this email.' });
        });

        it('should return 400 if interests is not array', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, interests: 'not-an-array' };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: invalidData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid interests format.' });
        });

        it('should handle JSON string interests correctly', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com', members: [] });
            const mockCreatedUser = testUtils.createMockUser(validUserData);

            mockUser.findOne.mockResolvedValue(null);
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const dataWithJsonInterests = { 
                ...validUserData, 
                interests: '["reading", "sports"]' // JSON string
            };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: dataWithJsonInterests,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockUser.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    interests: ['reading', 'sports'] // Should be parsed to array
                })
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if invalid JSON interests string', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { 
                ...validUserData, 
                interests: 'invalid-json-string' 
            };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: invalidData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid interests format.' });
        });

        it('should return 400 if invalid gender', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, gender: 'invalid' };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: invalidData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Gender must be either 'male' or 'female'." });
        });

        it('should return 400 if invalid role', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, role: 'invalid' };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: invalidData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid role.' });
        });

        it('should return 400 if invalid birthday', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, birthday: 'invalid-date' };

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: invalidData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid birthday format.' });
        });

        it('should return 404 if family not found', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            
            mockUser.findOne.mockResolvedValue(null); // No existing user
            mockFamily.findOne.mockResolvedValue(null); // No family found

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Family not found.' });
        });

        it('should handle cloudinary upload error', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com', members: [] });

            mockUser.findOne.mockResolvedValue(null);
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);

            // Mock cloudinary to throw error
            mockCloudinary.uploader.upload_stream = jest.fn().mockImplementation((options, callback) => {
                callback(new Error('Cloudinary upload failed'), null);
                return { end: jest.fn() };
            });

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent, 
                body: validUserData,
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });


    // 4. test editUserProfile API
    describe('editUserProfile', () => {
        it('should edit user profile successfully', async () => {
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOne.mockResolvedValue(null); // No duplicate name

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    name: 'Updated Name',
                    birthday: '1990-01-01',
                    gender: 'male',
                    avatar: '/new-avatar.png'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await editUserProfile(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "User profile updated successfully",
                user: expect.any(Object)
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await editUserProfile(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 if child tries to change role', async () => {
            const mockChild = testUtils.createMockUser({ role: 'child' });
            const mockReq = testUtils.createMockRequest({ 
                user: mockChild,
                body: { role: 'parent' }
            });
            const mockRes = testUtils.createMockResponse();

            await editUserProfile(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden: You cannot change role nor email' });
        });

        it('should return 404 if user not found', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent,
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await editUserProfile(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 400 if name already exists', async () => {
            const mockUserData = testUtils.createMockUser();
            const existingUser = testUtils.createMockUser({ name: 'Existing Name' });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOne.mockResolvedValue(existingUser as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    name: 'Existing Name'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await editUserProfile(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'A user with the same email and name already exists.' 
            });
        });
    });

    // 5. test deleteUser API
    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockFamilyData = testUtils.createMockFamily({ 
                members: [{ _id: '507f1f77bcf86cd799439011', role: 'child', name: 'Test', gender: 'male', avatar: '/avatar.png' }]
            });

            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockUser.countDocuments.mockResolvedValue(2); // More than 1 parent
            mockUser.findByIdAndDelete.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteUser(mockReq as any, mockRes as any);

            expect(mockUser.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await deleteUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 400 if trying to delete last parent', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const mockFamilyData = testUtils.createMockFamily();

            mockUser.findById.mockResolvedValue(mockParent as any);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockUser.countDocuments.mockResolvedValue(1); // Only 1 parent

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent,
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Cannot delete the last parent in the family' 
            });
        });
    });

    // 6. test updatePassword API
    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            
            (mockBcrypt.compare as jest.Mock)
                .mockResolvedValueOnce(true)   // Old password matches
                .mockResolvedValueOnce(false); // New password is different

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    oldPassword: 'oldPass123!',
                    newPassword: 'NewPass123!',
                    confirmPassword: 'NewPass123!'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updatePassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Password updated successfully.",
                password: 'NewPass123!'
            });
        });

        it('should return 400 if old password incorrect', async () => {
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    oldPassword: 'wrongPass',
                    newPassword: 'NewPass123!',
                    confirmPassword: 'NewPass123!'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updatePassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Old password is incorrect.' });
        });

        it('should return 400 if new password same as old', async () => {
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    oldPassword: 'samePass123!',
                    newPassword: 'samePass123!',
                    confirmPassword: 'samePass123!'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updatePassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'New password cannot be the same as the old password.' 
            });
        });

        it('should return 400 if password does not meet requirements', async () => {
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            
            (mockBcrypt.compare as jest.Mock)
                .mockResolvedValueOnce(true)   // Old password matches
                .mockResolvedValueOnce(false); // New password is different

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    userId: '507f1f77bcf86cd799439011',
                    oldPassword: 'oldPass123!',
                    newPassword: 'weak', // Weak password
                    confirmPassword: 'weak'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updatePassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.' 
            });
        });
    });

    // 7. test getUserStars API
    describe('getUserStars', () => {
        it('should get user stars successfully', async () => {
            const mockUserData = testUtils.createMockUser({ stars: 150 });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Stars retrieved successfully",
                stars: 150
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 8. test updateUserStars API
    describe('updateUserStars', () => {
        it('should update user stars successfully', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100, 
                familyId: '507f1f77bcf86cd799439012' 
            });
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockUserData.stars).toBe(150); // 100 + 50
            expect(mockFamily.findByIdAndUpdate).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439012',
                { $inc: { totalStars: 50 } }
            );
            expect(mockRecalculateFamilyMemberRanks.recalculateFamilyMemberRanks).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439012',
                mockUserData
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "User stars updated successfully",
                user: mockUserData
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 400 if stars is undefined', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: {} // No stars field
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Stars must be a valid number.' });
        });

        it('should return 400 if stars is not a number', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 'invalid' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Stars must be a valid number.' });
        });

        it('should return 400 if stars is negative', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: -10 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Stars must be a valid number.' });
        });

        it('should return 400 if user has no family id', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100,
                familyId: null // No family ID
            });
            
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockUserData.stars).toBe(150); // Stars still get added
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'No family id' });
        });

        it('should handle zero stars correctly', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100, 
                familyId: '507f1f77bcf86cd799439012' 
            });
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 0 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockUserData.stars).toBe(100); // 100 + 0 = 100
            expect(mockFamily.findByIdAndUpdate).toHaveBeenCalledWith(
                '507f1f77bcf86cd799439012',
                { $inc: { totalStars: 0 } }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle database error gracefully', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100, 
                familyId: '507f1f77bcf86cd799439012' 
            });
            // Mock save to throw an error
            mockUserData.save = jest.fn().mockRejectedValue(new Error('Database error'));

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error updating user stars' });
        });

        it('should handle family update error gracefully', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100, 
                familyId: '507f1f77bcf86cd799439012' 
            });
            // Mock family update to throw an error
            mockFamily.findByIdAndUpdate.mockRejectedValue(new Error('Family update failed'));

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error updating user stars' });
        });

        it('should handle rank recalculation error gracefully', async () => {
            const mockUserData = testUtils.createMockUser({ 
                stars: 100, 
                familyId: '507f1f77bcf86cd799439012' 
            });
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);
            // Mock rank recalculation to throw an error
            mockRecalculateFamilyMemberRanks.recalculateFamilyMemberRanks.mockRejectedValue(
                new Error('Rank calculation failed')
            );

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { stars: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error updating user stars' });
        });
    });

    // 9. test getUserCoins API
    describe('getUserCoins', () => {
        it('should get user coins successfully', async () => {
            const mockUserData = testUtils.createMockUser({ coins: 200 });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserCoins(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Coins retrieved successfully",
                coins: 200
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserCoins(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 10. test updateUserCoins API
    describe('updateUserCoins', () => {
        it('should update user coins successfully', async () => {
            const mockUserData = testUtils.createMockUser({ coins: 100 });
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { coins: 50 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserCoins(mockReq as any, mockRes as any);

            expect(mockUserData.coins).toBe(150);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "User coins updated successfully",
                user: mockUserData
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await updateUserCoins(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 400 if coins is invalid', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { coins: 'invalid' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserCoins(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Stars must be a valid number.' });
        });
    });

    // 11. test getLocation API
    describe('getLocation', () => {
        it('should get user location successfully', async () => {
            const mockUserData = testUtils.createMockUser({ currentLocation: 'New York' });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getLocation(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Location retrieved successfully",
                location: 'New York'
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getLocation(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 12. test updateLocation API
    describe('updateLocation', () => {
        it('should update user location successfully', async () => {
            const mockUserData = testUtils.createMockUser({ currentLocation: 'Old Location' });
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { currentLocation: 'New Location' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateLocation(mockReq as any, mockRes as any);

            expect(mockUserData.currentLocation).toBe('New Location');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "User location updated successfully",
                user: mockUserData
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await updateLocation(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 400 if location is invalid', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { currentLocation: '' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateLocation(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Location must be valid.' });
        });

        it('should return 400 if location is not string', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { currentLocation: 123 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateLocation(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Location must be valid.' });
        });
    });

    // 13. test getUserRank API
    describe('getUserRank', () => {
        it('should get user rank successfully', async () => {
            const mockUserData = testUtils.createMockUser({ rankInFamily: 3 });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserRank(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Rank retrieved successfully",
                Rank: 3
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserRank(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 14. test getUserInterests API
    describe('getUserInterests', () => {
        it('should get user interests successfully', async () => {
            const mockUserData = testUtils.createMockUser({ interests: ['reading', 'sports'] });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserInterests(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Interests retrieved successfully",
                Interests: ['reading', 'sports']
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserInterests(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 15. test startAdventure API
    describe('startAdventure', () => {
        it('should start adventure successfully', async () => {
            const mockUserData = testUtils.createMockUser({ adventures: [] });
            const mockAdventureData = testUtils.createMockAdventure();
            
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await startAdventure(mockReq as any, mockRes as any);

            expect(mockAdventure.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439015');
            expect(mockUserData.adventures).toHaveLength(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Adventure started successfully",
                user: mockUserData
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await startAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if adventure not found', async () => {
            const mockUserData = testUtils.createMockUser({ adventures: [] });
            mockAdventure.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await startAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Adventure not found' });
        });

        it('should return 400 if adventure already started', async () => {
            const existingAdventure = {
                adventureId: { equals: jest.fn().mockReturnValue(true) },
                challenges: [],
                status: 'in-progress',
                isAdventureCompleted: false,
                starsReward: 100,
                coinsReward: 50,
                progress: 0
            };
            const mockUserData = testUtils.createMockUser({ adventures: [existingAdventure] });
            const mockAdventureData = testUtils.createMockAdventure();
            
            mockAdventure.findById.mockResolvedValue(mockAdventureData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { adventureId: '507f1f77bcf86cd799439015' }
            });
            const mockRes = testUtils.createMockResponse();

            await startAdventure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Adventure already started' });
        });
    });

    // 16. test completeChallenge API
    describe('completeChallenge', () => {
        it('should complete challenge successfully', async () => {
            const mockChallenge = {
                challengeId: { equals: jest.fn().mockReturnValue(true) },
                isCompleted: false,
                completedAt: undefined
            };
            const mockAdventureProgress = {
                adventureId: { equals: jest.fn().mockReturnValue(true) },
                challenges: [mockChallenge], 
                progress: 0,
                isAdventureCompleted: false,
                status: 'in-progress',
                starsReward: 100, 
                coinsReward: 50  
            };
            const mockUserData = testUtils.createMockUser({ 
                adventures: [mockAdventureProgress],
                stars: 100,
                coins: 100,
                familyId: '507f1f77bcf86cd799439012'
            });
            
            const mockAdventureData = {
                challenges: [{
                    _id: { equals: jest.fn().mockReturnValue(true) },
                    starsReward: 25,
                    coinsReward: 15
                }]
            };
            
            mockAdventure.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockAdventureData)
            } as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    adventureId: '507f1f77bcf86cd799439015',
                    challengeId: '507f1f77bcf86cd799439016'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockChallenge.isCompleted).toBe(true);
            expect(mockChallenge.completedAt).toBeDefined();
            
            expect(mockUserData.stars).toBe(225);
            expect(mockUserData.coins).toBe(165);
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should complete challenge without adventure completion bonus', async () => {
            const mockChallenge1 = {
                challengeId: { equals: jest.fn().mockReturnValue(true) },
                isCompleted: false,
                completedAt: undefined
            };
            const mockChallenge2 = {
                challengeId: { equals: jest.fn().mockReturnValue(false) },
                isCompleted: false,
                completedAt: undefined
            };
            const mockAdventureProgress = {
                adventureId: { equals: jest.fn().mockReturnValue(true) },
                challenges: [mockChallenge1, mockChallenge2], 
                progress: 0,
                isAdventureCompleted: false,
                status: 'in-progress',
                starsReward: 100,
                coinsReward: 50
            };
            const mockUserData = testUtils.createMockUser({ 
                adventures: [mockAdventureProgress],
                stars: 100,
                coins: 100,
                familyId: '507f1f77bcf86cd799439012'
            });
            
            const mockAdventureData = {
                challenges: [{
                    _id: { equals: jest.fn().mockReturnValue(true) },
                    starsReward: 25,
                    coinsReward: 15
                }]
            };
            
            mockAdventure.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockAdventureData)
            } as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    adventureId: '507f1f77bcf86cd799439015',
                    challengeId: '507f1f77bcf86cd799439016'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockChallenge1.isCompleted).toBe(true);
            expect(mockAdventureProgress.progress).toBe(50); 
            expect(mockAdventureProgress.isAdventureCompleted).toBe(false);
            
            expect(mockUserData.stars).toBe(125);
            expect(mockUserData.coins).toBe(115);
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if adventure not found in user profile', async () => {
            const mockUserData = testUtils.createMockUser({ adventures: [] });

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    adventureId: '507f1f77bcf86cd799439015',
                    challengeId: '507f1f77bcf86cd799439016'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Adventure not found in user's profile" });
        });

        it('should return 404 if challenge not found in adventure', async () => {
            const mockAdventureProgress = {
                adventureId: { equals: jest.fn().mockReturnValue(true) },
                challenges: [], // No challenges
                progress: 0,
                isAdventureCompleted: false,
                status: 'in-progress',
                starsReward: 100,
                coinsReward: 50
            };
            const mockUserData = testUtils.createMockUser({ adventures: [mockAdventureProgress] });

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    adventureId: '507f1f77bcf86cd799439015',
                    challengeId: '507f1f77bcf86cd799439016'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Challenge not found in adventure' });
        });

        it('should return 404 if adventure data not found', async () => {
            const mockChallenge = {
                challengeId: { equals: jest.fn().mockReturnValue(true) },
                isCompleted: false
            };
            const mockAdventureProgress = {
                adventureId: { equals: jest.fn().mockReturnValue(true) },
                challenges: [mockChallenge],
                progress: 0
            };
            const mockUserData = testUtils.createMockUser({ adventures: [mockAdventureProgress] });
            
            mockAdventure.findById.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { 
                    adventureId: '507f1f77bcf86cd799439015',
                    challengeId: '507f1f77bcf86cd799439016'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeChallenge(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Adventure not found' });
        });
    });

    // 17. test getUserAdventures API
    describe('getUserAdventures', () => {
        it('should get user adventures successfully', async () => {
            const mockAdventures = [
                { adventureId: '507f1f77bcf86cd799439015', status: 'in-progress' }
            ];
            const mockUserData = testUtils.createMockUser({ adventures: mockAdventures });
            const mockReq = testUtils.createMockRequest({ user: mockUserData });
            const mockRes = testUtils.createMockResponse();

            await getUserAdventures(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "User adventures retrieved successfully",
                Adventure: mockAdventures
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserAdventures(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 18. test getUserPurchasedItems API
    describe('getUserPurchasedItems', () => {
        it('should get user purchased items successfully', async () => {
            const mockPurchasedItems = [
                { itemId: '507f1f77bcf86cd799439020' },
                { itemId: '507f1f77bcf86cd799439021' }
            ];
            const mockUserData = {
                purchasedItems: mockPurchasedItems
            };
            const mockUserDoc = {
                select: jest.fn().mockResolvedValue(mockUserData)
            };
            mockUser.findById.mockReturnValue(mockUserDoc as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserPurchasedItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Purchased items retrieved successfully",
                purchasedItems: ['507f1f77bcf86cd799439020', '507f1f77bcf86cd799439021']
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserPurchasedItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 if trying to access other user items', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ _id: 'different-user-id' }),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserPurchasedItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('should return 404 if user not found', async () => {
            const mockUserDoc = {
                select: jest.fn().mockResolvedValue(null)
            };
            mockUser.findById.mockReturnValue(mockUserDoc as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser(),
                body: { userId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getUserPurchasedItems(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });
    });

    describe('getUserAvatar', () => {
        it('should get user avatar successfully', async () => {
            const mockUserData = testUtils.createMockUser({ 
                avatar: '/avatars/child-boy-1.png' 
            });
            
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData
            });
            const mockRes = testUtils.createMockResponse();

            await getUserAvatar(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Avatar retrieved successfully",
                avatar: '/avatars/child-boy-1.png'
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getUserAvatar(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: "Unauthorized" 
            });
        });

        it('should handle different avatar formats correctly', async () => {
            const testCases = [
                { avatar: '/avatars/parent-woman.png', description: 'parent avatar' },
                { avatar: '/avatars/child-girl-2.png', description: 'child avatar' },
                { avatar: 'https://example.com/avatar.jpg', description: 'external URL' },
                { avatar: '/default-avatar.svg', description: 'default avatar' },
                { avatar: '', description: 'empty string' },
                { avatar: null, description: 'null avatar' },
                { avatar: undefined, description: 'undefined avatar' }
            ];

            for (const { avatar, description } of testCases) {
                const mockUserData = testUtils.createMockUser({ avatar });
                const mockReq = testUtils.createMockRequest({ user: mockUserData });
                const mockRes = testUtils.createMockResponse();

                await getUserAvatar(mockReq as any, mockRes as any);

                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: "Avatar retrieved successfully",
                    avatar: avatar
                });
            }
        });

        it('should handle server errors gracefully', async () => {
            // Create a normal user object first
            const mockUserData = testUtils.createMockUser();
            
            // Then override the avatar property with a getter that throws
            Object.defineProperty(mockUserData, 'avatar', {
                get() {
                    throw new Error('Database connection failed');
                },
                configurable: true
            });
            
            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData 
            });
            const mockRes = testUtils.createMockResponse();

            await getUserAvatar(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: "Error fetching avatar" 
            });
        });


        it('should handle user with all avatar edge cases', async () => {
            // Test various edge cases for avatar property
            const edgeCases = [
                { avatar: 0, description: 'number zero' },
                { avatar: false, description: 'boolean false' },
                { avatar: [], description: 'empty array' },
                { avatar: {}, description: 'empty object' },
                { avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', description: 'base64 image' }
            ];

            for (const { avatar, description } of edgeCases) {
                const mockUserData = testUtils.createMockUser({ avatar });
                const mockReq = testUtils.createMockRequest({ user: mockUserData });
                const mockRes = testUtils.createMockResponse();

                await getUserAvatar(mockReq as any, mockRes as any);

                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: "Avatar retrieved successfully",
                    avatar: avatar
                });
            }
        });

        it('should handle user object without avatar property', async () => {
            // Create user without avatar property
            const userWithoutAvatar = testUtils.createMockUser();
            delete (userWithoutAvatar as any).avatar;
            
            const mockReq = testUtils.createMockRequest({ 
                user: userWithoutAvatar 
            });
            const mockRes = testUtils.createMockResponse();

            await getUserAvatar(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Avatar retrieved successfully",
                avatar: undefined
            });
        });

        it('should work with minimal user object', async () => {
            // Test with very basic user object
            const minimalUser = {
                _id: '507f1f77bcf86cd799439011',
                avatar: '/simple-avatar.png'
            };
            
            const mockReq = testUtils.createMockRequest({ 
                user: minimalUser 
            });
            const mockRes = testUtils.createMockResponse();

            await getUserAvatar(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Avatar retrieved successfully",
                avatar: '/simple-avatar.png'
            });
        });
    });
});