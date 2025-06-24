import { testUtils } from '../setup';
import { parentsMiddleware } from '../../src/middlewares/parent.middleware';
import * as errorUtils from '../../src/utils/error';
import { CustomRequest } from '../../src/interfaces/customRequest';

// Mock the error utility
jest.mock('../../src/utils/error');

const mockThrowError = errorUtils.throwError as jest.MockedFunction<typeof errorUtils.throwError>;

describe('Parents Middleware Tests', () => {
    let mockNext: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNext = jest.fn();
        
        // Mock throwError to not actually throw but allow us to verify it was called
        mockThrowError.mockImplementation(() => {});
    });

    describe('parentsMiddleware', () => {
        it('should call next() when user has parent role', async () => {
            const mockParentUser = testUtils.createMockUser({
                role: 'parent'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockParentUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should call throwError when user has child role', async () => {
            const mockChildUser = testUtils.createMockUser({
                role: 'child'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockChildUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user has admin role', async () => {
            const mockAdminUser = testUtils.createMockUser({
                role: 'admin'
            });

            const mockReq = testUtils.createMockRequest({
                user: mockAdminUser
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call throwError when user role is not exactly "parent" (case sensitive)', async () => {
            const mockUserWithWrongCaseRole = testUtils.createMockUser({
                role: 'Parent' as any // Capital P
            });

            const mockReq = testUtils.createMockRequest({
                user: mockUserWithWrongCaseRole
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes,
                status: 401
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should work correctly with different parent user configurations', async () => {
            const mockParentUser1 = testUtils.createMockUser({
                _id: 'parent1',
                name: 'Parent One',
                email: 'parent1@example.com',
                role: 'parent'
            });

            const mockParentUser2 = testUtils.createMockUser({
                _id: 'parent2',
                name: 'Parent Two',
                email: 'parent2@example.com',
                role: 'parent',
                familyId: testUtils.ids.family
            });

            // Test first parent user
            const mockReq1 = testUtils.createMockRequest({
                user: mockParentUser1
            }) as unknown as CustomRequest;
            const mockRes1 = testUtils.createMockResponse();

            await parentsMiddleware(mockReq1, mockRes1, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();

            // Reset mocks
            jest.clearAllMocks();
            mockNext.mockClear();

            // Test second parent user
            const mockReq2 = testUtils.createMockRequest({
                user: mockParentUser2
            }) as unknown as CustomRequest;
            const mockRes2 = testUtils.createMockResponse();

            await parentsMiddleware(mockReq2, mockRes2, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should handle malformed user object gracefully', async () => {
            const malformedUser = {
                // Missing required properties but has role
                role: 'parent'
            };

            const mockReq = testUtils.createMockRequest({
                user: malformedUser as any
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });

        it('should handle user object with additional properties', async () => {
            const userWithExtraProps = {
                ...testUtils.createMockUser({ role: 'parent' }),
                extraProperty: 'some value',
                anotherProp: 123
            };

            const mockReq = testUtils.createMockRequest({
                user: userWithExtraProps
            }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should verify throwError is called with correct parameters structure', async () => {
            const mockUser = testUtils.createMockUser({ role: 'child' });
            const mockReq = testUtils.createMockRequest({ user: mockUser }) as unknown as CustomRequest;
            const mockRes = testUtils.createMockResponse();

            await parentsMiddleware(mockReq, mockRes, mockNext);

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

        it('should handle invalid role types', async () => {
            const testInvalidRoles = [123, true, {}, [], Symbol('test')];

            for (const invalidRole of testInvalidRoles) {
                const mockUserWithInvalidRole = testUtils.createMockUser({
                    role: invalidRole as any
                });

                const mockReq = testUtils.createMockRequest({
                    user: mockUserWithInvalidRole
                }) as unknown as CustomRequest;
                const mockRes = testUtils.createMockResponse();

                await parentsMiddleware(mockReq, mockRes, mockNext);

                expect(mockThrowError).toHaveBeenCalledWith({
                    message: "Unauthorized",
                    res: mockRes,
                    status: 401
                });
                expect(mockNext).not.toHaveBeenCalled();

                // Reset for next iteration
                jest.clearAllMocks();
                mockNext.mockClear();
                mockThrowError.mockImplementation(() => {});
            }
        });

        it('should handle multiple consecutive calls correctly', async () => {
            const mockParentUser = testUtils.createMockUser({ role: 'parent' });
            const mockChildUser = testUtils.createMockUser({ role: 'child' });

            // First call with parent user
            const mockReq1 = testUtils.createMockRequest({
                user: mockParentUser
            }) as unknown as CustomRequest;
            const mockRes1 = testUtils.createMockResponse();

            await parentsMiddleware(mockReq1, mockRes1, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(mockThrowError).not.toHaveBeenCalled();

            // Second call with child user
            const mockReq2 = testUtils.createMockRequest({
                user: mockChildUser
            }) as unknown as CustomRequest;
            const mockRes2 = testUtils.createMockResponse();

            await parentsMiddleware(mockReq2, mockRes2, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1); // Still 1 from first call
            expect(mockThrowError).toHaveBeenCalledTimes(1);
            expect(mockThrowError).toHaveBeenCalledWith({
                message: "Unauthorized",
                res: mockRes2,
                status: 401
            });
        });
    });
});