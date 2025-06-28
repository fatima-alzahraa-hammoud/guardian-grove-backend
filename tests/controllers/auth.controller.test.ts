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

    // 1. test login API
    describe('login', () => {
        const validLoginData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'TestPass123!'
        };

        it('should login successfully with valid credentials', async () => {
            const mockUserData = {
                ...testUtils.createMockUser({
                    ...validLoginData,
                    isTempPassword: false
                }),
                id: '507f1f77bcf86cd799439011' 
            };
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockUser.findOne).toHaveBeenCalledWith({
                name: validLoginData.name,
                email: validLoginData.email
            });
            expect(mockBcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUserData.password);
            expect(mockJwt.sign).toHaveBeenCalledWith(
                { userId: mockUserData.id, role: mockUserData.role },
                'test_jwt_secret_key_for_guardian_grove_123'
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                user: mockUserData,
                token: 'mock-jwt-token',
                requiresPasswordChange: false,
                message: 'Login successful'
            });
        });

        it('should login with temporary password and require password change', async () => {
            const mockUserData = {
                ...testUtils.createMockUser({
                    ...validLoginData,
                    isTempPassword: true
                }),
                id: '507f1f77bcf86cd799439011' // Add id property for JWT
            };
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                user: mockUserData,
                token: 'mock-jwt-token',
                requiresPasswordChange: true,
                message: 'Please set a new password'
            });
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData = { name: 'Test User', email: 'test@example.com' }; // Missing password

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Name, email, and password are required.'
            });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findOne.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid credentials. User not found.'
            });
        });

        it('should return 401 if password is incorrect', async () => {
            const mockUserData = {
                ...testUtils.createMockUser(validLoginData),
                id: '507f1f77bcf86cd799439011'
            };
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid password.'
            });
        });

        it('should handle JWT signing errors gracefully', async () => {
            const mockUserData = {
                ...testUtils.createMockUser(validLoginData),
                id: '507f1f77bcf86cd799439011'
            };
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
            // Mock JWT sign to throw an error
            (mockJwt.sign as jest.Mock).mockRejectedValue(new Error('JWT signing failed'));

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Something went wrong while logging in.'
            });
        });

        it('should handle database errors gracefully', async () => {
            mockUser.findOne.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest({ body: validLoginData });
            const mockRes = testUtils.createMockResponse();

            await login(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Something went wrong while logging in.'
            });
        });
    });

    // 2. test register API
    describe('register', () => {
        const validRegisterData = {
            name: 'Test Parent',
            email: 'parent@example.com',
            password: 'TestPass123!',
            confirmPassword: 'TestPass123!',
            birthday: '1985-01-01',
            gender: 'male',
            role: 'parent',
            avatar: '/avatar.png',
            interests: ['reading', 'sports'],
            familyName: 'Test Family',
            familyAvatar: '/family-avatar.png'
        };

        it('should register successfully with valid data', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                email: validRegisterData.email,
                familyName: validRegisterData.familyName,
                members: []
            });
            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id
                }),
                id: '507f1f77bcf86cd799439011' // Add id property for JWT
            };

            mockFamily.findOne.mockResolvedValue(null); // New family
            mockFamily.prototype.save = jest.fn().mockResolvedValue(mockFamilyData);
            mockUser.findOne.mockResolvedValue(null); // No existing user with same name
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            // Mock the Family constructor
            (mockFamily as any).mockImplementation(() => ({
                ...mockFamilyData,
                save: jest.fn().mockResolvedValue(mockFamilyData)
            }));

            const mockReq = testUtils.createMockRequest({ body: validRegisterData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockBcrypt.hash).toHaveBeenCalledWith(validRegisterData.password, 12);
            expect(mockUser.create).toHaveBeenCalled();
            expect(mockJwt.sign).toHaveBeenCalledWith(
                { userId: mockCreatedUser.id, role: mockCreatedUser.role },
                'test_jwt_secret_key_for_guardian_grove_123'
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should register with existing family', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                email: validRegisterData.email,
                familyName: validRegisterData.familyName,
                members: []
            });
            mockFamilyData.save = jest.fn().mockResolvedValue(mockFamilyData);

            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id
                }),
                id: '507f1f77bcf86cd799439011' // Add id property for JWT
            };

            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ body: validRegisterData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData: Partial<typeof validRegisterData> = { ...validRegisterData };
            delete incompleteData.name;

            const mockReq = testUtils.createMockRequest({ body: incompleteData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should return 400 if passwords do not match', async () => {
            const invalidData = {
                ...validRegisterData,
                confirmPassword: 'DifferentPass123!'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Passwords do not match'
            });
        });

        it('should return 400 if email format is invalid', async () => {
            const invalidData = {
                ...validRegisterData,
                email: 'invalid-email'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid email format.'
            });
        });

        it('should return 400 if role is child', async () => {
            const invalidData = {
                ...validRegisterData,
                role: 'child'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Children must be added by a parent.'
            });
        });

        it('should return 400 if role is invalid', async () => {
            const invalidData = {
                ...validRegisterData,
                role: 'invalid-role'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid role.'
            });
        });

        it('should return 400 if interests is not an array', async () => {
            const invalidData = {
                ...validRegisterData,
                interests: 'not-an-array'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Interests must be an array.'
            });
        });

        it('should return 400 if gender is invalid', async () => {
            const invalidData = {
                ...validRegisterData,
                gender: 'invalid-gender'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Gender must be either 'male' or 'female'."
            });
        });

        it('should return 400 if birthday format is invalid', async () => {
            const invalidData = {
                ...validRegisterData,
                birthday: 'invalid-date'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid birthday format.'
            });
        });

        it('should return 400 if password does not meet requirements', async () => {
            const invalidData = {
                ...validRegisterData,
                password: 'weak',
                confirmPassword: 'weak'
            };

            const mockReq = testUtils.createMockRequest({ body: invalidData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.'
            });
        });

        it('should return 400 if family name is wrong for existing family', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                email: validRegisterData.email,
                familyName: 'Different Family Name'
            });
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({ body: validRegisterData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Wrong family name'
            });
        });

        it('should return 400 if member with same name exists in family', async () => {
            const mockFamilyData = testUtils.createMockFamily({
                email: validRegisterData.email,
                familyName: validRegisterData.familyName
            });
            const existingUser = testUtils.createMockUser({
                name: validRegisterData.name,
                familyId: mockFamilyData._id
            });

            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.findOne.mockResolvedValue(existingUser as any);

            const mockReq = testUtils.createMockRequest({ body: validRegisterData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'A member with this name already exists in the family.'
            });
        });

        it('should handle database errors gracefully', async () => {
            mockFamily.findOne.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest({ body: validRegisterData });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Something went wrong while registering.'
            });
        });
    });

    
    // 3. test forgetPassword API
    describe('forgetPassword', () => {
        const validForgetPasswordData = {
            name: 'Test User',
            email: 'test@example.com'
        };

        it('should send temporary password successfully', async () => {
            const mockUserData = testUtils.createMockUser(validForgetPasswordData);
            mockUser.findOne.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockUser.findOne).toHaveBeenCalledWith({
                email: validForgetPasswordData.email,
                name: validForgetPasswordData.name
            });
            expect(mockGenerateSecurePassword.generateSecurePassword).toHaveBeenCalled();
            expect(mockBcrypt.hash).toHaveBeenCalledWith('TempPass123!', 12);
            expect(mockUserData.isTempPassword).toBe(true);
            expect(mockUserData.passwordChangedAt).toBeDefined();
            expect(mockEmailService.sendMail).toHaveBeenCalledWith(
                expect.stringContaining('Guardian Grove'),
                validForgetPasswordData.email,
                'Your Temporary Password',
                expect.stringContaining('TempPass123!')
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                message: 'Temporary password sent to your email.'
            });
        });

        it('should return 404 if user not found', async () => {
            mockUser.findOne.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid credentials. User not found.'
            });
        });

        it('should handle email service errors gracefully', async () => {
            const mockUserData = testUtils.createMockUser(validForgetPasswordData);
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            mockEmailService.sendMail.mockRejectedValue(new Error('Email service failed'));

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Error sending temporary password.'
            });
        });

        it('should handle database save errors gracefully', async () => {
            const mockUserData = testUtils.createMockUser(validForgetPasswordData);
            mockUserData.save = jest.fn().mockRejectedValue(new Error('Database save failed'));
            mockUser.findOne.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Error sending temporary password.'
            });
        });

        it('should handle password hashing errors gracefully', async () => {
            const mockUserData = testUtils.createMockUser(validForgetPasswordData);
            mockUser.findOne.mockResolvedValue(mockUserData as any);
            (mockBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Error sending temporary password.'
            });
        });

        it('should generate proper email HTML content', async () => {
            const mockUserData = testUtils.createMockUser({
                ...validForgetPasswordData,
                name: 'John Doe'
            });
            mockUser.findOne.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockEmailService.sendMail).toHaveBeenCalledWith(
                expect.any(String),
                validForgetPasswordData.email,
                'Your Temporary Password',
                expect.stringMatching(/Hello John Doe/)
            );
            expect(mockEmailService.sendMail).toHaveBeenCalledWith(
                expect.any(String),
                validForgetPasswordData.email,
                'Your Temporary Password',
                expect.stringMatching(/TempPass123!/)
            );
            expect(mockEmailService.sendMail).toHaveBeenCalledWith(
                expect.any(String),
                validForgetPasswordData.email,
                'Your Temporary Password',
                expect.stringMatching(/Guardian Grove Team/)
            );
        });

        it('should set correct user properties after password reset', async () => {
            const mockUserData = testUtils.createMockUser({
                ...validForgetPasswordData,
                isTempPassword: false,
                passwordChangedAt: new Date('2024-01-01')
            });
            mockUser.findOne.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({ body: validForgetPasswordData });
            const mockRes = testUtils.createMockResponse();

            await forgetPassword(mockReq as any, mockRes as any);

            expect(mockUserData.password).toBe('hashedPassword');
            expect(mockUserData.isTempPassword).toBe(true);
            expect(mockUserData.passwordChangedAt).toBeInstanceOf(Date);
            expect(mockUserData.save).toHaveBeenCalled();
        });
    });
});