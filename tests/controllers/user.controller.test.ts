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
});