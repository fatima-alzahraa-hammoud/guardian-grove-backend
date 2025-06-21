import { testUtils } from '../setup';
import {  getUsers } from '../../src/controllers/user.controller';
import { User } from '../../src/models/user.model';
import * as generateSecurePassword from '../../src/utils/generateSecurePassword';
import * as checkId from '../../src/utils/checkId';

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
const mockGenerateSecurePassword = generateSecurePassword as jest.Mocked<typeof generateSecurePassword>;
const mockCheckId = checkId as jest.Mocked<typeof checkId>;

describe('User Controller Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockGenerateSecurePassword.generateSecurePassword.mockReturnValue('TempPass123!');
        mockCheckId.checkId.mockReturnValue(true);
    });

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
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error retrieving users' });
        });
    });
});