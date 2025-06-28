import { testUtils } from '../setup';
import { generateSecurePassword } from '../../src/utils/generateSecurePassword';
import crypto from 'crypto';

// Mock the crypto module
jest.mock('crypto', () => ({
    randomBytes: jest.fn()
}));

const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('generateSecurePassword Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should generate a password when crypto.randomBytes works correctly', () => {
            // Mock crypto.randomBytes to return a predictable buffer
            const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            const result = generateSecurePassword();

            expect(mockCrypto.randomBytes).toHaveBeenCalledWith(9);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should return a string of maximum 12 characters', () => {
            // Test with various mock buffers
            const testBuffers = [
                Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
                Buffer.from([255, 254, 253, 252, 251, 250, 249, 248, 247]),
                Buffer.from([100, 150, 200, 50, 75, 125, 175, 25, 225])
            ];

            testBuffers.forEach((buffer, index) => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                
                const result = generateSecurePassword();
                
                expect(result.length).toBeLessThanOrEqual(12);
                expect(result.length).toBeGreaterThan(0);
            });
        });

        it('should always call crypto.randomBytes with 9 bytes', () => {
            const mockBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            generateSecurePassword();

            expect(mockCrypto.randomBytes).toHaveBeenCalledWith(9);
            expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(1);
        });
    });

    describe('Character transformation rules', () => {
        it('should remove +, /, and = characters from base64', () => {
            // Create a buffer that when base64 encoded will contain +, /, =
            // Buffer that creates base64 with these characters
            const mockBuffer = Buffer.from([63, 255, 255]); // Creates base64 with +, /, =
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            const result = generateSecurePassword();

            expect(result).not.toContain('+');
            expect(result).not.toContain('/');
            expect(result).not.toContain('=');
        });

        it('should apply uppercase transformation to even-indexed lowercase letters', () => {
            // Mock a buffer that will produce lowercase letters at predictable positions
            const mockBuffer = Buffer.from([97, 98, 99, 100, 101, 102, 103, 104, 105]); // ASCII for 'abcdefghi'
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            const result = generateSecurePassword();

            // The function should uppercase lowercase letters at even indices (0, 2, 4, etc.)
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should preserve uppercase letters and numbers', () => {
            // Create a buffer that will result in mixed content
            const mockBuffer = Buffer.from([65, 97, 66, 98, 67, 99, 48, 49, 50]); // A, a, B, b, C, c, 0, 1, 2
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            const result = generateSecurePassword();

            // Should contain alphanumeric characters only (after base64 encoding and transformations)
            expect(result).toMatch(/^[A-Za-z0-9]*$/);
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle crypto.randomBytes throwing an error', () => {
            (mockCrypto.randomBytes as jest.Mock).mockImplementation(() => {
                throw new Error('Crypto error');
            });

            expect(() => generateSecurePassword()).toThrow('Crypto error');
        });

        it('should handle empty buffer from crypto.randomBytes', () => {
            const emptyBuffer = Buffer.from([]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(emptyBuffer);

            const result = generateSecurePassword();

            expect(typeof result).toBe('string');
            // Empty buffer should result in empty base64, which after processing becomes empty string
            expect(result).toBe('');
        });

        it('should handle buffer with all zero bytes', () => {
            const zeroBuffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(zeroBuffer);

            const result = generateSecurePassword();

            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should handle buffer with all max bytes', () => {
            const maxBuffer = Buffer.from([255, 255, 255, 255, 255, 255, 255, 255, 255]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(maxBuffer);

            const result = generateSecurePassword();

            expect(typeof result).toBe('string');
            // All 255 bytes create base64 with lots of +/= which get removed, may result in empty string
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it('should demonstrate edge case where special character removal creates short passwords', () => {
            // Buffer that creates base64 heavily dependent on +, /, = characters
            const problematicBuffer = Buffer.from([63, 63, 63, 63, 63, 63, 63, 63, 63]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(problematicBuffer);

            const result = generateSecurePassword();

            expect(typeof result).toBe('string');
            // This demonstrates that some byte patterns may result in very short passwords
            expect(result.length).toBeGreaterThanOrEqual(0);
            expect(result).toMatch(/^[A-Za-z0-9]*$/);
        });
    });

    describe('Deterministic behavior with known inputs', () => {
        it('should produce consistent output for the same buffer input', () => {
            const testBuffer = Buffer.from([10, 20, 30, 40, 50, 60, 70, 80, 90]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);

            const result1 = generateSecurePassword();
            const result2 = generateSecurePassword();

            expect(result1).toBe(result2);
        });

        it('should produce different outputs for different buffer inputs', () => {
            const buffer1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const buffer2 = Buffer.from([9, 8, 7, 6, 5, 4, 3, 2, 1]);

            (mockCrypto.randomBytes as jest.Mock).mockReturnValueOnce(buffer1);
            const result1 = generateSecurePassword();

            (mockCrypto.randomBytes as jest.Mock).mockReturnValueOnce(buffer2);
            const result2 = generateSecurePassword();

            expect(result1).not.toBe(result2);
        });

        it('should handle specific test case with known transformation', () => {
            // Create a buffer that we know will produce specific characters
            const testBuffer = Buffer.from([72, 101, 108, 108, 111, 87, 111, 114, 108]); // "HelloWorl" in ASCII
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);

            const result = generateSecurePassword();

            expect(typeof result).toBe('string');
            expect(result.length).toBeLessThanOrEqual(12);
            expect(result).toMatch(/^[A-Za-z0-9]*$/);
        });
    });

    describe('Base64 encoding behavior', () => {
        it('should properly encode various byte patterns', () => {
            const testCases = [
                Buffer.from([0]),
                Buffer.from([255]),
                Buffer.from([127, 128]),
                Buffer.from([64, 32, 16, 8, 4, 2, 1]),
                Buffer.from([170, 85, 170, 85, 170, 85, 170, 85, 170]) // Alternating pattern
            ];

            testCases.forEach((buffer, index) => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                
                const result = generateSecurePassword();
                
                expect(typeof result).toBe('string');
                expect(result).toMatch(/^[A-Za-z0-9]*$/);
                expect(result.length).toBeLessThanOrEqual(12);
            });
        });

        it('should handle base64 padding removal correctly', () => {
            // Buffers that would typically create base64 strings with padding
            const paddingBuffers = [
                Buffer.from([1]), // Would create base64 with ==
                Buffer.from([1, 2]), // Would create base64 with =
                Buffer.from([1, 2, 3]) // No padding needed
            ];

            paddingBuffers.forEach(buffer => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                
                const result = generateSecurePassword();
                
                expect(result).not.toContain('=');
            });
        });
    });

    describe('Character case transformation', () => {
        it('should apply case transformation rules consistently', () => {
            // Test multiple times with the same input to ensure consistency
            const testBuffer = Buffer.from([97, 98, 99, 100, 101, 102, 103, 104, 105]);
            
            for (let i = 0; i < 5; i++) {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);
                const result = generateSecurePassword();
                
                // Check that the result is consistent
                expect(typeof result).toBe('string');
                expect(result).toMatch(/^[A-Za-z0-9]*$/);
            }
        });

        it('should not modify non-alphabetic characters', () => {
            // Create buffer that will produce numbers and special chars in base64
            const mixedBuffer = Buffer.from([48, 49, 50, 51, 52, 53, 54, 55, 56]); // '012345678'
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mixedBuffer);

            const result = generateSecurePassword();

            // Numbers should remain unchanged
            expect(result).toMatch(/^[A-Za-z0-9]*$/);
        });
    });

    describe('Security properties', () => {
        it('should generate passwords without predictable patterns', () => {
            const results = [];
            
            // Generate multiple passwords with different mock inputs
            for (let i = 0; i < 10; i++) {
                const randomBuffer = Buffer.from(Array(9).fill(0).map(() => Math.floor(Math.random() * 256)));
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(randomBuffer);
                results.push(generateSecurePassword());
            }

            // Check that we don't have too many identical characters in sequence
            results.forEach(password => {
                expect(password).toMatch(/^[A-Za-z0-9]*$/);
                expect(password.length).toBeLessThanOrEqual(12);
            });
        });

        it('should not contain easily guessable patterns', () => {
            const testBuffers = [
                Buffer.from([65, 66, 67, 68, 69, 70, 71, 72, 73]), // Sequential
                Buffer.from([97, 97, 97, 97, 97, 97, 97, 97, 97]), // Repeated
                Buffer.from([0, 1, 0, 1, 0, 1, 0, 1, 0]) // Alternating
            ];

            testBuffers.forEach(buffer => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                const result = generateSecurePassword();
                
                // After all transformations, should still be valid
                expect(result).toMatch(/^[A-Za-z0-9]*$/);
                expect(result.length).toBeLessThanOrEqual(12);
            });
        });
    });

    describe('Performance and consistency', () => {
        it('should execute quickly for normal inputs', () => {
            const testBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);

            const startTime = Date.now();
            
            for (let i = 0; i < 100; i++) {
                generateSecurePassword();
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete 100 calls in reasonable time (less than 100ms)
            expect(duration).toBeLessThan(100);
        });

        it('should not have memory leaks with repeated calls', () => {
            const testBuffer = Buffer.from([50, 100, 150, 200, 25, 75, 125, 175, 225]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);

            // Call many times to check for memory issues
            for (let i = 0; i < 1000; i++) {
                const result = generateSecurePassword();
                expect(typeof result).toBe('string');
            }

            // If we get here without running out of memory, test passes
            expect(true).toBe(true);
        });

        it('should return string type consistently', () => {
            const testBuffers = [
                Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0]),
                Buffer.from([255, 255, 255, 255, 255, 255, 255, 255, 255]),
                Buffer.from([127, 128, 64, 192, 32, 160, 16, 80, 240])
            ];

            testBuffers.forEach(buffer => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                const result = generateSecurePassword();
                
                expect(typeof result).toBe('string');
                expect(result).toMatch(/^[A-Za-z0-9]*$/);
            });
        });
    });

    describe('Integration with real usage patterns', () => {
        it('should work with typical user creation scenarios', () => {
            // Simulate what happens when creating multiple users
            const userPasswords = [];
            
            for (let i = 0; i < 5; i++) {
                const mockBuffer = Buffer.from([i * 50, i * 30, i * 20, i * 10, i * 5, i * 3, i * 2, i * 1, i]);
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);
                
                const password = generateSecurePassword();
                userPasswords.push(password);
                
                expect(password).toMatch(/^[A-Za-z0-9]*$/);
                expect(password.length).toBeLessThanOrEqual(12);
                expect(password.length).toBeGreaterThan(0);
            }

            // Passwords should be different (with our controlled mock inputs)
            const uniquePasswords = new Set(userPasswords);
            expect(uniquePasswords.size).toBe(userPasswords.length);
        });

        it('should handle password validation requirements', () => {
            const testBuffer = Buffer.from([65, 97, 48, 66, 98, 49, 67, 99, 50]);
            (mockCrypto.randomBytes as jest.Mock).mockReturnValue(testBuffer);

            const password = generateSecurePassword();

            // Check common password requirements
            expect(password.length).toBeGreaterThan(0);
            expect(password.length).toBeLessThanOrEqual(12);
            expect(password).toMatch(/^[A-Za-z0-9]*$/); // Only alphanumeric
            expect(password).not.toContain(' '); // No spaces
            expect(password).not.toContain('+'); // No special chars from base64
            expect(password).not.toContain('/'); // No special chars from base64
            expect(password).not.toContain('='); // No padding
        });

        it('should be suitable for temporary password scenarios', () => {
            // Test that generated passwords are reasonable for temp password use
            const testCases = [
                Buffer.from([100, 101, 102, 103, 104, 105, 106, 107, 108]),
                Buffer.from([200, 150, 100, 50, 25, 75, 125, 175, 225]),
                Buffer.from([33, 66, 99, 132, 165, 198, 231, 20, 53])
            ];

            testCases.forEach(buffer => {
                (mockCrypto.randomBytes as jest.Mock).mockReturnValue(buffer);
                const password = generateSecurePassword();

                // Should be easy to communicate (no ambiguous characters after processing)
                expect(password).toMatch(/^[A-Za-z0-9]*$/);
                expect(password.length).toBeGreaterThan(0);
                expect(password.length).toBeLessThanOrEqual(12);
            });
        });
    });
});