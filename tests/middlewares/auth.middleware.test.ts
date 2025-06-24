import { testUtils } from '../setup';
import { authMiddleware } from '../../src/middlewares/auth.middleware';
import * as errorUtils from '../../src/utils/error';
import { User } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import { CustomRequest } from '../../src/interfaces/customRequest';

// Mock all dependencies
jest.mock('../../src/utils/error');
jest.mock('../../src/models/user.model');
jest.mock('jsonwebtoken');

const mockThrowError = errorUtils.throwError as jest.MockedFunction<typeof errorUtils.throwError>;
const mockUser = User as jest.Mocked<typeof User>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

interface JwtPayload {
    userId: string | null;
    [key: string]: any;
}

describe('Auth Middleware Tests', () => {
    let mockNext: jest.Mock;
    const validToken = 'valid.jwt.token';
    const validUserId = testUtils.ids.user;
    const originalJwtSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNext = jest.fn();
        
        // Mock throwError to not actually throw but allow us to verify it was called
        mockThrowError.mockImplementation(() => {});
        
        // Set up JWT_SECRET for tests
        process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        
        // Setup User model mock
        mockUser.findById = jest.fn();
        
        // Setup JWT verify mock properly
        mockJwt.verify = jest.fn() as any;
    });

    afterEach(() => {
        // Restore original JWT_SECRET
        process.env.JWT_SECRET = originalJwtSecret;
    });

    describe('authMiddleware - Success Cases', () => {
        it('should authenticate user successfully with valid token', async () => {
            const mockUserData = testUtils.createMockUser({
                _id: validUserId
            });
            
            const mockPayload: JwtPayload = { userId: validUserId };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockJwt.verify).toHaveBeenCalledWith(validToken, 'test_jwt_secret_key_for_guardian_grove_123');
            expect(mockUser.findById).toHaveBeenCalledWith(validUserId);
            expect(mockReq.user).toBe(mockUserData);
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should work with different valid token formats', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockPayload: JwtPayload = { userId: validUserId, exp: Date.now() + 3600 };
                        
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2MDk0NTk2MDB9.test';
            
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${longToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - Authorization Header Validation', () => {
        it('should return 401 when authorization header is missing', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {}
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockJwt.verify).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header is undefined', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: undefined
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header is empty string', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: ''
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header has only one part', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer'
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header has more than two parts', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer token extra'
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header does not start with Bearer', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Basic token123'
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when Bearer has wrong case', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'bearer token123'
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when token part is empty', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer '
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when token is only whitespace', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer    '
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - JWT Secret Validation', () => {
        it('should return 500 when JWT_SECRET is not defined', async () => {
            delete process.env.JWT_SECRET;

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "JWT_SECRET_KEY is not defined",
                res: mockRes,
                status: 500
            });
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockJwt.verify).not.toHaveBeenCalled();
        });

        it('should return 500 when JWT_SECRET is empty string', async () => {
            process.env.JWT_SECRET = '';

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "JWT_SECRET_KEY is not defined",
                res: mockRes,
                status: 500
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 when JWT_SECRET is only whitespace', async () => {
            process.env.JWT_SECRET = '   ';

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "JWT_SECRET_KEY is not defined",
                res: mockRes,
                status: 500
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - JWT Verification Errors', () => {
        beforeEach(() => {
            process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        });

        it('should return 401 when JWT verification fails', async () => {
            (mockJwt.verify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockJwt.verify).toHaveBeenCalledWith(validToken, 'test_jwt_secret_key_for_guardian_grove_123');
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockUser.findById).not.toHaveBeenCalled();
        });

        it('should return 401 when token is expired', async () => {
            const expiredError = new Error('jwt expired');
            expiredError.name = 'TokenExpiredError';
            (mockJwt.verify as jest.Mock).mockRejectedValue(expiredError);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when token is malformed', async () => {
            const malformedError = new Error('jwt malformed');
            malformedError.name = 'JsonWebTokenError';
            (mockJwt.verify as jest.Mock).mockRejectedValue(malformedError);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer invalid.token.format'
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - User Validation', () => {
        beforeEach(() => {
            process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        });

        it('should return 404 when user is not found', async () => {
            const mockPayload: JwtPayload = { userId: validUserId };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            delete (mockReq as any).user;

            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockJwt.verify).toHaveBeenCalledWith(validToken, 'test_jwt_secret_key_for_guardian_grove_123');
            expect(mockUser.findById).toHaveBeenCalledWith(validUserId);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "User not found",
                res: mockRes,
                status: 404
            });
            expect(mockNext).not.toHaveBeenCalled();
            // The user property should not be set when user is not found
            expect(mockReq.user).toBeUndefined();
        });

        it('should return 404 when user is undefined', async () => {
            const mockPayload: JwtPayload = { userId: validUserId };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(undefined as any);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "User not found",
                res: mockRes,
                status: 404
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle database errors when finding user', async () => {
            const mockPayload: JwtPayload = { userId: validUserId };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockRejectedValue(new Error('Database connection error'));

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - JWT Payload Validation', () => {
        beforeEach(() => {
            process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        });

        it('should handle payload without userId', async () => {
            const mockPayload = { username: 'testuser' }; // Missing userId
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockUser.findById).toHaveBeenCalledWith(undefined);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "User not found",
                res: mockRes,
                status: 404
            });
        });

        it('should handle payload with null userId', async () => {
            const mockPayload: JwtPayload = { userId: null };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(null);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockUser.findById).toHaveBeenCalledWith(null);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "User not found",
                res: mockRes,
                status: 404
            });
        });

        it('should work with additional payload data', async () => {
            const mockUserData = testUtils.createMockUser();
            const mockPayload: JwtPayload = { 
                userId: validUserId, 
                role: 'parent',
                iat: Date.now(),
                exp: Date.now() + 3600
            };
            
            (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
            mockUser.findById.mockResolvedValue(mockUserData as any);

            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockReq.user).toBe(mockUserData);
            expect(mockThrowError).not.toHaveBeenCalled();
        });
    });

    describe('authMiddleware - Edge Cases', () => {
        beforeEach(() => {
            process.env.JWT_SECRET = 'test_jwt_secret_key_for_guardian_grove_123';
        });

        it('should handle request with case-insensitive header keys', async () => {
            // This test should fail because the header will be missing due to case sensitivity
            const mockReq = testUtils.createMockRequest({
                headers: {
                    'Authorization': `Bearer ${validToken}` // Capital A - this will NOT work in real Express
                }
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            // The middleware should reject this because 'Authorization' !== 'authorization'
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockJwt.verify).not.toHaveBeenCalled();
        });

        it('should verify throwError parameters structure', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {}
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String),
                    res: expect.any(Object),
                    status: expect.any(Number)
                })
            );

            const callArgs = mockThrowError.mock.calls[0][0];
            expect(callArgs.message).toBe("Unauthorized");
            expect(callArgs.status).toBe(401);
            expect(callArgs.res).toBe(mockRes);
        });

        it('should not modify request object on failure', async () => {
            const mockReq = testUtils.createMockRequest({
                headers: {
                    authorization: 'Bearer invalid'
                }
            }) as unknown as CustomRequest;
            delete (mockReq as any).user;
            const mockRes = testUtils.createMockResponse();

            (mockJwt.verify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeUndefined();
        });

        it('should handle different user roles correctly', async () => {
            const testRoles = ['parent', 'child', 'admin'];
            
            for (const role of testRoles) {
                const mockUserData = testUtils.createMockUser({ role: role as any });
                const mockPayload: JwtPayload = { userId: validUserId };
                
                (mockJwt.verify as jest.Mock).mockResolvedValue(mockPayload);
                mockUser.findById.mockResolvedValue(mockUserData as any);

                const mockReq = testUtils.createMockRequest({
                    headers: {
                        authorization: `Bearer ${validToken}`
                    }
                }) as unknown as CustomRequest;
                const mockRes = testUtils.createMockResponse();

                await authMiddleware(mockReq, mockRes, mockNext);

                expect(mockReq.user).toBe(mockUserData);
                expect(mockNext).toHaveBeenCalled();
                
                // Reset for next iteration
                jest.clearAllMocks();
                mockNext.mockClear();
                // Re-setup the mocks for next iteration
                mockThrowError.mockImplementation(() => {});
                mockUser.findById = jest.fn();
                mockJwt.verify = jest.fn() as any;
            }
        });
    });
});