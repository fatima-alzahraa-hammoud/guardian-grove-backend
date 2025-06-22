import { testUtils } from '../setup';
import { checkId } from '../../src/utils/checkId';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('mongoose');

const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('checkId Utility Tests', () => {
    let mockRes: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRes = testUtils.createMockResponse();
        
        // Setup default mongoose mock
        mockMongoose.Types = {
            ObjectId: {
                isValid: jest.fn()
            }
        } as any;
    });

    describe('Valid ID scenarios', () => {
        it('should return true for valid ObjectId', () => {
            const validId = '507f1f77bcf86cd799439011';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            const result = checkId({ id: validId, res: mockRes });

            expect(result).toBe(true);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should return true for another valid ObjectId format', () => {
            const validId = '60b5d4f4f3b4c8a1b8e4d2c1';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            const result = checkId({ id: validId, res: mockRes });

            expect(result).toBe(true);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should return true for ObjectId with mixed case (if valid)', () => {
            const validId = '507F1F77BCF86CD799439011';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            const result = checkId({ id: validId, res: mockRes });

            expect(result).toBe(true);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('Missing ID scenarios', () => {
        it('should return false and throw error when id is undefined', () => {
            const result = checkId({ id: undefined as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Id is required"
            });
            expect(mockMongoose.Types.ObjectId.isValid).not.toHaveBeenCalled();
        });

        it('should return false and throw error when id is null', () => {
            const result = checkId({ id: null as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Id is required"
            });
            expect(mockMongoose.Types.ObjectId.isValid).not.toHaveBeenCalled();
        });

        it('should return false and throw error when id is empty string', () => {
            const result = checkId({ id: '', res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Id is required"
            });
            expect(mockMongoose.Types.ObjectId.isValid).not.toHaveBeenCalled();
        });

        it('should return false and throw error when id is whitespace only', () => {
            const result = checkId({ id: '   ', res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
            // Note: Whitespace strings pass the !id check but fail mongoose validation
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('   ');
        });

        it('should return false and throw error when id is tab/newline characters', () => {
            const result = checkId({ id: '\t\n\r', res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
            // Note: Whitespace strings pass the !id check but fail mongoose validation
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('\t\n\r');
        });
    });

    describe('Invalid ID format scenarios', () => {
        it('should return false and throw error for short invalid id', () => {
            const invalidId = 'abc123';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should return false and throw error for long invalid id', () => {
            const invalidId = 'this-is-definitely-not-a-valid-mongodb-objectid';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should return false and throw error for id with invalid characters', () => {
            const invalidId = '507f1f77bcf86cd79943901z'; // 'z' is not valid hex
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should return false and throw error for id with special characters', () => {
            const invalidId = '507f1f77-bcf8-6cd7-9943-9011';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should return false and throw error for numeric string id', () => {
            const invalidId = '123456789012345678901234';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should return false and throw error for wrong length id', () => {
            const invalidId = '507f1f77bcf86cd799439'; // Too short
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });
    });

    describe('Edge cases and data types', () => {
        it('should handle number input (converted to string)', () => {
            const numberId = 123456789012345678901234;
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: numberId as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(numberId);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should handle boolean input', () => {
            const booleanId = true;

            const result = checkId({ id: booleanId as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should handle object input', () => {
            const objectId = { _id: '507f1f77bcf86cd799439011' };

            const result = checkId({ id: objectId as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should handle array input', () => {
            const arrayId = ['507f1f77bcf86cd799439011'];

            const result = checkId({ id: arrayId as any, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });
    });

    describe('Response object handling', () => {
        it('should pass correct response object to throwError', () => {
            const customMockRes = testUtils.createMockResponse();
            const invalidId = 'invalid';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: customMockRes });

            expect(result).toBe(false);
            expect(customMockRes.status).toHaveBeenCalledWith(400);
            expect(customMockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should work with different response object instances', () => {
            const res1 = testUtils.createMockResponse();
            const res2 = testUtils.createMockResponse();
            
            // First call
            checkId({ id: '', res: res1 });
            expect(res1.status).toHaveBeenCalledWith(400);
            expect(res1.json).toHaveBeenCalledWith({
                error: "Id is required"
            });

            // Second call with different response object
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);
            checkId({ id: 'invalid', res: res2 });
            expect(res2.status).toHaveBeenCalledWith(400);
            expect(res2.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });
    });

    describe('Function call order and behavior', () => {
        it('should not call mongoose validation if id is missing', () => {
            checkId({ id: '', res: mockRes });

            expect(mockMongoose.Types.ObjectId.isValid).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should call mongoose validation only after id existence check passes', () => {
            const validId = '507f1f77bcf86cd799439011';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            checkId({ id: validId, res: mockRes });

            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledTimes(1);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should call response methods exactly once for invalid format', () => {
            const invalidId = 'invalid';
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            checkId({ id: invalidId, res: mockRes });

            expect(mockRes.status).toHaveBeenCalledTimes(1);
            expect(mockRes.json).toHaveBeenCalledTimes(1);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledTimes(1);
        });
    });

    describe('Integration with common use cases', () => {
        it('should work with testUtils valid ObjectId', () => {
            const validId = testUtils.validObjectId; // '507f1f77bcf86cd799439011'
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            const result = checkId({ id: validId, res: mockRes });

            expect(result).toBe(true);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId);
        });

        it('should work with testUtils invalid ObjectId', () => {
            const invalidId = testUtils.invalidObjectId; // 'invalid-id-format'
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

            const result = checkId({ id: invalidId, res: mockRes });

            expect(result).toBe(false);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid user ID format"
            });
        });

        it('should work with common test IDs from testUtils', () => {
            const testId = testUtils.ids.user;
            (mockMongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

            const result = checkId({ id: testId, res: mockRes });

            expect(result).toBe(true);
            expect(mockMongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(testId);
        });
    });
});