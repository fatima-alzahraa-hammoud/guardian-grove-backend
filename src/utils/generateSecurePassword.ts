import crypto from 'crypto';


export const generateSecurePassword = () => {
    return crypto.randomBytes(9).toString('base64') 
        .replace(/[+/=]/g, '') 
        .slice(0, 12) 
        .replace(/([a-z])/g, (char, index) => 
            index % 2 === 0 ? char.toUpperCase() : char
    );
};
