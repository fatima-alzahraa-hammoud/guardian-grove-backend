import { v2 as cloudinary } from 'cloudinary';
import { sanitizePublicId } from './sanitizePublicId';
import path from 'path';

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    resource_type: string;
}

export interface UploadOptions {
    folder: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicIdPrefix?: string;
    transformation?: any;
}

// upload file to Cloudinary
export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions
): Promise<CloudinaryUploadResult> => {
    const {
        folder,
        resourceType = 'image',
        publicIdPrefix = '',
        transformation
    } = options;

    // Create sanitized public ID
    const timestamp = Date.now();
    const baseName = path.basename(fileName, path.extname(fileName));
    const sanitizedBaseName = sanitizePublicId(baseName);
    const publicId = publicIdPrefix 
        ? `${publicIdPrefix}/${timestamp}-${sanitizedBaseName}`
        : `${timestamp}-${sanitizedBaseName}`;

    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            resource_type: resourceType,
            public_id: publicId,
            folder: folder
        };

        if (transformation) {
            uploadOptions.transformation = transformation;
        }

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary upload failed: ${error.message}`));
                } else if (result) {
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format,
                        resource_type: result.resource_type
                    });
                } else {
                    reject(new Error('Cloudinary upload failed: No result returned'));
                }
            }
        );

        stream.end(fileBuffer);
    });
};

export const uploadUserAvatar = async (
    fileBuffer: Buffer,
    fileName: string
): Promise<CloudinaryUploadResult> => {
    return uploadToCloudinary(fileBuffer, fileName, {
        folder: 'guardian grove project/avatars',
        transformation: {
            width: 300,
            height: 300,
            crop: 'fill',
            quality: 'auto:good'
        }
    });
};

export const uploadFamilyAvatar = async (
    fileBuffer: Buffer,
    fileName: string
): Promise<CloudinaryUploadResult> => {
    return uploadToCloudinary(fileBuffer, fileName, {
        folder: 'guardian grove project/family-avatars',
        transformation: {
            width: 400,
            height: 400,
            crop: 'fill',
            quality: 'auto:good'
        }
    });
};

export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                reject(new Error(`Cloudinary delete failed: ${error.message}`));
            } else {
                resolve(result);
            }
        });
    });
};

export const extractPublicIdFromUrl = (cloudinaryUrl: string): string => {
    try {
        
        // Decode URL first to handle encoded characters like %20
        const decodedUrl = decodeURIComponent(cloudinaryUrl);
        
        const urlParts = decodedUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex === -1) {
            return '';
        }
        
        // Get everything after version (vX_XXXXXX) or after upload if no version
        const afterUpload = urlParts.slice(uploadIndex + 1);
        let publicIdParts: string[];
        
        // Check if there's a version parameter
        if (afterUpload[0] && afterUpload[0].startsWith('v')) {
            publicIdParts = afterUpload.slice(1);
        } else {
            publicIdParts = afterUpload;
        }
        
        // Remove file extension from the last part
        const lastPart = publicIdParts[publicIdParts.length - 1];
        const lastPartWithoutExt = lastPart.split('.')[0];
        publicIdParts[publicIdParts.length - 1] = lastPartWithoutExt;
        
        const result = publicIdParts.join('/');
        return result;
    } catch (error) {
        return '';
    }
};

// Upload message files (images, documents, etc.)
export const uploadMessageFile = async (buffer: Buffer, originalName: string) => {
    const sanitizedName = sanitizePublicId(originalName);
    const timestamp = Date.now();
    
    return new Promise((resolve, reject) => {
        const resourceType = isImageFile(originalName) ? 'image' : 'raw';
        
        cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                public_id: `messages/${timestamp}_${sanitizedName}`,
                folder: 'guardian_grove/messages',
                // For images, enable transformations
                ...(resourceType === 'image' && {
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' },
                        { width: 1200, height: 1200, crop: 'limit' }
                    ]
                })
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

// Helper function to check if file is an image
const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(extension);
};

export const uploadAudioFile = async (
    fileBuffer: Buffer,
    fileName: string,
    options?: {
        folder?: string;
        publicIdPrefix?: string;
        transformation?: any;
    }
): Promise<CloudinaryUploadResult> => {
    const {
        folder = 'guardian grove project/audio',
        publicIdPrefix = '',
        transformation
    } = options || {};

    // Create sanitized public ID
    const timestamp = Date.now();
    const baseName = path.basename(fileName, path.extname(fileName));
    const sanitizedBaseName = sanitizePublicId(baseName);
    const publicId = publicIdPrefix 
        ? `${publicIdPrefix}/${timestamp}-${sanitizedBaseName}`
        : `${timestamp}-${sanitizedBaseName}`;

    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            resource_type: 'video', // Audio files use 'video' resource type in Cloudinary
            public_id: publicId,
            folder: folder
        };

        if (transformation) {
            uploadOptions.transformation = transformation;
        }

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(new Error(`Cloudinary audio upload failed: ${error.message}`));
                } else if (result) {
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format,
                        resource_type: result.resource_type
                    });
                } else {
                    reject(new Error('Cloudinary audio upload failed: No result returned'));
                }
            }
        );

        stream.end(fileBuffer);
    });
};

// Upload AI response audio files
export const uploadAIResponseAudio = async (
    fileBuffer: Buffer,
    fileName: string,
    chatId?: string
): Promise<CloudinaryUploadResult> => {
    return uploadAudioFile(fileBuffer, fileName, {
        folder: 'guardian grove project/ai-responses',
        publicIdPrefix: chatId ? `chat-${chatId}` : '',
        transformation: {
            quality: 'auto',
            format: 'mp3' // Ensure consistent format
        }
    });
};

// Upload message audio files (voice messages from users)
export const uploadMessageAudio = async (
    fileBuffer: Buffer,
    fileName: string,
    userId?: string
): Promise<CloudinaryUploadResult> => {
    return uploadAudioFile(fileBuffer, fileName, {
        folder: 'guardian grove project/voice-messages',
        publicIdPrefix: userId ? `user-${userId}` : '',
        transformation: {
            quality: 'auto',
            format: 'mp3'
        }
    });
};

// Helper function to check if file is an audio file
const isAudioFile = (filename: string): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return audioExtensions.includes(extension);
};

// Updated uploadMessageFile function to handle audio files
export const uploadMessageFileWithAudio = async (buffer: Buffer, originalName: string) => {
    const sanitizedName = sanitizePublicId(originalName);
    const timestamp = Date.now();
    
    return new Promise((resolve, reject) => {
        let resourceType: 'image' | 'video' | 'raw';
        
        if (isImageFile(originalName)) {
            resourceType = 'image';
        } else if (isAudioFile(originalName)) {
            resourceType = 'video'; // Audio files use 'video' resource type
        } else {
            resourceType = 'raw';
        }
        
        cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                public_id: `messages/${timestamp}_${sanitizedName}`,
                folder: 'guardian_grove/messages',
                // For images, enable transformations
                ...(resourceType === 'image' && {
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' },
                        { width: 1200, height: 1200, crop: 'limit' }
                    ]
                }),
                // For audio files, enable transformations
                ...(resourceType === 'video' && isAudioFile(originalName) && {
                    transformation: [
                        { quality: 'auto', format: 'mp3' }
                    ]
                })
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

// Delete audio files from Cloudinary
export const deleteAudioFromCloudinary = async (publicId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, {
            resource_type: 'video' // Use 'video' for audio files
        }, (error, result) => {
            if (error) {
                reject(new Error(`Cloudinary audio delete failed: ${error.message}`));
            } else {
                resolve(result);
            }
        });
    });
};
