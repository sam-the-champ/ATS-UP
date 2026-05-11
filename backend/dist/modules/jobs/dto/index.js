"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobWithEmployerDto = exports.JobResponseDto = exports.UpdateJobDto = exports.CreateJobDto = void 0;
const zod_1 = require("zod");
// Job DTOs
exports.CreateJobDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(10).max(5000),
    location: zod_1.z.string().min(1).max(100),
    salaryRange: zod_1.z.string().optional(),
});
exports.UpdateJobDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().min(10).max(5000).optional(),
    location: zod_1.z.string().min(1).max(100).optional(),
    salaryRange: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
});
exports.JobResponseDto = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    location: zod_1.z.string(),
    salaryRange: zod_1.z.string().nullable(),
    status: zod_1.z.string(),
    employerId: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.JobWithEmployerDto = exports.JobResponseDto.extend({
    employer: zod_1.z.object({
        id: zod_1.z.string(),
        email: zod_1.z.string(),
    }),
    _count: zod_1.z.object({
        applications: zod_1.z.number(),
    }),
});
