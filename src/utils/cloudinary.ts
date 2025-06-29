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
        publicIdPrefix: 'avatars',
        transformation: {
            width: 300,
            height: 300,
            crop: 'fill',
            quality: 'auto:good'
        }
    });
};
