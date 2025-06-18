"use strict";
//function to set the public id
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePublicId = void 0;
const sanitizePublicId = (filename) => {
    return filename.replace(/[^a-zA-Z0-9-_أ-ي]/g, '_');
};
exports.sanitizePublicId = sanitizePublicId;
