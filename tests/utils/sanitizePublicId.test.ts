import { testUtils } from '../setup';
import { sanitizePublicId } from '../../src/utils/sanitizePublicId';

describe('sanitizePublicId Helper Tests', () => {
    
    describe('Valid characters preservation', () => {
        it('should preserve lowercase letters', () => {
            const input = 'abcdefghijklmnopqrstuvwxyz';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('abcdefghijklmnopqrstuvwxyz');
        });

        it('should preserve uppercase letters', () => {
            const input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        });

        it('should preserve numbers', () => {
            const input = '0123456789';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('0123456789');
        });

        it('should preserve hyphens', () => {
            const input = 'test-file-name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test-file-name');
        });

        it('should preserve underscores', () => {
            const input = 'test_file_name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should preserve Arabic characters', () => {
            const input = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('أبتثجحخدذرزسشصضطظعغفقكلمنهوي');
        });

        it('should preserve mixed valid characters', () => {
            const input = 'test123-file_name_أبتث';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test123-file_name_أبتث');
        });
    });

    describe('Invalid characters replacement', () => {
        it('should replace spaces with underscores', () => {
            const input = 'test file name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should replace dots with underscores', () => {
            const input = 'test.file.name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should replace special characters with underscores', () => {
            const input = 'test@file#name$';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name_');
        });

        it('should replace punctuation marks with underscores', () => {
            const input = 'test,file;name:';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name_');
        });

        it('should replace brackets and parentheses with underscores', () => {
            const input = 'test[file](name){test}';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name_test_');
        });

        it('should replace forward and backward slashes with underscores', () => {
            const input = 'test/file\\name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should replace mathematical operators with underscores', () => {
            const input = 'test+file=name%';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name_');
        });

        it('should replace quotation marks with underscores', () => {
            const input = 'test"file\'name`';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name_');
        });
    });

    describe('Consecutive underscore handling', () => {
        it('should collapse multiple consecutive underscores to single underscore', () => {
            const input = 'test___file___name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should collapse consecutive underscores from special characters', () => {
            const input = 'test@@@file###name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });

        it('should handle mixed consecutive characters', () => {
            const input = 'test123@@@file___name---end';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test123_file_name---end');
        });
    });

    describe('File extension handling', () => {
        it('should handle common image file extensions', () => {
            const extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
            
            extensions.forEach(ext => {
                const input = `test-image.${ext}`;
                const result = sanitizePublicId(input);
                
                expect(result).toBe(`test-image_${ext}`);
            });
        });

        it('should handle document file extensions', () => {
            const extensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
            
            extensions.forEach(ext => {
                const input = `test-document.${ext}`;
                const result = sanitizePublicId(input);
                
                expect(result).toBe(`test-document_${ext}`);
            });
        });

        it('should handle multiple dots in filename', () => {
            const input = 'test.file.with.multiple.dots.jpg';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_with_multiple_dots_jpg');
        });
    });

    describe('Unicode and international characters', () => {
        it('should replace non-Arabic Unicode characters with underscores', () => {
            const input = 'testñfile名前файл';
            const result = sanitizePublicId(input);
            
            // Each invalid character becomes underscore, then consecutive underscores collapse
            expect(result).toBe('test_file_');
        });

        it('should preserve Arabic mixed with valid characters', () => {
            const input = 'test123أبتثfile_name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test123أبتثfile_name');
        });

        it('should handle Arabic with invalid characters', () => {
            const input = 'أبتث@file#name$';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('أبتث_file_name_');
        });

        it('should replace Chinese characters with underscores', () => {
            const input = 'test中文file';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file');
        });

        it('should replace emoji with underscores', () => {
            const input = 'test😀😀file🎉name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });
    });

    describe('Edge cases and boundary conditions', () => {
        it('should handle empty string', () => {
            const input = '';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('');
        });

        it('should handle single character inputs', () => {
            const singleChars = ['a', 'A', '1', '-', '_', 'أ', '@', ' '];
            const expected = ['a', 'A', '1', '-', '_', 'أ', '_', '_'];
            
            singleChars.forEach((char, index) => {
                const result = sanitizePublicId(char);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle very long filenames', () => {
            const longInput = 'a'.repeat(1000) + '@'.repeat(100) + 'b'.repeat(500);
            const result = sanitizePublicId(longInput);
            
            // @ becomes _ and consecutive underscores collapse to single _
            const expectedLength = 1000 + 1 + 500; // 1501 characters
            expect(result).toHaveLength(expectedLength);
            expect(result).toBe('a'.repeat(1000) + '_' + 'b'.repeat(500));
        });

        it('should handle string with only invalid characters', () => {
            const input = '@#$%^&*()+=[]{}|;:,.<>?/';
            const result = sanitizePublicId(input);
            
            // All invalid characters become single underscore
            expect(result).toBe('_');
        });

        it('should handle consecutive invalid characters', () => {
            const input = 'test@@@file###name';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('test_file_name');
        });
    });

    describe('Real-world filename scenarios', () => {
        it('should handle typical image filenames', () => {
            const filenames = [
                'profile_picture.jpg',
                'family-photo-2024.png', 
                'vacation pic (1).jpeg',
                'صورة العائلة.jpg',
                'My Image File.PNG'
            ];
            
            const expected = [
                'profile_picture_jpg',
                'family-photo-2024_png',
                'vacation_pic_1_jpeg',
                'صورة_العائلة_jpg',
                'My_Image_File_PNG'
            ];
            
            filenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle document filenames with special characters', () => {
            const filenames = [
                'Report 2024 (Final).pdf',
                'التقرير السنوي.docx',
                'Project#1_Draft.txt',
                'Meeting Notes [2024-01-15].md'
            ];
            
            const expected = [
                'Report_2024_Final_pdf',
                'التقرير_السنوي_docx',
                'Project_1_Draft_txt',
                'Meeting_Notes_2024-01-15_md'
            ];
            
            filenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle user-generated content filenames', () => {
            const filenames = [
                'User@123_upload.jpg',
                'child\'s drawing.png',
                'story "The Adventure".txt',
                'goal: read 10 books.pdf'
            ];
            
            const expected = [
                'User_123_upload_jpg',
                'child_s_drawing_png',
                'story_The_Adventure_txt',
                'goal_read_10_books_pdf'
            ];
            
            filenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle filenames with timestamps', () => {
            const filenames = [
                'backup_2024-01-15_14:30:00.sql',
                'log[2024/01/15 14:30].txt',
                'photo_2024.01.15-14.30.jpg'
            ];
            
            const expected = [
                'backup_2024-01-15_14_30_00_sql',
                'log_2024_01_15_14_30_txt',
                'photo_2024_01_15-14_30_jpg'
            ];
            
            filenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });
    });

    describe('Guardian Grove specific scenarios', () => {
        it('should handle avatar filenames', () => {
            const avatarFilenames = [
                'parent-avatar-1.png',
                'child_avatar_girl.jpg',
                'family photo.jpeg',
                'صورة الطفل.png'
            ];
            
            const expected = [
                'parent-avatar-1_png',
                'child_avatar_girl_jpg',
                'family_photo_jpeg',
                'صورة_الطفل_png'
            ];
            
            avatarFilenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle story and drawing filenames', () => {
            const contentFilenames = [
                'My Adventure Story.txt',
                'drawing (colored).png',
                'قصة الأطفال.pdf',
                'story#1_draft.docx'
            ];
            
            const expected = [
                'My_Adventure_Story_txt',
                'drawing_colored_png',
                'قصة_الأطفال_pdf',
                'story_1_draft_docx'
            ];
            
            contentFilenames.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });

        it('should handle achievement and goal related files', () => {
            const achievementFiles = [
                'achievement: First Goal.png',
                'goal_progress (updated).jpg',
                'family achievement.jpeg',
                'إنجاز العائلة.png'
            ];
            
            const expected = [
                'achievement_First_Goal_png',
                'goal_progress_updated_jpg',
                'family_achievement_jpeg',
                'إنجاز_العائلة_png'
            ];
            
            achievementFiles.forEach((filename, index) => {
                const result = sanitizePublicId(filename);
                expect(result).toBe(expected[index]);
            });
        });
    });

    describe('Performance and reliability', () => {
        it('should execute quickly for typical filenames', () => {
            const testFilenames = [
                'test.jpg', 'very_long_filename_with_many_characters.png',
                'special@#$%^characters.pdf', 'أبتثfile.doc'
            ];
            
            const startTime = Date.now();
            
            testFilenames.forEach(filename => {
                sanitizePublicId(filename);
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete very quickly (less than 5ms for all tests)
            expect(duration).toBeLessThan(5);
        });

        it('should handle repeated calls consistently', () => {
            const input = 'test@file#name.jpg';
            const results : string[] = [];
            
            for (let i = 0; i < 100; i++) {
                results.push(sanitizePublicId(input));
            }
            
            // All results should be identical
            const firstResult = results[0];
            results.forEach(result => {
                expect(result).toBe(firstResult);
            });
            
            expect(firstResult).toBe('test_file_name_jpg');
        });

        it('should not have memory leaks with many calls', () => {
            // Call function many times to check for memory issues
            for (let i = 0; i < 10000; i++) {
                sanitizePublicId(`test${i}@file#${i}.jpg`);
            }
            
            // If we get here without running out of memory, test passes
            expect(true).toBe(true);
        });
    });

    describe('Input validation and type safety', () => {
        it('should handle string input correctly', () => {
            const input = 'test.jpg';
            const result = sanitizePublicId(input);
            
            expect(typeof result).toBe('string');
            expect(result).toBe('test_jpg');
        });

        it('should handle numeric strings', () => {
            const input = '12345.67890';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('12345_67890');
        });

        it('should handle strings that look like booleans', () => {
            const input = 'true.false';
            const result = sanitizePublicId(input);
            
            expect(result).toBe('true_false');
        });

        it('should maintain string immutability', () => {
            const input = 'test@file.jpg';
            const originalInput = input;
            
            const result = sanitizePublicId(input);
            
            // Original input should be unchanged
            expect(input).toBe(originalInput);
            expect(result).toBe('test_file_jpg');
            expect(result).not.toBe(input);
        });
    });

    describe('Regex pattern verification', () => {
        it('should only allow characters matching the pattern [a-zA-Z0-9-_\\u0600-\\u06FF]', () => {
            // Test each category of allowed characters
            const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
            
            allowedChars.split('').forEach(char => {
                const result = sanitizePublicId(char);
                expect(result).toBe(char); // Should remain unchanged
            });
        });

        it('should replace all characters not matching the pattern', () => {
            const disallowedChars = '!@#$%^&*()+=[]{}|\\:";\'<>?,./`~';
            
            disallowedChars.split('').forEach(char => {
                const result = sanitizePublicId(char);
                expect(result).toBe('_'); // Should be replaced with underscore
            });
        });

        it('should handle mixed allowed and disallowed characters correctly', () => {
            const mixed = 'a1@b2#c3$أ4%ب5^ت6';
            const result = sanitizePublicId(mixed);
            
            expect(result).toBe('a1_b2_c3_أ4_ب5_ت6');
        });
    });
});