//function to set the public id

export const sanitizePublicId = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9-_أ-ي]/g, '_');
};