import { testUtils } from '../setup';
import {  getUsers, getUserById, } from '../../src/controllers/user.controller';
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
        
        // 🎯 ADD: Ensure User model methods are mocked
        mockUser.find = jest.fn();
        mockUser.findOne = jest.fn();
        mockUser.findById = jest.fn();
        mockUser.create = jest.fn();
        
        // Your existing mocks
        mockGenerateSecurePassword.generateSecurePassword.mockReturnValue('TempPass123!');
        mockCheckId.checkId.mockReturnValue(true);
    });

    // test getUsers API
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

    // test getUserById API
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

});