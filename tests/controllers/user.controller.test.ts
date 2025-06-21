import { testUtils } from '../setup';
import {  getUsers, getUserById, createUser, editUserProfile,
    deleteUser, updatePassword, getUserStars, updateUserStars
} from '../../src/controllers/user.controller';
import { User } from '../../src/models/user.model';
import * as generateSecurePassword from '../../src/utils/generateSecurePassword';
import * as checkId from '../../src/utils/checkId';
import { Adventure } from '../../src/models/adventure.model';
import { Family } from '../../src/models/family.model';
import * as emailService from '../../src/services/email.service';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as bcrypt from 'bcrypt';

// Mock all dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/adventure.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/services/email.service');
jest.mock('../../src/utils/generateSecurePassword');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/checkId');
jest.mock('bcrypt');

const mockUser = User as jest.Mocked<typeof User>;
const mockAdventure = Adventure as jest.Mocked<typeof Adventure>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockGenerateSecurePassword = generateSecurePassword as jest.Mocked<typeof generateSecurePassword>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

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
            avatar: '/avatar.png',
            interests: ['reading', 'sports']
        };

        it('should create user successfully', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com', members: [] });
            const mockCreatedUser = testUtils.createMockUser(validUserData);

            mockUser.findOne.mockResolvedValue(null); // No existing user
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockParent,
                body: validUserData
            });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockUser.create).toHaveBeenCalled();
            expect(mockEmailService.sendMail).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null, body: validUserData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 if user is child', async () => {
            const mockChild = testUtils.createMockUser({ role: 'child' });
            const mockReq = testUtils.createMockRequest({ user: mockChild, body: validUserData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('should return 400 if required fields missing', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const incompleteData = { name: 'Test' }; // Missing required fields

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'All required fields must be filled.' });
        });

        it('should return 409 if username already taken', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' });
            const existingUser = testUtils.createMockUser({ name: 'Test Child', email: 'parent@test.com' });

            mockUser.findOne.mockResolvedValue(existingUser as any);

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: validUserData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'This username is already taken for this email.' });
        });

        it('should return 400 if interests is not array', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, interests: 'not-an-array' };

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Interests must be an array.' });
        });

        it('should return 400 if invalid gender', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, gender: 'invalid' };

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Gender must be either 'male' or 'female'." });
        });

        it('should return 400 if invalid role', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, role: 'invalid' };

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid role.' });
        });

        it('should return 400 if invalid birthday', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            const invalidData = { ...validUserData, birthday: 'invalid-date' };

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid birthday format.' });
        });

        it('should return 404 if family not found', async () => {
            const mockParent = testUtils.createMockUser({ role: 'parent' });
            
            mockUser.findOne.mockResolvedValue(null); // No existing user
            mockFamily.findOne.mockResolvedValue(null); // No family found

            const mockReq = testUtils.createMockRequest({ user: mockParent, body: validUserData });
            const mockRes = testUtils.createMockResponse();

            await createUser(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Family not found.' });
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

    // 7. test updateUserStars API
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
});