"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const PasswordUtils_1 = require("../../../utils/PasswordUtils");
const UserRepository_1 = require("../repos/UserRepository");
class AuthService {
    static generateAccessToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    }
    static generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static async register(email, password, role) {
        const hashedPassword = await PasswordUtils_1.PasswordUtils.hash(password);
        return await UserRepository_1.UserRepository.create({
            email,
            password: hashedPassword,
            role,
        });
    }
    static async validateCredentials(email, password) {
        const user = await UserRepository_1.UserRepository.findByEmail(email);
        if (!user) {
            return null;
        }
        const isValidPassword = await PasswordUtils_1.PasswordUtils.compare(password, user.password);
        if (!isValidPassword) {
            return null;
        }
        return user;
    }
}
exports.AuthService = AuthService;
