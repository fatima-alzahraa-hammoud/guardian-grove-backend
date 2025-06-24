import { testUtils } from '../setup';
import { adminMiddleware } from '../../src/middlewares/admin.middleware';
import * as errorUtils from '../../src/utils/error';
import { CustomRequest } from '../../src/interfaces/customRequest';

// Mock the error utility
jest.mock('../../src/utils/error');

const mockThrowError = errorUtils.throwError as jest.MockedFunction<typeof errorUtils.throwError>;

describe('Admin Middleware Tests', () => {
    let mockNext: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNext = jest.fn();
        
        // Mock throwError to not actually throw but allow us to verify it was called
        mockThrowError.mockImplementation(() => {});
    });

    describe('adminMiddleware', () => {
        it('should call next() when user has admin role', async () => {
            const mockAdminUser = testUtils.createMockUser({
                role: 'admin'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockAdminUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should call throwError when user has parent role', async () => {
            const mockParentUser = testUtils.createMockUser({
                role: 'parent'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockParentUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user has child role', async () => {
            const mockChildUser = testUtils.createMockUser({
                role: 'child'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockChildUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user is null', async () => {
            const mockReq = testUtils.createMockRequest({
                user: null
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user is undefined', async () => {
            const mockReq = testUtils.createMockRequest({
                user: undefined
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user exists but role is undefined', async () => {
            const mockUserWithoutRole = testUtils.createMockUser({
                role: undefined as any
            });

            const mockReq = testUtils.createMockRequest({
                user: mockUserWithoutRole
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user exists but role is null', async () => {
            const mockUserWithNullRole = testUtils.createMockUser({
                role: null as any
            });

            const mockReq = testUtils.createMockRequest({
                user: mockUserWithNullRole
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user role is empty string', async () => {
            const mockUserWithEmptyRole = testUtils.createMockUser({
                role: '' as any
            });

            const mockReq = testUtils.createMockRequest({
                user: mockUserWithEmptyRole
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user role is not exactly "admin" (case sensitive)', async () => {
            const mockUserWithWrongCaseRole = testUtils.createMockUser({
                role: 'Admin' as any // Capital A
            });

            const mockReq = testUtils.createMockRequest({
                user: mockUserWithWrongCaseRole
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle request object without user property', async () => {
            const mockReq = testUtils.createMockRequest({}) as unknown as CustomRequest;
            // Explicitly remove user property to simulate edge case
            delete (mockReq as any).user;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should work correctly with different admin user configurations', async () => {
            const mockAdminUser1 = testUtils.createMockUser({
                _id: 'admin1',
                name: 'Admin One',
                email: 'admin1@guardiangrove.com',
                role: 'admin'
            });

            const mockAdminUser2 = testUtils.createMockUser({
                _id: 'admin2',
                name: 'Admin Two',
                email: 'admin2@guardiangrove.com',
                role: 'admin',
                familyId: null // Admin might not belong to a family
            });

            // Test first admin user
            const mockReq1 = testUtils.createMockRequest({
                user: mockAdminUser1
            }) as unknown as CustomRequest;
            const mockRes1 = testUtils.createMockResponse();

            await adminMiddleware(mockReq1, mockRes1, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();

            // Reset mocks
            jest.clearAllMocks();
            mockNext.mockClear();

            // Test second admin user
            const mockReq2 = testUtils.createMockRequest({
                user: mockAdminUser2
            }) as unknown as CustomRequest;
            const mockRes2 = testUtils.createMockResponse();

            await adminMiddleware(mockReq2, mockRes2, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle malformed user object gracefully', async () => {
            const malformedUser = {
                // Missing required properties but has role
                role: 'admin'
            };

            const mockReq = testUtils.createMockRequest({
                user: malformedUser as any
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should handle user object with additional properties', async () => {
            const userWithExtraProps = {
                ...testUtils.createMockUser({ role: 'admin' }),
                extraProperty: 'some value',
                anotherProp: 123
            };

            const mockReq = testUtils.createMockRequest({
                user: userWithExtraProps
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should verify throwError is called with correct parameters structure', async () => {
            const mockUser = testUtils.createMockUser({ role: 'parent' });
            const mockReq = testUtils.createMockRequest({ user: mockUser }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await adminMiddleware(mockReq, mockRes, mockNext);

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
    });
});