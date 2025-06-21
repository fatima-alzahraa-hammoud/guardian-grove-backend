import { testUtils } from '../setup';
import {
    createGoal, getGoals, getGoalById, updateUserGoal, deleteGoal,
    createUserTask, getTaskById, updateTask, deleteTask, completeTask,
    getMonthlyStats
} from '../../src/controllers/goal.controller';
import { User } from '../../src/models/user.model';
import { Family } from '../../src/models/family.model';
import { Achievement } from '../../src/models/achievements.model';
import * as checkId from '../../src/utils/checkId';
import * as recalculateFamilyMemberRanks from '../../src/utils/recalculateFamilyMemberRanks';
import { startOfMonth, endOfMonth } from 'date-fns';

// Mock all dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/models/achievements.model');
jest.mock('../../src/utils/checkId');
jest.mock('../../src/utils/recalculateFamilyMemberRanks');

const mockUser = User as jest.Mocked<typeof User>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockAchievement = Achievement as jest.Mocked<typeof Achievement>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;
const mockRecalculateFamilyMemberRanks = recalculateFamilyMemberRanks as jest.Mocked<typeof recalculateFamilyMemberRanks>;

describe('Goal Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup model methods
        mockUser.findById = jest.fn();
        mockUser.findOneAndUpdate = jest.fn();
        mockUser.find = jest.fn();
        mockFamily.findById = jest.fn();
        mockFamily.findOneAndUpdate = jest.fn();
        mockFamily.findByIdAndUpdate = jest.fn();
        mockFamily.find = jest.fn();
        mockAchievement.findById = jest.fn();
        
        // Setup utility mocks
        mockCheckId.checkId.mockReturnValue(true);
        jest.spyOn(mockRecalculateFamilyMemberRanks, 'recalculateFamilyMemberRanks').mockResolvedValue(undefined);
    });

    // 1. test createoal API
    describe('createGoal', () => {
        const validGoalData = {
            title: 'Test Goal',
            description: 'Test goal description',
            type: 'personal',
            userId: testUtils.ids.user,
            dueDate: '2024-12-31',
            rewards: { stars: 50, coins: 25 }
        };

        it('should create personal goal successfully', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockUpdatedUser = { ...mockUserData, goals: [expect.any(Object)] };
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOneAndUpdate.mockResolvedValue(mockUpdatedUser as any);

            const mockReq = testUtils.createMockRequest({ body: validGoalData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(testUtils.ids.user);
            expect(mockUser.findOneAndUpdate).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Goal created successfully',
                goal: expect.objectContaining({
                    title: 'Test Goal',
                    description: 'Test goal description',
                    type: 'personal'
                })
            });
        });

        it('should create family goal successfully', async () => {
            const familyGoalData = { ...validGoalData, type: 'family', familyId: testUtils.ids.family };
            const mockFamilyData = testUtils.createMockFamily();
            const mockUpdatedFamily = { ...mockFamilyData, goals: [expect.any(Object)] };
            
            mockFamily.findById.mockResolvedValue(mockFamilyData as any);
            mockFamily.findOneAndUpdate.mockResolvedValue(mockUpdatedFamily as any);

            const mockReq = testUtils.createMockRequest({ body: familyGoalData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockFamily.findById).toHaveBeenCalledWith({ _id: testUtils.ids.family });
            expect(mockFamily.findOneAndUpdate).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should default to personal type if not specified', async () => {
            const goalDataWithoutType = { ...validGoalData };
            delete (goalDataWithoutType as any).type;
            
            const mockUserData = testUtils.createMockUser();
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOneAndUpdate.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: goalDataWithoutType });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Goal created successfully',
                goal: expect.objectContaining({ type: 'personal' })
            });
        });

        it('should return 400 if required fields missing', async () => {
            const incompleteData = { title: 'Test Goal' }; // Missing description

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'All required fields must be filled.' });
        });

        it('should return 404 if user not found for personal goal', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: validGoalData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if family not found for family goal', async () => {
            const familyGoalData = { ...validGoalData, type: 'family', familyId: testUtils.ids.family };
            mockFamily.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: familyGoalData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Family not found' });
        });

        it('should handle achievement rewards', async () => {
            const goalWithAchievement = {
                ...validGoalData,
                rewards: { achievementId: testUtils.ids.achievement }
            };
            
            const mockAchievementData = testUtils.createMockAchievement();
            const mockUserData = testUtils.createMockUser();
            
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOneAndUpdate.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: goalWithAchievement });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockAchievement.findById).toHaveBeenCalledWith(testUtils.ids.achievement);
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('should return 404 if achievement not found', async () => {
            const goalWithAchievement = {
                ...validGoalData,
                rewards: { achievementId: testUtils.ids.achievement }
            };
            
            mockAchievement.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: goalWithAchievement });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Achievement not found.' });
        });
    });

    // 2. test getGoals API
    describe('getGoals', () => {
        it('should get user goals successfully', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [testUtils.createMockGoal()] });
            const mockFamilyData = testUtils.createMockFamily({ goals: [testUtils.createMockGoal({ type: 'family' })] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                body: { userId: testUtils.ids.user }
            });
            const mockRes = testUtils.createMockResponse();

            await getGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving user goals successfully",
                goals: expect.any(Array)
            });
        });

        it('should get all users goals for admin', async () => {
            const mockUsers = [testUtils.createMockUser()];
            const mockFamilies = [testUtils.createMockFamily()];
            
            mockUser.find.mockResolvedValue(mockUsers as any);
            mockFamily.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilies)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'admin' })
            });
            const mockRes = testUtils.createMockResponse();

            await getGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving all users' goals successfully",
                goals: expect.any(Array)
            });
        });

        it('should return 401 for unauthorized admin access', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'child' })
            });
            const mockRes = testUtils.createMockResponse();

            await getGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                body: { userId: testUtils.ids.user }
            });
            const mockRes = testUtils.createMockResponse();

            await getGoals(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });
    });

    // 3. test getGoalById API
    describe('getGoalById', () => {
        it('should get personal goal by ID successfully', async () => {
            const mockGoal = testUtils.createMockGoal();
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { goalId: testUtils.ids.goal }
            });
            const mockRes = testUtils.createMockResponse();

            await getGoalById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Retrieving your goal successfully",
                goal: expect.objectContaining({ _id: testUtils.ids.goal })
            });
        });

        it('should get family goal by ID successfully', async () => {
            const mockGoal = testUtils.createMockGoal({ type: 'family' });
            const mockUserData = testUtils.createMockUser({ goals: [] });
            const mockFamilyData = testUtils.createMockFamily({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockFamilyData)
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { goalId: testUtils.ids.goal }
            });
            const mockRes = testUtils.createMockResponse();

            await getGoalById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ user: null });
            const mockRes = testUtils.createMockResponse();

            await getGoalById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(testUtils.createMockFamily({ goals: [] }))
            } as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: { goalId: testUtils.ids.goal }
            });
            const mockRes = testUtils.createMockResponse();

            await getGoalById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });
    });

    // 4. test updateUserGoal
    describe('updateUserGoal', () => {
        const updateData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            title: 'Updated Goal',
            description: 'Updated description'
        };

        it('should update user goal successfully', async () => {
            const mockGoal = testUtils.createMockGoal();
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: updateData
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserGoal(mockReq as any, mockRes as any);

            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Goal updated",
                goal: expect.any(Object)
            });
        });

        it('should return 401 if user not authorized', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'child' }),
                body: updateData
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: updateData
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: updateData
            });
            const mockRes = testUtils.createMockResponse();

            await updateUserGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });
    });

    // 5. test deleteGoal API
    describe('deleteGoal', () => {
        const deleteData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal
        };

        it('should delete goal successfully', async () => {
            const mockGoal = testUtils.createMockGoal();
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: deleteData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteGoal(mockReq as any, mockRes as any);

            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Goal deleted successfully',
                DeletedGoal: expect.any(Object)
            });
        });

        it('should return 401 if user not authorized', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'child' }),
                body: deleteData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    // 6. test createUserTask API
    describe('createUserTask', () => {
        const taskData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            title: 'Test Task',
            description: 'Test task description',
            rewards: { stars: 10, coins: 5 }
        };

        it('should create task successfully', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await createUserTask(mockReq as any, mockRes as any);

            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Task created successfully',
                Task: expect.objectContaining({
                    title: 'Test Task',
                    description: 'Test task description'
                })
            });
        });

        it('should handle completed goal becoming uncompleted', async () => {
            const mockGoal = testUtils.createMockGoal({ 
                isCompleted: true,
                rewards: { stars: 50, coins: 25 },
                tasks: []
            });
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                stars: 150,
                coins: 75,
                familyId: testUtils.ids.family,
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await createUserTask(mockReq as any, mockRes as any);

            expect(mockGoal.isCompleted).toBe(false);
            expect(mockUserData.stars).toBe(100); // 150 - 50
            expect(mockUserData.coins).toBe(50); // 75 - 25
            expect(mockFamily.findByIdAndUpdate).toHaveBeenCalled();
            expect(mockRecalculateFamilyMemberRanks.recalculateFamilyMemberRanks).toHaveBeenCalled();
        });

        it('should return 400 if required fields missing', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const incompleteData = { 
                userId: testUtils.ids.user,
                goalId: testUtils.ids.goal,
                description: 'Test task description',
                rewards: { stars: 10, coins: 5 }
            };

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await createUserTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'All required fields must be filled.' });
        });
    });
});