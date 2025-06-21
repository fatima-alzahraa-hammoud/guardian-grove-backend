import { testUtils } from '../setup';
import { deleteFamily, getAllFamilies, getFamily, getFamilyMembers, 
    updateFamily, updateFamilyGoal 
} from '../../src/controllers/family.controller';
import { Family } from '../../src/models/family.model';
import { User } from '../../src/models/user.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import * as getTimePeriod from '../../src/utils/getTimePeriod';

// Mock all dependencies
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');
jest.mock('../../src/utils/getTimePeriod');

const mockFamily = Family as jest.Mocked<typeof Family>;
const mockUser = User as jest.Mocked<typeof User>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;
const mockGetTimePeriod = getTimePeriod as jest.Mocked<typeof getTimePeriod>;

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
    });

    // 1. test getAllFamilies API
    describe('getAllFamilies', () => {
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
            mockFamily.find.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest();
            const mockRes = testUtils.createMockResponse();

            await getAllFamilies(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    // 2. test getFamily API
    describe('getFamily', () => {
        it('should return family by ID successfully', async () => {
            const mockFamilyData = testUtils.createMockFamily();
            const mockFamilyDoc = {
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockFamilyData)
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
                    lean: jest.fn().mockResolvedValue(null)
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

    // 3. test getFamilyMembers API
    describe('getFamilyMembers', () => {
        it('should return family members successfully', async () => {
            const mockMemberUser = testUtils.createMockUser({ name: 'John Doe' });
            const mockFamilyData = {
                ...testUtils.createMockFamily(),
                members: [{
                    _id: mockMemberUser,
                    role: 'child',
                    gender: 'male',
                    avatar: '/avatar.png'
                }]
            };
            const mockFamilyDoc = {
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockFamilyData)
                })
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
                            name: 'John Doe',
                            role: 'child',
                            gender: 'male',
                            avatar: '/avatar.png'
                        })
                    ])
                })
            });
        });

        it('should return 404 if family not found', async () => {
            const mockFamilyDoc = {
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            };
            mockFamily.findById.mockReturnValue(mockFamilyDoc as any);

            const mockReq = testUtils.createMockRequest({
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await getFamilyMembers(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

     // 4. test updateFamily API
    describe('updateFamily', () => {
        it('should update family successfully', async () => {
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
                    familyAvatar: '/new-avatar.png'
                }
            });
            const mockRes = testUtils.createMockResponse();

            await updateFamily(mockReq as any, mockRes as any);

            expect(mockFamilyData.familyName).toBe('Updated Family');
            expect(mockFamilyData.email).toBe('updated@test.com');
            expect(mockFamilyData.familyAvatar).toBe('/new-avatar.png');
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
            // The function only checks for name duplicates if familyName is provided
            // and only checks email if email is provided
            mockFamily.findOne.mockResolvedValue(existingFamily as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: {
                    familyId: testUtils.ids.family,
                    familyName: 'Duplicate Family' // Only providing familyName, not email
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
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockUser.deleteMany.mockResolvedValue({} as any);
            mockFamily.findByIdAndDelete.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({
                user: testUtils.createMockUser({ role: 'parent', email: 'parent@test.com' }),
                body: { familyId: '507f1f77bcf86cd799439011' }
            });
            const mockRes = testUtils.createMockResponse();

            await deleteFamily(mockReq as any, mockRes as any);

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
});