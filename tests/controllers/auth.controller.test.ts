import { testUtils } from '../setup';
import { login, register, forgetPassword } from '../../src/controllers/auth.controller';
import { User } from '../../src/models/user.model';
import { Family } from '../../src/models/family.model';
import * as generateSecurePassword from '../../src/utils/generateSecurePassword';
import * as emailService from '../../src/services/email.service';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock all dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/family.model');
jest.mock('../../src/services/email.service');
jest.mock('../../src/utils/generateSecurePassword');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUser = User as jest.Mocked<typeof User>;
const mockFamily = Family as jest.Mocked<typeof Family>;
const mockGenerateSecurePassword = generateSecurePassword as jest.Mocked<typeof generateSecurePassword>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup User model methods
        mockUser.findOne = jest.fn();
        mockUser.create = jest.fn();

        // Setup Family model methods
        mockFamily.findOne = jest.fn();
        
        // Setup utility mocks
        mockGenerateSecurePassword.generateSecurePassword.mockReturnValue('TempPass123!');
        jest.spyOn(mockEmailService, 'sendMail').mockResolvedValue(undefined);
        
        (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashedPassword');
        (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);
        (jest.spyOn(jwt, 'sign') as jest.Mock).mockResolvedValue('mock-jwt-token');

        // Set JWT_SECRET environment variable
        process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
    });

    afterEach(() => {
        // Clean up environment variables if needed
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        }
    });
});