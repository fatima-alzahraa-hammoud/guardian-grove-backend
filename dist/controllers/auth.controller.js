"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetPassword = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const error_1 = require("../utils/error");
const user_model_1 = require("../models/user.model");
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const family_model_1 = require("../models/family.model");
const generateSecurePassword_1 = require("../utils/generateSecurePassword");
const email_service_1 = require("../services/email.service");
dotenv_1.default.config();
const JWT_SECRET_KEY = process.env.JWT_SECRET;
// login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return (0, error_1.throwError)({ message: "Name, email, and password are required.", res, status: 400 });
        }
        const user = yield user_model_1.User.findOne({
            name: name,
            email: email,
        });
        if (!user) {
            return (0, error_1.throwError)({ message: "Invalid credentials. User not found.", res, status: 404 });
        }
        // Verify password
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, error_1.throwError)({ message: "Invalid password.", res, status: 401 });
        }
        if (!JWT_SECRET_KEY) {
            return (0, error_1.throwError)({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        }
        const token = yield jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY);
        res.status(200).json({
            user: user,
            token,
            requiresPasswordChange: user.isTempPassword || false,
            message: user.isTempPassword
                ? 'Please set a new password'
                : 'Login successful'
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Something went wrong while logging in.", res, status: 500 });
    }
});
exports.login = login;
// register
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const { name, email, password, confirmPassword, birthday, gender, role, avatar, interests, familyName, familyAvatar } = data;
        // verify all fields are filled
        if (!name || !email || !password || !confirmPassword || !birthday || !gender || !role || !avatar || !interests || !familyName || !familyAvatar) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        if (password !== confirmPassword) {
            return (0, error_1.throwError)({ message: "Passwords do not match", res, status: 400 });
        }
        // Email Validation
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return (0, error_1.throwError)({ message: "Invalid email format.", res, status: 400 });
        }
        // Role validation
        const validRoles = ['parent', 'admin'];
        if (!validRoles.includes(role)) {
            if (role === "child") {
                return (0, error_1.throwError)({ message: "Children must be added by a parent.", res, status: 400 });
            }
            return (0, error_1.throwError)({ message: "Invalid role.", res, status: 400 });
        }
        if (!Array.isArray(interests)) {
            return (0, error_1.throwError)({ message: "Interests must be an array.", res, status: 400 });
        }
        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            return (0, error_1.throwError)({ message: "Gender must be either 'male' or 'female'.", res, status: 400 });
        }
        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            return (0, error_1.throwError)({ message: "Invalid birthday format.", res, status: 400 });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return (0, error_1.throwError)({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        // Family Assignment
        let family = yield family_model_1.Family.findOne({ email });
        if (!family) {
            family = new family_model_1.Family({
                familyName: familyName,
                email,
                familyAvatar: familyAvatar,
                members: [],
                createdAt: new Date()
            });
            yield family.save();
        }
        else {
            if (family.familyName !== familyName) {
                return (0, error_1.throwError)({ message: "Wrong family name", res, status: 400 });
            }
        }
        // Check if a family member with the same name already exists
        const existingFamilyMember = yield user_model_1.User.findOne({ name, familyId: family._id });
        if (existingFamilyMember) {
            return (0, error_1.throwError)({ message: "A member with this name already exists in the family.", res, status: 400 });
        }
        // Create the user and link to family
        const newUser = yield user_model_1.User.create(Object.assign(Object.assign({}, data), { password: hashedPassword, familyId: family._id }));
        // Add user to the family members list if not already present
        if (!family.members.includes(newUser.id)) {
            family.members.push({ _id: newUser.id, role, name, gender, avatar });
            yield family.save();
        }
        if (!JWT_SECRET_KEY) {
            return (0, error_1.throwError)({ message: "JWT_SECRET_KEY is not defined", res, status: 500 });
        }
        const token = yield jsonwebtoken_1.default.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET_KEY);
        res.status(200).send({ user: newUser, token: token, family: family });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Something went wrong while registering.", res, status: 500 });
    }
});
exports.register = register;
// forget password API
const forgetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email } = req.body;
        const user = yield user_model_1.User.findOne({ email, name });
        if (!user) {
            return (0, error_1.throwError)({ message: "Invalid credentials. User not found.", res, status: 404 });
        }
        const tempPassword = (0, generateSecurePassword_1.generateSecurePassword)();
        const hashedPassword = yield bcrypt_1.default.hash(tempPassword, 12);
        user.password = hashedPassword;
        user.isTempPassword = true;
        user.passwordChangedAt = new Date();
        yield user.save();
        const from = `"Guardian Grove" <${process.env.EMAIL_USERNAME}>`;
        const to = email;
        const subject = "Your Temporary Password";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Hello ${user.name},</h2>
                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                <p>This password will expire in 1 hour.</p>
                <p>Please use this to login and change your password immediately.</p>
                <br/>
                <p>Thank you,</p>
                <p><strong>Guardian Grove Team</strong></p>
            </div>
        `;
        // Send email with the temporary password
        yield (0, email_service_1.sendMail)(from, to, subject, html);
        res.status(200).send({ message: "Temporary password sent to your email." });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error sending temporary password.", res, status: 500 });
    }
});
exports.forgetPassword = forgetPassword;
