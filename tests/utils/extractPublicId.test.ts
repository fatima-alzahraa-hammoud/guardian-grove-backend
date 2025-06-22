import { extractPublicId } from '../../src/utils/extractPublicId';

describe('extractPublicId Utility Tests', () => {
    describe('Basic functionality', () => {
        it('should extract public id from simple URL with extension', () => {
            const url = 'https://example.com/image123.jpg';
            const result = extractPublicId(url);
            
            expect(result).toBe('image123');
        });

        it('should extract public id from URL with path', () => {
            const url = 'https://example.com/uploads/photos/vacation2023.png';
            const result = extractPublicId(url);
            
            expect(result).toBe('vacation2023');
        });

        it('should extract public id from deep nested path', () => {
            const url = 'https://cdn.example.com/users/123/avatars/profile_pic.gif';
            const result = extractPublicId(url);
            
            expect(result).toBe('profile_pic');
        });
    });

    describe('Improved handling of multiple dots (vs original)', () => {
        it('should preserve all dots except the last one', () => {
            // Original would return 'my', improved returns 'my.file.name'
            const url = 'https://example.com/my.file.name.jpg';
            const result = extractPublicId(url);
            
            expect(result).toBe('my.file.name');
        });

        it('should handle backup files with multiple extensions', () => {
            // Original would return 'config', improved returns 'config.json'
            const url = 'https://example.com/config.json.bak';
            const result = extractPublicId(url);
            
            expect(result).toBe('config.json');
        });

        it('should handle compressed files', () => {
            // Original would return 'archive', improved returns 'archive.tar'
            const url = 'https://example.com/archive.tar.gz';
            const result = extractPublicId(url);
            
            expect(result).toBe('archive.tar');
        });

        it('should handle version-controlled files', () => {
            // Original would return 'database', improved returns 'database.v2'
            const url = 'https://example.com/database.v2.sql';
            const result = extractPublicId(url);
            
            expect(result).toBe('database.v2');
        });

        it('should handle files with semantic versioning', () => {
            // Original would return 'app', improved returns 'app.1.2'
            const url = 'https://example.com/app.1.2.3';
            const result = extractPublicId(url);
            
            expect(result).toBe('app.1.2');
        });
    });

    describe('Improved query parameter and hash handling', () => {
        it('should remove query parameters', () => {
            const url = 'https://example.com/image456.jpg?width=300&height=200&v=123';
            const result = extractPublicId(url);
            
            expect(result).toBe('image456');
        });

        it('should remove hash fragments', () => {
            const url = 'https://example.com/document789.pdf#page=1&zoom=150';
            const result = extractPublicId(url);
            
            expect(result).toBe('document789');
        });

        it('should remove both query parameters and hash', () => {
            const url = 'https://example.com/file.txt?download=true#section2';
            const result = extractPublicId(url);
            
            expect(result).toBe('file');
        });

        it('should handle empty query parameters', () => {
            const url = 'https://example.com/image.png?';
            const result = extractPublicId(url);
            
            expect(result).toBe('image');
        });

        it('should handle empty hash fragment', () => {
            const url = 'https://example.com/document.pdf#';
            const result = extractPublicId(url);
            
            expect(result).toBe('document');
        });

        it('should handle complex query strings with dots', () => {
            const url = 'https://example.com/my.complex.file.jpg?version=1.2.3&format=jpeg';
            const result = extractPublicId(url);
            
            expect(result).toBe('my.complex.file');
        });
    });

    describe('Input validation and safety', () => {
        it('should handle null input', () => {
            const result = extractPublicId(null as any);
            
            expect(result).toBe('');
        });

        it('should handle undefined input', () => {
            const result = extractPublicId(undefined as any);
            
            expect(result).toBe('');
        });

        it('should handle empty string', () => {
            const result = extractPublicId('');
            
            expect(result).toBe('');
        });

        it('should handle non-string input', () => {
            expect(extractPublicId(123 as any)).toBe('');
            expect(extractPublicId(true as any)).toBe('');
            expect(extractPublicId({} as any)).toBe('');
            expect(extractPublicId([] as any)).toBe('');
        });

        it('should handle whitespace-only input', () => {
            const result = extractPublicId('   ');
            
            expect(result).toBe('   '); // Preserves whitespace in filename
        });
    });

    describe('Edge cases with improved handling', () => {
        it('should handle file without extension', () => {
            const url = 'https://example.com/filename';
            const result = extractPublicId(url);
            
            expect(result).toBe('filename');
        });

        it('should handle URL ending with slash', () => {
            const url = 'https://example.com/folder/';
            const result = extractPublicId(url);
            
            expect(result).toBe('');
        });

        it('should handle URL with only extension (hidden file)', () => {
            const url = 'https://example.com/.jpg';
            const result = extractPublicId(url);
            
            expect(result).toBe('');
        });

        it('should handle hidden files starting with dot', () => {
            expect(extractPublicId('https://example.com/.htaccess')).toBe('');
            expect(extractPublicId('https://example.com/.gitignore')).toBe('');
            expect(extractPublicId('https://example.com/.env.local')).toBe('.env');
        });

        it('should handle hidden files with extension', () => {
            // Hidden files with extensions should return the part before the last dot
            const url = 'https://example.com/.htaccess.bak';
            const result = extractPublicId(url);
            
            expect(result).toBe('.htaccess');
        });

        it('should handle filename with only dots', () => {
            const url = 'https://example.com/...jpg';
            const result = extractPublicId(url);
            
            expect(result).toBe('..');
        });

        it('should handle single character filename', () => {
            expect(extractPublicId('https://example.com/a.jpg')).toBe('a');
            expect(extractPublicId('https://example.com/x')).toBe('x');
        });
    });

    describe('Different file extensions', () => {
        it('should handle common image extensions', () => {
            expect(extractPublicId('https://example.com/photo.jpg')).toBe('photo');
            expect(extractPublicId('https://example.com/image.jpeg')).toBe('image');
            expect(extractPublicId('https://example.com/graphic.png')).toBe('graphic');
            expect(extractPublicId('https://example.com/animation.gif')).toBe('animation');
            expect(extractPublicId('https://example.com/vector.svg')).toBe('vector');
        });

        it('should handle complex extensions', () => {
            expect(extractPublicId('https://example.com/archive.tar.gz')).toBe('archive.tar');
            expect(extractPublicId('https://example.com/backup.sql.bz2')).toBe('backup.sql');
            expect(extractPublicId('https://example.com/data.json.min')).toBe('data.json');
        });

        it('should handle uppercase extensions', () => {
            expect(extractPublicId('https://example.com/IMAGE.JPG')).toBe('IMAGE');
            expect(extractPublicId('https://example.com/Document.PDF')).toBe('Document');
        });
    });

    describe('Special characters and URL encoding', () => {
        it('should handle URL-encoded characters', () => {
            const url = 'https://example.com/my%20image%20file.jpg';
            const result = extractPublicId(url);
            
            expect(result).toBe('my%20image%20file');
        });

        it('should handle special characters in filename', () => {
            expect(extractPublicId('https://example.com/file@2x.png')).toBe('file@2x');
            expect(extractPublicId('https://example.com/image(1).jpg')).toBe('image(1)');
            expect(extractPublicId('https://example.com/file[copy].png')).toBe('file[copy]');
            expect(extractPublicId('https://example.com/user_profile.jpg')).toBe('user_profile');
            expect(extractPublicId('https://example.com/hero-banner.png')).toBe('hero-banner');
        });

        it('should handle Unicode characters', () => {
            expect(extractPublicId('https://example.com/café.jpg')).toBe('café');
            expect(extractPublicId('https://example.com/文件.png')).toBe('文件');
            expect(extractPublicId('https://example.com/файл.gif')).toBe('файл');
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle Cloudinary URLs with complex parameters', () => {
            const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_300,h_200/v1234567890/user.profile.avatar.jpg?_a=123';
            const result = extractPublicId(cloudinaryUrl);
            
            expect(result).toBe('user.profile.avatar');
        });

        it('should handle AWS S3 URLs with versions', () => {
            const s3Url = 'https://my-bucket.s3.amazonaws.com/uploads/image.v2.processed.png?AWSAccessKeyId=123&Expires=456';
            const result = extractPublicId(s3Url);
            
            expect(result).toBe('image.v2.processed');
        });

        it('should handle timestamped files', () => {
            const url = 'https://example.com/backup.2023.12.15.sql';
            const result = extractPublicId(url);
            
            expect(result).toBe('backup.2023.12.15');
        });

        it('should handle development vs production files', () => {
            expect(extractPublicId('https://example.com/app.development.min.js')).toBe('app.development.min');
            expect(extractPublicId('https://example.com/style.production.css')).toBe('style.production');
        });
    });

    describe('Comparison with original function behavior', () => {
        const testCases = [
            {
                input: 'https://example.com/my.file.name.jpg',
                improved: 'my.file.name',
                original: 'my', // would be the original result
                description: 'multiple dots preservation'
            },
            {
                input: 'https://example.com/file.jpg?v=123',
                improved: 'file',
                original: 'file', // same result but query removed
                description: 'query parameter handling'
            },
            {
                input: 'https://example.com/config.json.bak',
                improved: 'config.json',
                original: 'config',
                description: 'backup file extensions'
            },
            {
                input: '',
                improved: '',
                original: '', // would cause error in original
                description: 'empty string safety'
            }
        ];

        testCases.forEach(({ input, improved, description }) => {
            it(`should handle ${description} correctly`, () => {
                const result = extractPublicId(input);
                expect(result).toBe(improved);
            });
        });
    });

    describe('Performance and consistency', () => {
        it('should return consistent results for same input', () => {
            const url = 'https://example.com/test.file.name.jpg?v=123#section';
            
            const result1 = extractPublicId(url);
            const result2 = extractPublicId(url);
            const result3 = extractPublicId(url);
            
            expect(result1).toBe('test.file.name');
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it('should handle large batch processing', () => {
            const urls = Array.from({ length: 1000 }, (_, i) => 
                `https://example.com/file.${i}.processed.jpg?v=${i}`
            );
            
            const results = urls.map(url => extractPublicId(url));
            
            // Check a few samples
            expect(results[0]).toBe('file.0.processed');
            expect(results[100]).toBe('file.100.processed');
            expect(results[999]).toBe('file.999.processed');
            expect(results.length).toBe(1000);
        });

        it('should not modify input', () => {
            const originalUrl = 'https://example.com/test.file.jpg?v=123';
            const urlCopy = originalUrl;
            
            extractPublicId(originalUrl);
            
            expect(originalUrl).toBe(urlCopy);
        });
    });

    describe('Return value validation', () => {
        it('should always return a string', () => {
            const testInputs = [
                'https://example.com/test.jpg',
                'invalid-url',
                '',
                'filename.ext',
                '/',
                'https://example.com/path/',
                null,
                undefined
            ];

            testInputs.forEach(input => {
                const result = extractPublicId(input as any);
                expect(typeof result).toBe('string');
            });
        });

        it('should never return undefined or null', () => {
            const problematicInputs = [null, undefined, '', '/', 'https://example.com/'];
            
            problematicInputs.forEach(input => {
                const result = extractPublicId(input as any);
                expect(result).not.toBeNull();
                expect(result).not.toBeUndefined();
            });
        });
    });
});