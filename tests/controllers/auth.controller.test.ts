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
            gender: 'male' as 'male' | 'female',
            role: 'parent',
            avatarPath: '/assets/images/avatars/avatar1.png' as string | undefined,
            interests: ['reading', 'sports'],
            familyName: 'Test Family',
            familyAvatarPath: '/assets/images/avatars/family1.png' as string | undefined
        };

        beforeEach(() => {
            // Reset all mocks before each test
            jest.clearAllMocks();
            
            // Mock Family constructor
            (mockFamily as any).mockImplementation(function(this: any, data: any) {
                Object.assign(this, data);
                this._id = 'mock-family-id';
                this.save = jest.fn().mockResolvedValue(this);
                return this;
            });
        });

        it('should register successfully with valid data', async () => {
            const mockFamilyData = {
                _id: 'mock-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email,
                familyAvatar: validRegisterData.familyAvatarPath,
                createdAt: new Date(),
                save: jest.fn().mockResolvedValue(undefined)
            };

            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id,
                    avatar: validRegisterData.avatarPath
                }),
                id: '507f1f77bcf86cd799439011'
            };

            // Mock Family.findOne to return null (new family)
            mockFamily.findOne.mockResolvedValue(null);
            
            // Mock User.findOne to return null (no existing user with same name)
            mockUser.findOne.mockResolvedValue(null);
            
            // Mock User.create
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {} // No files uploaded, using avatarPath and familyAvatarPath
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockFamily.findOne).toHaveBeenCalledWith({ email: validRegisterData.email });
            expect(mockBcrypt.hash).toHaveBeenCalledWith(validRegisterData.password, 12);
            expect(mockUser.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...validRegisterData,
                    password: 'hashedPassword',
                    familyId: 'mock-family-id',
                    avatar: validRegisterData.avatarPath,
                    interests: validRegisterData.interests
                })
            );
            expect(mockJwt.sign).toHaveBeenCalledWith(
                { userId: mockCreatedUser.id, role: mockCreatedUser.role },
                'test_jwt_secret_key_for_guardian_grove_123'
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({
                user: mockCreatedUser,
                token: 'mock-jwt-token',
                family: expect.any(Object)
            });
        });

        it('should register with existing family', async () => {
            const mockFamilyData = {
                _id: 'existing-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email,
                familyAvatar: '/existing/avatar.png',
                save: jest.fn().mockResolvedValue(undefined)
            };

            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id
                }),
                id: '507f1f77bcf86cd799439011'
            };

            // Mock Family.findOne to return existing family
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            
            // Mock User.findOne to return null (no existing user with same name)
            mockUser.findOne.mockResolvedValue(null);
            
            // Mock User.create
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockFamily.findOne).toHaveBeenCalledWith({ email: validRegisterData.email });
            // Should not create new family
            expect(mockFamily).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if required fields are missing', async () => {
            const incompleteData = { ...validRegisterData };
            delete (incompleteData as any).name;

            const mockReq = testUtils.createMockRequest({ 
                body: incompleteData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'All required fields must be filled.'
            });
        });

        it('should return 400 if avatar is missing', async () => {
            const dataWithoutAvatar = { ...validRegisterData };
            delete (dataWithoutAvatar as any).avatarPath;

            const mockReq = testUtils.createMockRequest({ 
                body: dataWithoutAvatar,
                files: {} // No files and no avatarPath
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Avatar is required.'
            });
        });

        it('should return 400 if family avatar is missing', async () => {
            const dataWithoutFamilyAvatar = { ...validRegisterData };
            delete (dataWithoutFamilyAvatar as any).familyAvatarPath;

            const mockReq = testUtils.createMockRequest({ 
                body: dataWithoutFamilyAvatar,
                files: {} // No files and no familyAvatarPath
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Family avatar is required.'
            });
        });

        it('should return 400 if passwords do not match', async () => {
            const invalidData = {
                ...validRegisterData,
                confirmPassword: 'DifferentPass123!'
            };

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid interests format.'
            });
        });

        it('should parse interests from JSON string', async () => {
            const dataWithStringInterests = {
                ...validRegisterData,
                interests: '["reading", "sports"]' // JSON string instead of array
            };

            const mockFamilyData = {
                _id: 'mock-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email,
                save: jest.fn().mockResolvedValue(undefined)
            };

            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id
                }),
                id: '507f1f77bcf86cd799439011'
            };

            mockFamily.findOne.mockResolvedValue(null);
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);

            const mockReq = testUtils.createMockRequest({ 
                body: dataWithStringInterests,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockUser.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    interests: ['reading', 'sports'] // Should be parsed to array
                })
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if interests JSON parsing fails', async () => {
            const invalidData = {
                ...validRegisterData,
                interests: 'invalid-json-string'
            };

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid interests format.'
            });
        });

        it('should return 400 if gender is invalid', async () => {
            const invalidData = {
                ...validRegisterData,
                gender: 'invalid-gender'
            };

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
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

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.'
            });
        });

        it('should return 400 if family name is wrong for existing family', async () => {
            const mockFamilyData = {
                _id: 'existing-family-id',
                familyName: 'Different Family Name', // Different from validRegisterData.familyName
                email: validRegisterData.email
            };
            
            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Wrong family name'
            });
        });

        it('should return 400 if member with same name exists in family', async () => {
            const mockFamilyData = {
                _id: 'existing-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email
            };
            
            const existingUser = testUtils.createMockUser({
                name: validRegisterData.name,
                familyId: mockFamilyData._id
            });

            mockFamily.findOne.mockResolvedValue(mockFamilyData as any);
            mockUser.findOne.mockResolvedValue(existingUser as any);

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockUser.findOne).toHaveBeenCalledWith({ 
                name: validRegisterData.name, 
                familyId: mockFamilyData._id 
            });
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'A member with this name already exists in the family.'
            });
        });

        it('should return 400 if invalid avatar path is provided', async () => {
            const invalidData = {
                ...validRegisterData,
                avatarPath: '/invalid/path/avatar.png' // Invalid path
            };

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid avatar path. Only predefined avatars are allowed.'
            });
        });

        it('should return 400 if invalid family avatar path is provided', async () => {
            const invalidData = {
                ...validRegisterData,
                familyAvatarPath: '/invalid/path/family.png' // Invalid path
            };

            const mockReq = testUtils.createMockRequest({ 
                body: invalidData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid family avatar path. Only predefined avatars are allowed.'
            });
        });

        it('should handle database errors gracefully', async () => {
            mockFamily.findOne.mockRejectedValue(new Error('Database connection failed'));

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Something went wrong while registering.'
            });
        });

        it('should handle User.create errors gracefully', async () => {
            const mockFamilyData = {
                _id: 'mock-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email,
                save: jest.fn().mockResolvedValue(undefined)
            };

            mockFamily.findOne.mockResolvedValue(null);
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockRejectedValue(new Error('User creation failed'));

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
            const mockRes = testUtils.createMockResponse();

            await register(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Something went wrong while registering.'
            });
        });

        it('should handle JWT signing errors gracefully', async () => {
            const mockFamilyData = {
                _id: 'mock-family-id',
                familyName: validRegisterData.familyName,
                email: validRegisterData.email,
                save: jest.fn().mockResolvedValue(undefined)
            };

            const mockCreatedUser = {
                ...testUtils.createMockUser({
                    ...validRegisterData,
                    familyId: mockFamilyData._id
                }),
                id: '507f1f77bcf86cd799439011'
            };

            mockFamily.findOne.mockResolvedValue(null);
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockResolvedValue(mockCreatedUser as any);
            (mockJwt.sign as jest.Mock).mockRejectedValue(new Error('JWT signing failed'));

            const mockReq = testUtils.createMockRequest({ 
                body: validRegisterData,
                files: {}
            });
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