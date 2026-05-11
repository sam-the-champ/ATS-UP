"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApplicationController_1 = require("../controllers/ApplicationController");
const AuthMiddleware_1 = require("../middlewares/AuthMiddleware");
const RoleMiddleware_1 = require("../middlewares/RoleMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Protected routes - Candidates only
router.post('/', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.CANDIDATE]), ApplicationController_1.applyToJob);
router.get('/candidate/my-applications', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.CANDIDATE]), ApplicationController_1.getMyApplications);
// Protected routes - Employers only
router.get('/job/:jobId', AuthMiddleware_1.authenticate, (0, RoleMiddleware_1.authorize)([client_1.Role.EMPLOYER]), ApplicationController_1.getApplicationsForJob);
// Protected routes - Authenticated users (role-based access in controller)
router.get('/:applicationId', AuthMiddleware_1.authenticate, ApplicationController_1.getApplicationById);
// Utility routes - Authenticated users
router.get('/upload/presigned-url', AuthMiddleware_1.authenticate, ApplicationController_1.getPresignedUrl);
exports.default = router;
