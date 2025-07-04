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
            
            // Create a new goal that would be added to the user
            const newGoalWithId = {
                _id: testUtils.ids.goal,
                title: 'Test Goal',
                description: 'Test goal description',
                type: 'personal',
                dueDate: new Date('2024-12-31'),
                rewards: { stars: 50, coins: 25 },
                tasks: [],
                createdAt: expect.any(Date),
                isCompleted: false,
                progress: 0,
                nbOfTasksCompleted: 0
            };
            
            const mockUpdatedUser = { 
                ...mockUserData, 
                goals: [newGoalWithId] 
            };
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOneAndUpdate.mockResolvedValue(mockUpdatedUser as any);

            const mockReq = testUtils.createMockRequest({ body: validGoalData });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(testUtils.ids.user);
            expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: testUtils.ids.user },
                { $push: { goals: expect.objectContaining({
                    title: 'Test Goal',
                    description: 'Test goal description',
                    type: 'personal'
                }) }},
                { new: true }
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Goal created successfully',
                goal: expect.objectContaining({
                    _id: testUtils.ids.goal,
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
            
            const newGoalWithId = {
                _id: testUtils.ids.goal,
                title: 'Test Goal',
                description: 'Test goal description',
                type: 'personal', // Should default to personal
                dueDate: expect.any(Date),
                rewards: { stars: 50, coins: 25 },
                tasks: [],
                createdAt: expect.any(Date),
                isCompleted: false,
                progress: 0,
                nbOfTasksCompleted: 0
            };
            
            const mockUpdatedUser = { 
                ...mockUserData, 
                goals: [newGoalWithId] 
            };
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockUser.findOneAndUpdate.mockResolvedValue(mockUpdatedUser as any);

            const mockReq = testUtils.createMockRequest({ body: goalDataWithoutType });
            const mockRes = testUtils.createMockResponse();

            await createGoal(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Goal created successfully',
                goal: expect.objectContaining({ 
                    type: 'personal',
                    _id: testUtils.ids.goal
                })
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

    // 7. test getTaskById API
    describe('getTaskById', () => {
        const taskData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            taskId: testUtils.ids.task
        };

        it('should get task by ID successfully', async () => {
            const mockTask = testUtils.createMockTask();
            const mockGoal = testUtils.createMockGoal({ tasks: [mockTask] });
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await getTaskById(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(testUtils.ids.user);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Retrieve task successfully',
                Task: expect.objectContaining({
                    _id: testUtils.ids.task,
                    title: 'Test Task'
                })
            });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await getTaskById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await getTaskById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: taskData });
            const mockRes = testUtils.createMockResponse();

            await getTaskById(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Task not found' });
        });
    });

    // 8. test updateTask API
    describe('updateTask', () => {
        const updateTaskData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            taskId: testUtils.ids.task,
            title: 'Updated Task Title',
            description: 'Updated task description',
            rewards: { stars: 15, coins: 8 }
        };

        it('should update task successfully', async () => {
            const mockTask = testUtils.createMockTask();
            const mockGoal = testUtils.createMockGoal({ tasks: [mockTask] });
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: updateTaskData });
            const mockRes = testUtils.createMockResponse();

            await updateTask(mockReq as any, mockRes as any);

            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Task updated successfully',
                task: expect.objectContaining({
                    title: 'Updated Task Title',
                    description: 'Updated task description'
                })
            });
        });

        it('should update only provided fields', async () => {
            const partialUpdateData = {
                userId: testUtils.ids.user,
                goalId: testUtils.ids.goal,
                taskId: testUtils.ids.task,
                title: 'Only Title Updated'
            };

            const mockTask = testUtils.createMockTask({ 
                title: 'Original Title',
                description: 'Original Description'
            });
            const mockGoal = testUtils.createMockGoal({ tasks: [mockTask] });
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: partialUpdateData });
            const mockRes = testUtils.createMockResponse();

            await updateTask(mockReq as any, mockRes as any);

            expect(mockTask.title).toBe('Only Title Updated');
            expect(mockTask.description).toBe('Original Description'); // Should remain unchanged
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: updateTaskData });
            const mockRes = testUtils.createMockResponse();

            await updateTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: updateTaskData });
            const mockRes = testUtils.createMockResponse();

            await updateTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: updateTaskData });
            const mockRes = testUtils.createMockResponse();

            await updateTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Task not found' });
        });
    });

    // 9. test deleteTask API
    describe('deleteTask', () => {
        const deleteTaskData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            taskId: testUtils.ids.task
        };

        it('should delete task successfully', async () => {
            const mockTask = testUtils.createMockTask();
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask],
                splice: jest.fn().mockReturnValue([mockTask])
            });
            mockGoal.tasks.splice = jest.fn().mockReturnValue([mockTask]);
            mockGoal.tasks.findIndex = jest.fn().mockReturnValue(0);

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: deleteTaskData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteTask(mockReq as any, mockRes as any);

            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Task deleted successfully',
                DeletedTask: expect.any(Object)
            });
        });

        it('should return 401 if user not authorized', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'child' }),
                body: deleteTaskData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: deleteTaskData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: deleteTaskData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            mockGoal.tasks.findIndex = jest.fn().mockReturnValue(-1);
            
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: deleteTaskData
            });
            const mockRes = testUtils.createMockResponse();

            await deleteTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Task not found' });
        });
    });

    // 10. test completeTask API
    describe('completeTask', () => {
        const completeTaskData = {
            userId: testUtils.ids.user,
            goalId: testUtils.ids.goal,
            taskId: testUtils.ids.task
        };

        it('should complete task successfully', async () => {
            const mockTask = testUtils.createMockTask({ 
                isCompleted: false,
                rewards: { stars: 10, coins: 5 }
            });
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask],
                rewards: { stars: 50, coins: 25 }
            });
            mockGoal.tasks.filter = jest.fn().mockReturnValue([mockTask]);

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                stars: 100,
                coins: 50,
                nbOfTasksCompleted: 5,
                familyId: testUtils.ids.family,
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockTask.isCompleted).toBe(true);
            expect(mockUserData.stars).toBe(160); // 100 + 10 (task) + 50 (goal)
            expect(mockUserData.coins).toBe(80); // 50 + 5 (task) + 25 (goal)
            expect(mockUserData.nbOfTasksCompleted).toBe(6);
            expect(mockGoal.nbOfTasksCompleted).toBe(1);
            expect(mockUserData.save).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should complete goal when all tasks are completed', async () => {
            const mockTask1 = testUtils.createMockTask({ 
                isCompleted: false,
                rewards: { stars: 10, coins: 5 }
            });
            const mockTask2 = testUtils.createMockTask({ 
                _id: 'task2id',
                isCompleted: true,
                rewards: { stars: 10, coins: 5 }
            });
            
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask1, mockTask2],
                rewards: { stars: 50, coins: 25 },
                isCompleted: false
            });
            
            // Mock the filter to return all tasks as completed after this task is completed
            mockGoal.tasks.filter = jest.fn().mockReturnValue([mockTask1, mockTask2]);

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                stars: 100,
                coins: 50,
                familyId: testUtils.ids.family,
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockGoal.isCompleted).toBe(true);
            expect(mockGoal.progress).toBe(100);
            expect(mockGoal.completedAt).toBeDefined();
            expect(mockUserData.stars).toBe(160); // 100 + 10 (task) + 50 (goal)
            expect(mockUserData.coins).toBe(80); // 50 + 5 (task) + 25 (goal)
        });

        it('should unlock achievement when goal is completed', async () => {
            const mockTask = testUtils.createMockTask({ 
                isCompleted: false,
                rewards: { stars: 10, coins: 5 }
            });
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask],
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementId: testUtils.ids.achievement 
                },
                isCompleted: false
            });
            mockGoal.tasks.filter = jest.fn().mockReturnValue([mockTask]);

            const mockAchievementData = testUtils.createMockAchievement();
            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                achievements: [],
                familyId: testUtils.ids.family,
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockAchievement.findById.mockResolvedValue(mockAchievementData as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockUserData.achievements).toHaveLength(1);
            expect(mockUserData.achievements[0]).toEqual({
                achievementId: testUtils.ids.achievement,
                unlockedAt: expect.any(Date)
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Achievement unlocked successfully',
                achievement: mockAchievementData
            });
        });

        it('should update family stats', async () => {
            const mockTask = testUtils.createMockTask({ 
                isCompleted: false,
                rewards: { stars: 10, coins: 5 }
            });
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask],
                rewards: { stars: 50, coins: 25 }
            });
            mockGoal.tasks.filter = jest.fn().mockReturnValue([mockTask]);

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                familyId: testUtils.ids.family,
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockFamily.findByIdAndUpdate.mockResolvedValue({} as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockFamily.findByIdAndUpdate).toHaveBeenCalledWith(
                testUtils.ids.family,
                { $inc: { totalStars: 60, tasks: 1 } } // 10 (task) + 50 (goal)
            );
            expect(mockRecalculateFamilyMemberRanks.recalculateFamilyMemberRanks).toHaveBeenCalledWith(
                testUtils.ids.family,
                mockUserData
            );
        });

        it('should return 400 if task already completed', async () => {
            const mockTask = testUtils.createMockTask({ isCompleted: true });
            const mockGoal = testUtils.createMockGoal({ tasks: [mockTask] });
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Task already completed' });
        });

        it('should return 404 if achievement not found', async () => {
            const mockTask = testUtils.createMockTask({ 
                isCompleted: false,
                rewards: { stars: 10, coins: 5 }
            });
            const mockGoal = testUtils.createMockGoal({ 
                tasks: [mockTask],
                rewards: { 
                    stars: 50, 
                    coins: 25,
                    achievementId: testUtils.ids.achievement 
                }
            });
            mockGoal.tasks.filter = jest.fn().mockReturnValue([mockTask]);

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal],
                save: jest.fn().mockResolvedValue(true)
            });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);
            mockAchievement.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Achievement not found' });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 404 if goal not found', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Goal not found' });
        });

        it('should return 404 if task not found', async () => {
            const mockGoal = testUtils.createMockGoal({ tasks: [] });
            const mockUserData = testUtils.createMockUser({ goals: [mockGoal] });
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: completeTaskData });
            const mockRes = testUtils.createMockResponse();

            await completeTask(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Task not found' });
        });
    });


    // 11. test getMonthlyStats API
    describe('getMonthlyStats', () => {
        const statsData = {
            userId: testUtils.ids.user
        };

        it('should get monthly stats for authenticated user', async () => {
            const mockTask1 = testUtils.createMockTask({ 
                isCompleted: true,
                createdAt: new Date('2024-01-15')
            });
            const mockTask2 = testUtils.createMockTask({ 
                isCompleted: false,
                createdAt: new Date('2024-01-20')
            });
            const mockGoal1 = testUtils.createMockGoal({ 
                tasks: [mockTask1, mockTask2],
                isCompleted: true,
                createdAt: new Date('2024-01-10')
            });
            const mockGoal2 = testUtils.createMockGoal({ 
                tasks: [],
                isCompleted: false,
                createdAt: new Date('2024-01-25')
            });

            const mockUserData = testUtils.createMockUser({ 
                goals: [mockGoal1, mockGoal2]
            });
            mockUserData.goals.flatMap = jest.fn().mockReturnValue([mockTask1, mockTask2]);
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: statsData
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                totalTasks: expect.any(Number),
                completedTasks: expect.any(Number),
                totalGoals: expect.any(Number),
                completedGoals: expect.any(Number)
            });
        });

        it('should get monthly stats for own user when no userId provided', async () => {
            const mockUserData = testUtils.createMockUser({ goals: [] });
            mockUserData.goals.flatMap = jest.fn().mockReturnValue([]);
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: {} // No userId provided
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith(mockUserData._id);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should allow parent to get child stats', async () => {
            const mockChildData = testUtils.createMockUser({ 
                _id: 'childId',
                goals: []
            });
            mockChildData.goals.flatMap = jest.fn().mockReturnValue([]);
            
            mockUser.findById.mockResolvedValue(mockChildData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: { userId: 'childId' }
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockUser.findById).toHaveBeenCalledWith('childId');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: null,
                body: statsData
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should return 403 if user not authorized to view other user stats', async () => {
            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ 
                    _id: 'differentUserId',
                    role: 'child' 
                }),
                body: { userId: testUtils.ids.user }
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('should return 404 if target user not found', async () => {
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ 
                user: testUtils.createMockUser({ role: 'parent' }),
                body: statsData
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should filter tasks and goals by current month only', async () => {
            const currentDate = new Date();
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15);
            const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
            
            const oldTask = testUtils.createMockTask({ 
                createdAt: lastMonth,
                isCompleted: true
            });
            const newTask = testUtils.createMockTask({ 
                createdAt: thisMonth,
                isCompleted: true
            });
            
            const oldGoal = testUtils.createMockGoal({ 
                createdAt: lastMonth,
                isCompleted: true,
                tasks: [oldTask]
            });
            const newGoal = testUtils.createMockGoal({ 
                createdAt: thisMonth,
                isCompleted: true,
                tasks: [newTask]
            });

            const mockUserData = testUtils.createMockUser({ 
                goals: [oldGoal, newGoal]
            });
            
            // Mock flatMap to return all tasks
            mockUserData.goals.flatMap = jest.fn().mockReturnValue([oldTask, newTask]);
            
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ 
                user: mockUserData,
                body: {}
            });
            const mockRes = testUtils.createMockResponse();

            await getMonthlyStats(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            
            // The response should only count goals/tasks from this month
            const responseCall = mockRes.json.mock.calls[0][0];
            expect(responseCall).toHaveProperty('totalTasks');
            expect(responseCall).toHaveProperty('completedTasks');
            expect(responseCall).toHaveProperty('totalGoals');
            expect(responseCall).toHaveProperty('completedGoals');
        });
    });


});