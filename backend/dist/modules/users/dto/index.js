"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = exports.LoginDto = exports.CreateUserDto = void 0;
const zod_1 = require("zod");
// User DTOs
exports.CreateUserDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['ADMIN', 'EMPLOYER', 'CANDIDATE']),
});
exports.LoginDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.UserResponseDto = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    role: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
