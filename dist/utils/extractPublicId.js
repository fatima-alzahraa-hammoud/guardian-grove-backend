"use strict";
// function to extract public id
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = void 0;
const extractPublicId = (url) => {
    const parts = url.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
};
exports.extractPublicId = extractPublicId;
