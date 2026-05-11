"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationWithCandidateDto = exports.ApplicationWithJobDto = exports.ApplicationResponseDto = exports.CreateApplicationDto = void 0;
const zod_1 = require("zod");
// Application DTOs
exports.CreateApplicationDto = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    resumeUrl: zod_1.z.string().url(),
});
exports.ApplicationResponseDto = zod_1.z.object({
    id: zod_1.z.string(),
    jobId: zod_1.z.string(),
    candidateId: zod_1.z.string(),
    resumeUrl: zod_1.z.string(),
    aiScore: zod_1.z.number().nullable(),
    status: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
exports.ApplicationWithJobDto = exports.ApplicationResponseDto.extend({
    job: zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        location: zod_1.z.string(),
        employer: zod_1.z.object({
            id: zod_1.z.string(),
            email: zod_1.z.string(),
        }),
    }),
});
exports.ApplicationWithCandidateDto = exports.ApplicationResponseDto.extend({
    candidate: zod_1.z.object({
        id: zod_1.z.string(),
        email: zod_1.z.string(),
    }),
});
