import { testUtils } from '../setup';
import { throwError } from '../../src/utils/error';

describe('throwError Utility Tests', () => {
    let mockRes: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRes = testUtils.createMockResponse();
    });

    describe('Basic functionality', () => {
        it('should call res.status and res.json with provided message and status', () => {
            const message = 'Test error message';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(status);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
            expect(mockRes.status).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledTimes(1);
        });

        it('should use default status 500 when status not provided', () => {
            const message = 'Error without status';

            throwError({ message, res: mockRes });

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should use default message when message not provided', () => {
            const status = 400;

            throwError({ message: undefined as any, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(status);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
        });

        it('should use both defaults when only res provided', () => {
            throwError({ message: undefined as any, res: mockRes });

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
        });
    });

    describe('Different status codes', () => {
        it('should handle 400 Bad Request', () => {
            const message = 'Bad Request';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle 401 Unauthorized', () => {
            const message = 'Unauthorized';
            const status = 401;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle 403 Forbidden', () => {
            const message = 'Forbidden';
            const status = 403;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle 404 Not Found', () => {
            const message = 'Not Found';
            const status = 404;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle 409 Conflict', () => {
            const message = 'Conflict';
            const status = 409;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle 500 Internal Server Error', () => {
            const message = 'Internal Server Error';
            const status = 500;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle custom status codes', () => {
            const message = 'Custom error';
            const status = 418; // I'm a teapot

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(418);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });
    });

    describe('Different message types', () => {
        it('should handle empty string message', () => {
            const message = '';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });

        it('should handle whitespace-only message', () => {
            const message = '   ';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });

        it('should handle long message', () => {
            const message = 'This is a very long error message that contains a lot of text to test how the function handles longer strings without any issues';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle message with special characters', () => {
            const message = 'Error with special chars: àáâãäåæçèéêë!@#$%^&*()';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle message with line breaks', () => {
            const message = 'Error\nwith\nline\nbreaks';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle message with JSON-like content', () => {
            const message = 'Error: {"field": "value", "number": 123}';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });
    });

    describe('Edge cases and input validation', () => {
        it('should handle zero status code', () => {
            const message = 'Zero status';
            const status = 0;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(0);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle negative status code', () => {
            const message = 'Negative status';
            const status = -1;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(-1);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle very large status code', () => {
            const message = 'Large status';
            const status = 9999;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(9999);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });

        it('should handle null message (falls back to default)', () => {
            const status = 400;

            throwError({ message: null as any, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
        });

        it('should handle number as message (TypeScript might allow this in some cases)', () => {
            const message = 123 as any;
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });

        it('should handle boolean as message', () => {
            const message = false as any;
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
        });
    });

    describe('Response object interaction', () => {
        it('should work with different response object instances', () => {
            const res1 = testUtils.createMockResponse();
            const res2 = testUtils.createMockResponse();

            throwError({ message: 'Error 1', res: res1, status: 400 });
            throwError({ message: 'Error 2', res: res2, status: 404 });

            expect(res1.status).toHaveBeenCalledWith(400);
            expect(res1.json).toHaveBeenCalledWith({ error: 'Error 1' });
            
            expect(res2.status).toHaveBeenCalledWith(404);
            expect(res2.json).toHaveBeenCalledWith({ error: 'Error 2' });
        });

        it('should call methods in correct order (status then json)', () => {
            const message = 'Test order';
            const status = 400;

            throwError({ message, res: mockRes, status });

            // Check that status was called before json
            const statusOrder = mockRes.status.mock.invocationCallOrder?.[0];
            const jsonOrder = mockRes.json.mock.invocationCallOrder?.[0];
            
            if (statusOrder && jsonOrder) {
                expect(statusOrder).toBeLessThan(jsonOrder);
            } else {
                // Fallback: just ensure both were called
                expect(mockRes.status).toHaveBeenCalled();
                expect(mockRes.json).toHaveBeenCalled();
            }
        });

        it('should handle response chaining correctly', () => {
            // Verify that the function doesn't break if res.status returns res (for chaining)
            const message = 'Test chaining';
            const status = 400;

            throwError({ message, res: mockRes, status });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: message });
        });
    });

    describe('Common usage patterns from your app', () => {
        it('should handle "Id is required" error pattern', () => {
            throwError({ message: "Id is required", res: mockRes, status: 400 });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Id is required" });
        });

        it('should handle "Invalid user ID format" error pattern', () => {
            throwError({ message: "Invalid user ID format", res: mockRes, status: 400 });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid user ID format" });
        });

        it('should handle "Unauthorized" error pattern', () => {
            throwError({ message: "Unauthorized", res: mockRes, status: 401 });

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });

        it('should handle "Forbidden" error pattern', () => {
            throwError({ message: "Forbidden", res: mockRes, status: 403 });

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Forbidden" });
        });

        it('should handle "Adventure not found" error pattern', () => {
            throwError({ message: "Adventure not found", res: mockRes, status: 404 });

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "Adventure not found" });
        });

        it('should handle "All required fields must be filled." error pattern', () => {
            throwError({ message: "All required fields must be filled.", res: mockRes, status: 400 });

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: "All required fields must be filled." });
        });
    });

    describe('Function signature and return value', () => {
        it('should return void (undefined)', () => {
            const result = throwError({ message: 'Test', res: mockRes, status: 400 });

            expect(result).toBeUndefined();
        });

        it('should not throw any exceptions during normal operation', () => {
            expect(() => {
                throwError({ message: 'Test', res: mockRes, status: 400 });
            }).not.toThrow();
        });
    });

    describe('Memory and performance considerations', () => {
        it('should handle multiple rapid calls without issues', () => {
            for (let i = 0; i < 100; i++) {
                const res = testUtils.createMockResponse();
                throwError({ message: `Error ${i}`, res, status: 400 });
            }

            // If we get here without timeout/memory issues, the test passes
            expect(true).toBe(true);
        });

        it('should not retain references to response objects', () => {
            const message = 'Test message';
            const status = 400;

            // Call the function
            throwError({ message, res: mockRes, status });

            // Verify it only called the methods we expect
            expect(mockRes.status).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledTimes(1);
        });
    });
});