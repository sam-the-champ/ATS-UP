"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // 1. Check if the Bearer token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    const token = authHeader.split(' ')[1];
    try {
        // 2. Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // 3. Inject user data into request object
        req.user = decoded;
        // 4. Move to the next function/middleware
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Invalid or expired token." });
    }
};
exports.authenticate = authenticate;
