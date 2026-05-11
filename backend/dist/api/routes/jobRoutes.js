"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const JobController_1 = require("../controllers/JobController");
const AuthMiddleware_1 = require("../middlewares/AuthMiddleware");
const RoleMiddleware_1 = require("../middlewares/RoleMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public routes
router.get('/', JobController_1.getAllJobs);
router.get('/:jobId', JobController_1.getJobById);
// Protected routes - Employers only
router.post('/', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.EMPLOYER]), JobController_1.createJob);
router.patch('/:jobId', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.EMPLOYER]), JobController_1.updateJob);
router.delete('/:jobId', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.EMPLOYER]), JobController_1.deleteJob);
// Protected routes - Authenticated users
router.get('/employer/my-jobs', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.EMPLOYER]), JobController_1.getMyJobs);
exports.default = router;
