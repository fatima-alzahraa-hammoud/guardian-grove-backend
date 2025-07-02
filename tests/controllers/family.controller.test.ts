import { testUtils } from '../setup';
import { completeFamilyTask, createFamilyTasks, deleteFamily, deleteFamilyGoal, deleteFamilyTask, getAllFamilies, getFamily, getFamilyGoals, getFamilyLeaderboard, getFamilyMembers, 
    getFamilyNameNbMembersStars, 
    getFamilyProgressStats, 
    getFamilyTaskById, 
    getLeaderboard, 
    updateAllFamilyMembersStars, 
    updateFamily, updateFamilyGoal, 
    updateFamilyTask
} from '../../src/controllers/family.controller';
import { Family } from '../../src/models/family.model';
import { User } from '../../src/models/user.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as getTimePeriod from '../../src/utils/getTimePeriod';
import { v2 as cloudinary } from 'cloudinary';

// Mock all dependencies
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/getTimePeriod');

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn()
        }
    }
}));

const mockFamily = Family as jest.Mocked<typeof Family>;
const mockUser = User as jest.Mocked<typeof User>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockGetTimePeriod = getTimePeriod as jest.Mocked<typeof getTimePeriod>;
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

describe('Family Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup Family model methods
        mockFamily.find = jest.fn();
        mockFamily.findOne = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findByIdAndDelete = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        mockFamily.countDocuments = jest.fn();

        // Setup User model methods
        mockUser.find = jest.fn();
        mockUser.findById = jest.fn();
        mockUser.updateMany = jest.fn();
        mockUser.deleteMany = jest.fn();
        mockUser.aggregate = jest.fn();

        // Setup Achievement model methods
        mockAchievement.findById = jest.fn();
        mockAchievement.countDocuments = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
        mockGetTimePeriod.getTimePeriod.mockReturnValue({
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        });

        // Setup Cloudinary mock
        mockCloudinary.uploader.upload_stream = jest.fn().mockImplementation((options, callback) => {
            const mockResult = {
                secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/guardian%20grove%20project/family-avatars/test-family-avatar.png',
                public_id: 'guardian grove project/family-avatars/test-family-avatar'
            };
            callback(null, mockResult);
            return {
                end: jest.fn()
            };
        });
    });

    // 1. test getAllFamilies API
    /*describe('getAllFamilies', () => {
        it('should return all families successfully', async () => {
            const mockFamilies = [
                testUtils.createMockFamily({ familyName: 'Smith Family' }),
                testUtils.createMockFamily({ familyName: 'Johnson Family', _id: '507f1f77bcf86cd799439013' })
            ];
            mockFamily.find.mockResolvedValue(mockFamilies as any);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockFamily.find).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Retrieving all families successfully",
                families: mockFamilies
            });
        });

        it('should return 404 if no families found', async () => {
            mockFamily.find.mockResolvedValue([]);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            mockFamily.find.mockRejectedValue(dbError);

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });*/

    // 2. test getFamily API
    describe('getFamily', () => {
        it('should return family by ID successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily();
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockFamilyData)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: "Retrieving family successfully",
                family: mockFamilyData
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return error if invalid ID', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: 'invalid-id' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamily(mockReq as any, mockRes as any);

            expect(mockFamily.findById).not.toHaveBeenCalled();
        });
    });

    // 3. test getFamilyMembers API - Updated for virtual members
    describe('getFamilyMembers', () => {
        it('should return family members successfully', async () => {
            const mockMemberUser = testUtils.createMockUser({ name: 'John Doe' });
            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                members: [mockMemberUser] // Virtual field populated
            };
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyMembers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving family members successfully",
                familyWithMembers: expect.objectContaining({
                    members: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'John Doe'
                        })
                    ])
                })
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(null)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyMembers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        // it('should return 404 if no family members found', async () => {
        //     const mockFamilyData = {
        //         ...testUtils.createMockFamily(),
        //         members: [] // Empty members array
        //     };
        //     const mockFamilyDoc = {
        //         populate: jest.fn().mockResolvedValue(mockFamilyData)
        //     };
        //     mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

        //     const mockReq = testUtils.createMockRequest({
        //         body: { familyId: '507f1f77bcf86cd799439011' }
        //     });
        //     const mockRes = testUtils.createMockResponse();

        //     await getFamilyMembers(mockReq as any, mockRes as any);

        //     expect(mockRes.status).toHaveBeenCalledWith(404);
        // });
    });

    // 4. test updateFamily API - Updated with Cloudinary tests
    describe('updateFamily', () => {
        const mockFiles = {
            familyAvatar: [{
                fieldname: 'familyAvatar',
                originalname: 'test-family-avatar.png',
                mimetype: 'image/png',
                size: 1024,
                buffer: Buffer.from('fake-image-data')
            }]
        };

        it('should update family successfully with file upload', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null); // No duplicate

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    familyName: 'Updated Family',
                    email: 'updated@test.com'
                },
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
            expect(mockFamilyData.familyName).toBe('Updated Family');
            expect(mockFamilyData.email).toBe('updated@test.com');
            expect(mockFamilyData.familyAvatar).toBe('https://res.cloudinary.com/test/image/upload/v1234567890/guardian%20grove%20project/family-avatars/test-family-avatar.png');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should update family successfully with predefined avatar path', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null); // No duplicate

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    familyName: 'Updated Family',
                    email: 'updated@test.com',
                    familyAvatarPath: '/assets/images/avatars/family-avatar-1.png'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockCloudinary.uploader.upload_stream).not.toHaveBeenCalled();
            expect(mockFamilyData.familyName).toBe('Updated Family');
            expect(mockFamilyData.email).toBe('updated@test.com');
            expect(mockFamilyData.familyAvatar).toBe('/assets/images/avatars/family-avatar-1.png');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 for invalid avatar path', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    familyAvatarPath: '/invalid/path/avatar.png' // Invalid path
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid avatar path. Only predefined avatars are allowed.'
            });
        });

        it('should handle cloudinary upload error', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null);

            // Mock cloudinary to throw error
            mockCloudinary.uploader.upload_stream = jest.fn().mockImplementation((options, callback) => {
                callback(new Error('Cloudinary upload failed'), null);
                return { end: jest.fn() };
            });

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    familyName: 'Updated Family'
                },
                files: mockFiles
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it('should update family successfully without file or avatar path changes', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                familyAvatar: '/existing-avatar.png',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null); // No duplicate

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    familyName: 'Updated Family Name Only'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockCloudinary.uploader.upload_stream).not.toHaveBeenCalled();
            expect(mockFamilyData.familyName).toBe('Updated Family Name Only');
            expect(mockFamilyData.familyAvatar).toBe('/existing-avatar.png'); // Unchanged
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user role is child', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'child' })
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if email already exists', async () => {
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com' });
            const existingFamily = testUtils.createMockFamily({ email: 'duplicate@test.com' });
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(existingFamily as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    email: 'duplicate@test.com'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if family name already exists', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                familyName: 'Original Family'
            });
            const existingFamily = testUtils.createMockFamily({ 
                familyName: 'Duplicate Family',
                _id: 'different-family-id' // Different ID to pass the $ne check
            });
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(existingFamily as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: testUtils.ids.family,
                    familyName: 'Duplicate Family'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'A family with the same name already exists.' 
            });
        });

        it('should update user emails when family email changes', async () => {
            const mockFamilyData = testUtils.createMockFamily({ 
                email: 'parent@test.com',
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOne.mockResolvedValue(null);
            mockUser.updateMany.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    email: 'newemail@test.com'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockUser.updateMany).toHaveBeenCalledWith(
                { familyId: '507f1f77bcf86cd799439011' },
                { $set: { email: 'newemail@test.com' } }
            );
        });
    });

    // 5. test deleteFamily API
    describe('deleteFamily', () => {
        it('should delete family successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com' });
            
            // Mock family members for avatar deletion
            const mockFamilyMembers = [
                { _id: 'member1', avatar: '/assets/images/avatars/user-avatar-1.png' },
                { _id: 'member2', avatar: 'https://res.cloudinary.com/test/image/upload/v123/user-avatar.jpg' }
            ];
            
            // Mock User.find with method chaining for select
            const mockUserFind = {
                select: jest.fn().mockResolvedValue(mockFamilyMembers)
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockUser.find.mockReturnValue(mockUserFind as any); // Add this mock
            mockUser.deleteMany.mockResolvedValue({} as any);
            mockFamily.findByIdAndDelete.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            // Verify the User.find was called to get family members
            expect(mockUser.find).toHaveBeenCalledWith({ familyId: '507f1f77bcf86cd799439011' });
            expect(mockUserFind.select).toHaveBeenCalledWith('avatar');
            
            // Verify deleteMany is called after getting family members
            expect(mockUser.deleteMany).toHaveBeenCalledWith({ familyId: '507f1f77bcf86cd799439011' });
            expect(mockFamily.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should delete family successfully with no members', async () => {
            const mockFamilyData = testUtils.createMockFamily({ email: 'parent@test.com' });
            
            // Mock empty family members array
            const mockUserFind = {
                select: jest.fn().mockResolvedValue([])
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockUser.find.mockReturnValue(mockUserFind as any);
            mockUser.deleteMany.mockResolvedValue({} as any);
            mockFamily.findByIdAndDelete.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            expect(mockUser.find).toHaveBeenCalledWith({ familyId: '507f1f77bcf86cd799439011' });
            expect(mockUser.deleteMany).toHaveBeenCalledWith({ familyId: '507f1f77bcf86cd799439011' });
            expect(mockFamily.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });


        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user role unauthorized', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'child' })
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 404 if family not found', async () => {
            mockFamily.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent' }),
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if user email does not match family email', async () => {
            const mockFamilyData = testUtils.createMockFamily({ email: 'different@test.com' });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

// 6. test updateFamilyGoal API
    describe('updateFamilyGoal', () => {
        it('should update family goal successfully', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                title: 'Original Goal',
                description: 'Original Description',
                type: 'weekly',
                dueDate: new Date(),
                rewards: { stars: 10, coins: 5 }
            };
            const mockFamilyData = testUtils.createMockFamily({
                email: 'parent@test.com',
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    title: 'Updated Goal',
                    description: 'Updated Description',
                    rewards: { stars: 20, coins: 10 }
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyGoal(mockReq as any, mockRes as any);

            expect(mockGoal.title).toBe('Updated Goal');
            expect(mockGoal.description).toBe('Updated Description');
            expect(mockGoal.rewards.stars).toBe(20);
            expect(mockGoal.rewards.coins).toBe(10);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 404 if goal not found', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                email: 'parent@test.com',
                goals: []
            });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should update goal with achievement rewards', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                title: 'Original Goal',
                description: 'Original Description',
                type: 'family',
                tasks: [],
                nbOfTasksCompleted: 0,
                isCompleted: false,
                dueDate: new Date('2024-12-31'),
                createdAt: new Date('2024-01-01'),
                completedAt: undefined,
                rewards: { 
                    stars: 10, 
                    coins: 5,
                    achievementName: undefined, // Start as undefined
                    achievementId: undefined
                }
            };
            const mockFamilyData = testUtils.createMockFamily({
                email: 'parent@test.com',
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            const mockAchievementData = testUtils.createMockAchievement({ 
                _id: '507f1f77bcf86cd799439025',
                title: 'Great Achievement' 
            });
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: testUtils.ids.family,
                    goalId: '507f1f77bcf86cd799439020',
                    rewards: {
                        achievementId: '507f1f77bcf86cd799439025'
                    }
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyGoal(mockReq as any, mockRes as any);

            expect(mockGoal.rewards.achievementName).toBe('Great Achievement');
            expect(mockGoal.rewards.achievementId).toBe('507f1f77bcf86cd799439025');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if achievement not found', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                rewards: { stars: 10, coins: 5 }
            };
            const mockFamilyData = testUtils.createMockFamily({
                email: 'parent@test.com',
                goals: [mockGoal]
            });
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    rewards: {
                        achievementId: '507f1f77bcf86cd799439025'
                    }
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

     // 7. test getFamilyGoals API
    describe('getFamilyGoals', () => {
        it('should get family goals successfully', async () => {
            const mockGoals = [
                { title: 'Goal 1', description: 'First goal' },
                { title: 'Goal 2', description: 'Second goal' }
            ];
            const mockFamilyData = testUtils.createMockFamily({ goals: mockGoals });
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Family goals retrieved',
                goals: mockGoals
            });
        });

        it('should return 404 if family not found', async () => {
            mockFamily.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // 8. test deleteFamilyGoal API
    describe('deleteFamilyGoal', () => {
        it('should delete family goal successfully', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                title: 'Goal to delete'
            };
            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamilyData.goals.splice = jest.fn();
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamilyData.goals.findIndex = jest.fn().mockReturnValue(0);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamilyGoal(mockReq as any, mockRes as any);

            expect(mockFamilyData.goals.splice).toHaveBeenCalledWith(0, 1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if goal not found', async () => {
            const mockFamilyData = testUtils.createMockFamily({ goals: [] });
            mockFamilyData.goals.findIndex = jest.fn().mockReturnValue(-1);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamilyGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // 9. test createFamilyTasks API
    describe('createFamilyTasks', () => {
        it('should create family task successfully', async () => {
            const mockPush = jest.fn();
            const mockGoal = {
                _id: { toString: () => testUtils.ids.goal },
                title: 'Test Goal',
                description: 'Test goal description',
                type: 'family',
                tasks: Object.assign([], { push: mockPush }),
                nbOfTasksCompleted: 0,
                isCompleted: false,
                dueDate: new Date('2024-12-31'),
                createdAt: new Date('2024-01-01'),
                completedAt: undefined,
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementName: undefined,
                    achievementId: undefined
                }
            };
            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: testUtils.ids.family,
                    goalId: testUtils.ids.goal,
                    title: 'New Task',
                    description: 'Task description',
                    rewards: { stars: 5, coins: 3 }
                }
            });
            const mockRes = testUtils.createMockResponse();

            await createFamilyTasks(mockReq as any, mockRes as any);

            expect(mockPush).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 if required fields missing', async () => {
            const mockGoal = {
                _id: { toString: () => testUtils.ids.goal },
                title: 'Test Goal',
                description: 'Test goal description',
                type: 'family',
                tasks: [],
                nbOfTasksCompleted: 0,
                isCompleted: false,
                dueDate: new Date('2024-12-31'),
                createdAt: new Date('2024-01-01'),
                completedAt: undefined,
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementName: undefined,
                    achievementId: undefined
                }
            };
            const mockFamilyData = testUtils.createMockFamily({ 
                goals: [mockGoal] 
            });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: testUtils.ids.family,
                    goalId: testUtils.ids.goal,
                    title: '', // Missing title
                    description: 'Task description'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await createFamilyTasks(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'All required fields must be filled.' 
            });
        });

        it('should use default rewards if not provided', async () => {
            const mockPush = jest.fn();
            const mockGoal = {
                _id: { toString: () => testUtils.ids.goal },
                title: 'Test Goal',
                description: 'Test goal description',
                type: 'family',
                tasks: Object.assign([], { push: mockPush }),
                nbOfTasksCompleted: 0,
                isCompleted: false,
                dueDate: new Date('2024-12-31'),
                createdAt: new Date('2024-01-01'),
                completedAt: undefined,
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementName: undefined,
                    achievementId: undefined
                }
            };
            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: testUtils.ids.family,
                    goalId: testUtils.ids.goal,
                    title: 'New Task',
                    description: 'Task description'
                    // No rewards provided
                }
            });
            const mockRes = testUtils.createMockResponse();

            await createFamilyTasks(mockReq as any, mockRes as any);

            const capturedTask = mockPush.mock.calls[0][0];
            expect(capturedTask.rewards).toEqual({ stars: 2, coins: 1 });
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    // 10. test updateFamilyTask API
    describe('updateFamilyTask', () => {
        it('should update family task successfully', async () => {
            const mockTask = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                title: 'Original Task',
                description: 'Original Description',
                rewards: { stars: 5, coins: 3 }
            };
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: [mockTask]
            };
            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockGoal.tasks.find = jest.fn().mockReturnValue(mockTask);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025',
                    title: 'Updated Task',
                    description: 'Updated Description',
                    rewards: { stars: 10, coins: 6 }
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyTask(mockReq as any, mockRes as any);

            expect(mockTask.title).toBe('Updated Task');
            expect(mockTask.description).toBe('Updated Description');
            expect(mockTask.rewards.stars).toBe(10);
            expect(mockTask.rewards.coins).toBe(6);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: []
            };
            const mockFamilyData = testUtils.createMockFamily({ goals: [mockGoal] });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockGoal.tasks.find = jest.fn().mockReturnValue(undefined);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamilyTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // 11. test deleteFamilyTask API
    describe('deleteFamilyTask', () => {
        it('should delete family task successfully', async () => {
            const mockTask = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                title: 'Task to delete'
            };
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: [mockTask]
            };
            const mockFamilyData = testUtils.createMockFamily({
                email: 'parent@test.com',
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockGoal.tasks.findIndex = jest.fn().mockReturnValue(0);
            mockGoal.tasks.splice = jest.fn().mockReturnValue([mockTask]);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamilyTask(mockReq as any, mockRes as any);

            expect(mockGoal.tasks.splice).toHaveBeenCalledWith(0, 1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await deleteFamilyTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user role unauthorized', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'child' })
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamilyTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    // 12. test getFamilyTaskById API
    describe('getFamilyTaskById', () => {
        it('should get family task by ID successfully', async () => {
            const mockTask = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                title: 'Test Task',
                description: 'Test Description'
            };
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: [mockTask]
            };
            const mockFamilyData = testUtils.createMockFamily({ goals: [mockGoal] });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockGoal.tasks.find = jest.fn().mockReturnValue(mockTask);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyTaskById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Retrieve task successfully',
                Task: mockTask
            });
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: []
            };
            const mockFamilyData = testUtils.createMockFamily({ goals: [mockGoal] });
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockGoal.tasks.find = jest.fn().mockReturnValue(undefined);
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyTaskById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // 13. test completeFamilyTask API
    describe('completeFamilyTask', () => {
        it('should complete family task successfully without completing goal', async () => {
            const mockTask1 = {
                _id: { toString: () => testUtils.ids.task },
                title: 'Task 1',
                description: 'First task',
                type: 'family',
                isCompleted: false,
                rewards: { stars: 5, coins: 3 },
                createdAt: new Date('2024-01-15')
            };
            const mockTask2 = {
                _id: { toString: () => '507f1f77bcf86cd799439026' },
                title: 'Task 2',
                description: 'Second task',
                type: 'family',
                isCompleted: false,
                rewards: { stars: 5, coins: 3 },
                createdAt: new Date('2024-01-16')
            };
            
            // Create mock tasks array with proper array methods
            const mockTasks = [mockTask1, mockTask2];
            const mockTasksWithMethods = Object.assign(mockTasks, {
                find: jest.fn().mockReturnValue(mockTask1),
                filter: jest.fn().mockReturnValue([mockTask1]), // Only 1 completed after the task is marked complete
                every: jest.fn().mockReturnValue(false), // Not all completed
                length: 2
            });

            const mockGoal = {
                _id: { toString: () => testUtils.ids.goal },
                title: 'Test Goal',
                description: 'A test goal',
                type: 'family',
                tasks: mockTasksWithMethods,
                nbOfTasksCompleted: 0,
                isCompleted: false,
                progress: 0,
                dueDate: new Date('2024-12-31'),
                createdAt: new Date('2024-01-01'),
                completedAt: undefined,
                rewards: { stars: 50, coins: 25, achievementName: undefined, achievementId: undefined }
            };
            
            // Create mock users that will be populated via virtual field
            const mockUser1 = testUtils.createMockUser({
                _id: testUtils.ids.user,
                coins: 10,
                stars: 20,
                nbOfTasksCompleted: 3,
                save: jest.fn().mockResolvedValue(true)
            });

            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                totalStars: 100,
                stars: { daily: 10, weekly: 20, monthly: 30, yearly: 40 },
                tasks: 5,
                taskCounts: { daily: 1, weekly: 2, monthly: 3, yearly: 4 },
                save: jest.fn().mockResolvedValue(true)
            });

            // Mock the populate method to return family with members
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: [mockUser1] // Virtual field populated with users
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: testUtils.ids.family,
                    goalId: testUtils.ids.goal,
                    taskId: testUtils.ids.task
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeFamilyTask(mockReq as any, mockRes as any);

            expect(mockTask1.isCompleted).toBe(true);
            expect(mockUser1.coins).toBe(13); // 10 + 3
            expect(mockUser1.stars).toBe(25); // 20 + 5
            expect(mockUser1.nbOfTasksCompleted).toBe(4); // 3 + 1
            expect(mockGoal.isCompleted).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should complete family task and goal with achievement', async () => {
            const mockTask1 = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                isCompleted: false,
                rewards: { stars: 5, coins: 3 }
            };
            const mockTask2 = {
                _id: { toString: () => '507f1f77bcf86cd799439026' },
                isCompleted: true,
                rewards: { stars: 5, coins: 3 }
            };
            
            // Create properly typed mock tasks array
            const mockTasks = [mockTask1, mockTask2];
            const mockTasksWithMethods = Object.assign(mockTasks, {
                find: jest.fn().mockReturnValue(mockTask1),
                filter: jest.fn().mockReturnValue([mockTask1, mockTask2]), // Both completed
                every: jest.fn().mockReturnValue(true), // All completed
                length: 2
            });

            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: mockTasksWithMethods,
                progress: 0,
                isCompleted: false,
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementId: '507f1f77bcf86cd799439040'
                }
            };
            
            const mockUser1 = testUtils.createMockUser({
                _id: '507f1f77bcf86cd799439030',
                coins: 10,
                stars: 20,
                nbOfTasksCompleted: 3,
                save: jest.fn().mockResolvedValue(true)
            });

            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal],
                achievements: [],
                totalStars: 100,
                stars: { daily: 10, weekly: 20, monthly: 30, yearly: 40 },
                tasks: 5,
                taskCounts: { daily: 1, weekly: 2, monthly: 3, yearly: 4 },
                save: jest.fn().mockResolvedValue(true)
            });

            const mockAchievementData = testUtils.createMockAchievement({
                _id: '507f1f77bcf86cd799439040',
                title: 'Goal Master'
            });

            // Mock the populate method to return family with members
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: [mockUser1] // Virtual field populated with users
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeFamilyTask(mockReq as any, mockRes as any);

            expect(mockTask1.isCompleted).toBe(true);
            expect(mockGoal.isCompleted).toBe(true);
            expect(mockGoal.progress).toBe(100); // 2/2 * 100
            expect(mockUser1.coins).toBe(38); // 10 + 3 + 25
            expect(mockUser1.stars).toBe(75); // 20 + 5 + 50
            expect(mockFamilyData.achievements).toHaveLength(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if task already completed', async () => {
            const mockTask = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                isCompleted: true
            };
            
            const mockTasks = [mockTask];
            const mockTasksWithMethods = Object.assign(mockTasks, {
                find: jest.fn().mockReturnValue(mockTask),
                filter: jest.fn(),
                every: jest.fn(),
                length: 1
            });

            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: mockTasksWithMethods
            };
            
            const mockFamilyData = testUtils.createMockFamily({ goals: [mockGoal] });
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: []
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeFamilyTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if achievement not found for goal completion', async () => {
            const mockTask = {
                _id: { toString: () => '507f1f77bcf86cd799439025' },
                isCompleted: false,
                rewards: { stars: 5, coins: 3 }
            };
            
            const mockTasks = [mockTask];
            const mockTasksWithMethods = Object.assign(mockTasks, {
                find: jest.fn().mockReturnValue(mockTask),
                filter: jest.fn().mockReturnValue([mockTask]),
                every: jest.fn().mockReturnValue(true), // All completed
                length: 1
            });

            const mockGoal = {
                _id: { toString: () => '507f1f77bcf86cd799439020' },
                tasks: mockTasksWithMethods,
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementId: '507f1f77bcf86cd799439040'
                }
            };
            
            const mockUser1 = testUtils.createMockUser({
                _id: '507f1f77bcf86cd799439030',
                save: jest.fn().mockResolvedValue(true)
            });

            const mockFamilyData = testUtils.createMockFamily({
                goals: [mockGoal]
            });

            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: [mockUser1]
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockFamilyData.goals.find = jest.fn().mockReturnValue(mockGoal);
            mockAchievement.findById.mockResolvedValue(null); // Achievement not found

            const mockReq = testUtils.createMockRequest({
                body: {
                    familyId: '507f1f77bcf86cd799439011',
                    goalId: '507f1f77bcf86cd799439020',
                    taskId: '507f1f77bcf86cd799439025'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await completeFamilyTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    // 14. test getLeaderboard API
    describe('getLeaderboard', () => {
        it('should get leaderboard successfully with family rank', async () => {
            const mockFamilies = [
                { 
                    _id: '507f1f77bcf86cd799439011',
                    familyName: 'Top Family',
                    familyAvatar: '/avatar1.png',
                    get: jest.fn((field) => {
                        if (field === 'stars.daily') return 100;
                        if (field === 'taskCounts.daily') return 10;
                        return 0;
                    })
                },
                { 
                    _id: '507f1f77bcf86cd799439012',
                    familyName: 'Second Family',
                    familyAvatar: '/avatar2.png',
                    get: jest.fn((field) => {
                        if (field === 'stars.daily') return 80;
                        if (field === 'taskCounts.daily') return 8;
                        return 0;
                    })
                }
            ];

            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockFamilies)
                    })
                })
            };
            mockFamily.find.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                query: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Leaderboard fetched successfully',
                dailyTop10: expect.arrayContaining([
                    expect.objectContaining({
                        familyName: 'Top Family',
                        rank: 1,
                        stars: 100,
                        tasks: 10
                    })
                ]),
                dailyFamilyRank: expect.objectContaining({
                    familyName: 'Top Family',
                    rank: 1
                }),
                weeklyTop10: expect.any(Array),
                weeklyFamilyRank: expect.any(Object),
                monthlyTop10: expect.any(Array),
                monthlyFamilyRank: expect.any(Object),
                yearlyTop10: expect.any(Array),
                yearlyFamilyRank: expect.any(Object)
            });
        });

        it('should handle empty leaderboard', async () => {
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue([])
                    })
                })
            };
            mockFamily.find.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                query: {}
            });
            const mockRes = testUtils.createMockResponse();

            await getLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Leaderboard fetched successfully",
                dailyTop10: [],
                weeklyTop10: [],
                monthlyTop10: [],
                yearlyTop10: [],
                dailyFamilyRank: null,
                weeklyFamilyRank: null,
                monthlyFamilyRank: null,
                yearlyFamilyRank: null
            });
        });

        it('should get leaderboard without specific family', async () => {
            const mockFamilies = [
                { 
                    _id: '507f1f77bcf86cd799439011',
                    familyName: 'Family 1',
                    get: jest.fn(() => 50)
                }
            ];

            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockFamilies)
                    })
                })
            };
            mockFamily.find.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                query: {} // No familyId
            });
            const mockRes = testUtils.createMockResponse();

            await getLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            // Should not include family rank fields
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Leaderboard fetched successfully',
                dailyTop10: expect.any(Array),
                weeklyTop10: expect.any(Array),
                monthlyTop10: expect.any(Array),
                yearlyTop10: expect.any(Array)
            });
        });
    });

    // 15. test getFamilyLeaderboard API
    describe('getFamilyLeaderboard', () => {
        it('should get family leaderboard successfully', async () => {
            const mockMembers = [
                {
                    stars: 100,
                    nbOfTasksCompleted: 10,
                    name: 'Top Member',
                    toObject: () => ({
                        stars: 100,
                        nbOfTasksCompleted: 10,
                        name: 'Top Member'
                    })
                },
                {
                    stars: 80,
                    nbOfTasksCompleted: 8,
                    name: 'Second Member',
                    toObject: () => ({
                        stars: 80,
                        nbOfTasksCompleted: 8,
                        name: 'Second Member'
                    })
                }
            ];

            // Mock the family with populated members
            const mockFamilyWithPopulatedMembers = {
                ...testUtils.createMockFamily(),
                members: mockMembers // This is the populated virtual field
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(mockFamilyWithPopulatedMembers)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyLeaderboard(mockReq as any, mockRes as any);

            expect(mockFamilyDoc.populate).toHaveBeenCalledWith({
                path: 'members',
                select: 'name avatar stars nbOfTasksCompleted',
                options: { sort: { stars: -1, nbOfTasksCompleted: -1 } }
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Leaderboard fetched successfully',
                familyLeaderboard: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Top Member',
                        rank: 1
                    }),
                    expect.objectContaining({
                        name: 'Second Member',
                        rank: 2
                    })
                ])
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(null)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if no members found', async () => {
            // Family exists but has no members
            const mockFamilyWithNoMembers = {
                ...testUtils.createMockFamily(),
                members: [] // Empty members array
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(mockFamilyWithNoMembers)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 if members is null', async () => {
            // Family exists but members is null
            const mockFamilyWithNullMembers = {
                ...testUtils.createMockFamily(),
                members: null // Null members
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(mockFamilyWithNullMembers)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            const mockFamilyDoc = {
                populate: jest.fn().mockRejectedValue(dbError)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyLeaderboard(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    // 16. test updateAllFamilyMembersStars API - Updated for virtual members
    describe('updateAllFamilyMembersStars', () => {
        it('should update stars for all family members successfully', async () => {
            const mockUser1 = testUtils.createMockUser({ _id: 'member1' });
            const mockUser2 = testUtils.createMockUser({ _id: 'member2' });
            const mockUser3 = testUtils.createMockUser({ _id: 'member3' });

            // Create the family object that will be returned by populate
            const populatedFamily = {
                ...testUtils.createMockFamily(),
                members: [mockUser1, mockUser2, mockUser3],
                totalStars: 100,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(populatedFamily)
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockUser.updateMany.mockResolvedValue({} as any);
            mockUser.aggregate.mockResolvedValue([{ totalStars: 150 }]);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 10 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockUser.updateMany).toHaveBeenCalledWith(
                { _id: { $in: ['member1', 'member2', 'member3'] } },
                { $inc: { stars: 10 } }
            );
            expect(mockUser.aggregate).toHaveBeenCalledWith([
                { $match: { _id: { $in: ['member1', 'member2', 'member3'] } } },
                { $group: { _id: null, totalStars: { $sum: "$stars" } } }
            ]);
            
            // The controller modifies the populated family object
            expect(populatedFamily.totalStars).toBe(150);
            expect(populatedFamily.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "All family members' stars updated successfully",
                totalStars: 150
            });
        });

        it('should handle case when total stars calculation returns empty array', async () => {
            const mockUser1 = testUtils.createMockUser({ _id: 'member1' });

            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                totalStars: 0,
                save: jest.fn().mockResolvedValue(true)
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: [mockUser1]
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);
            mockUser.updateMany.mockResolvedValue({} as any);
            mockUser.aggregate.mockResolvedValue([]); // Empty array

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 5 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockFamilyData.totalStars).toBe(0);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "All family members' stars updated successfully",
                totalStars: 0
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user has no familyId', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: undefined })
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if stars value is not an integer', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 'invalid' }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if stars value is a float', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 10.5 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(null)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 10 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            const mockFamilyDoc = {
                populate: jest.fn().mockRejectedValue(dbError)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { stars: 10 }
            });
            const mockRes = testUtils.createMockResponse();

            await updateAllFamilyMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    // 17. test getFamilyNameNbMembersStars API - Updated for virtual members
    describe('getFamilyNameNbMembersStars', () => {
        it('should return family name, number of members, and stars successfully', async () => {
            const mockUser1 = testUtils.createMockUser({ _id: 'member1' });
            const mockUser2 = testUtils.createMockUser({ _id: 'member2' });
            const mockUser3 = testUtils.createMockUser({ _id: 'member3' });

            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                familyName: 'Smith Family',
                totalStars: 250
            };
            
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue({
                    ...mockFamilyData,
                    members: [mockUser1, mockUser2, mockUser3] // Virtual field populated
                })
            };

            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' })
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyNameNbMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving family name and number of members successfully",
                familyName: 'Smith Family',
                numberOfMembers: 3,
                stars: 250
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getFamilyNameNbMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user has no familyId', async () => {
            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: undefined })
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyNameNbMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockResolvedValue(null)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' })
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyNameNbMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            const mockFamilyDoc = {
                populate: jest.fn().mockRejectedValue(dbError)
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' })
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyNameNbMembersStars(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    // 18. test getFamilyProgressStats API
    describe('getFamilyProgressStats', () => {
        it('should return family progress stats successfully using user familyId', async () => {
            const mockGoals = [
                {
                    _id: 'goal1',
                    isCompleted: true,
                    createdAt: new Date('2024-01-15'),
                    tasks: [
                        { _id: 'task1', isCompleted: true, createdAt: new Date('2024-01-10') },
                        { _id: 'task2', isCompleted: false, createdAt: new Date('2024-01-12') }
                    ]
                },
                {
                    _id: 'goal2',
                    isCompleted: false,
                    createdAt: new Date('2024-01-20'),
                    tasks: [
                        { _id: 'task3', isCompleted: true, createdAt: new Date('2024-01-18') }
                    ]
                }
            ];

            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                goals: mockGoals,
                achievements: ['achievement1', 'achievement2', 'achievement3']
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.countDocuments.mockResolvedValue(10);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockGetTimePeriod.getTimePeriod).toHaveBeenCalledWith('monthly');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                totalTasks: 3,
                completedTasks: 2,
                totalGoals: 2,
                completedGoals: 1,
                totalAchievements: 10,
                unlockedAchievements: 3
            });
        });

        it('should return family progress stats using provided familyId', async () => {
            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                goals: [],
                achievements: []
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.countDocuments.mockResolvedValue(5);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { 
                    familyId: '507f1f77bcf86cd799439012',
                    timeFrame: 'weekly' 
                }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockFamily.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                totalTasks: 0,
                completedTasks: 0,
                totalGoals: 0,
                completedGoals: 0,
                totalAchievements: 5,
                unlockedAchievements: 0
            });
        });

        it('should filter tasks and goals by time period correctly', async () => {
            const mockGoals = [
                {
                    _id: 'goal1',
                    isCompleted: true,
                    createdAt: new Date('2024-01-15'), // Within period
                    tasks: [
                        { _id: 'task1', isCompleted: true, createdAt: new Date('2024-01-10') }, // Within period
                        { _id: 'task2', isCompleted: false, createdAt: new Date('2023-12-25') } // Outside period
                    ]
                },
                {
                    _id: 'goal2',
                    isCompleted: false,
                    createdAt: new Date('2023-12-20'), // Outside period
                    tasks: [
                        { _id: 'task3', isCompleted: true, createdAt: new Date('2024-01-18') } // Within period
                    ]
                }
            ];

            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                goals: mockGoals,
                achievements: ['achievement1']
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.countDocuments.mockResolvedValue(8);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockRes.json).toHaveBeenCalledWith({
                totalTasks: 2, // Only tasks within the time period
                completedTasks: 2, // Both tasks within period are completed
                totalGoals: 1, // Only goal1 is within the time period
                completedGoals: 1, // goal1 is completed
                totalAchievements: 8,
                unlockedAchievements: 1
            });
        });

        it('should handle tasks without createdAt dates', async () => {
            const mockGoals = [
                {
                    _id: 'goal1',
                    isCompleted: true,
                    createdAt: new Date('2024-01-15'),
                    tasks: [
                        { _id: 'task1', isCompleted: true, createdAt: new Date('2024-01-10') },
                        { _id: 'task2', isCompleted: false, createdAt: null }, // No createdAt
                        { _id: 'task3', isCompleted: true } // No createdAt property
                    ]
                }
            ];

            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                goals: mockGoals,
                achievements: []
            };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockAchievement.countDocuments.mockResolvedValue(0);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockRes.json).toHaveBeenCalledWith({
                totalTasks: 1, // Only task1 has createdAt within period
                completedTasks: 1, // task1 is completed
                totalGoals: 1,
                completedGoals: 1,
                totalAchievements: 0,
                unlockedAchievements: 0
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return error if invalid ID', async () => {
            mockCheckId.checkId.mockReturnValue(false);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { familyId: 'invalid-id', timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockFamily.findById).not.toHaveBeenCalled();
        });

        it('should return 404 if family not found', async () => {
            mockFamily.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            mockFamily.findById.mockRejectedValue(dbError);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ familyId: '507f1f77bcf86cd799439011' }),
                body: { timeFrame: 'monthly' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyProgressStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

});