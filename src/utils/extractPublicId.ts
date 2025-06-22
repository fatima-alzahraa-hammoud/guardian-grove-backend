// function to extract public id

export const extractPublicIdImproved = (url: string): string => {
    // Handle empty or invalid input
    if (!url || typeof url !== 'string') {
        return '';
    }

    // Get the last part of the URL (filename)
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    
    // Handle empty filename (URL ends with /)
    if (!filename) {
        return '';
    }
    
    // Remove query parameters and hash fragments
    const cleanFilename = filename.split('?')[0].split('#')[0];
    
    // Handle files without extension
    const lastDotIndex = cleanFilename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
        // No extension or starts with dot (hidden file)
        return lastDotIndex === 0 ? '' : cleanFilename;
    }
    
    // Extract everything before the last dot
    return cleanFilename.substring(0, lastDotIndex);
};
