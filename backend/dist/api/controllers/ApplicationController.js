"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPresignedUrl = exports.getApplicationById = exports.getMyApplications = exports.getApplicationsForJob = exports.applyToJob = void 0;
const ApplicationService_1 = require("../../modules/applications/services/ApplicationService");
const dto_1 = require("../../modules/applications/dto");
const applyToJob = async (req, res) => {
    try {
        const candidateId = req.user.userId;
        const applicationData = dto_1.CreateApplicationDto.parse(req.body);
        const application = await ApplicationService_1.ApplicationService.apply(candidateId, applicationData.jobId, applicationData.resumeUrl);
        // Return 202 Accepted (Standard for async tasks)
        res.status(202).json({
            message: "Application submitted and is being processed by AI",
            applicationId: application.id,
            status: application.status,
        });
    }
    catch (error) {
        console.error('Apply to job error:', error);
        if (error.message.includes('already applied')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('not found') || error.message.includes('not accepting')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: error.message || 'Application failed'
        });
    }
};
exports.applyToJob = applyToJob;
const getApplicationsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const employerId = req.user.userId;
        const applications = await ApplicationService_1.ApplicationService.getApplicationsForJob(String(jobId), employerId);
        res.json({
            data: applications,
            count: applications.length,
        });
    }
    catch (error) {
        console.error('Get applications for job error:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({
            error: error.message || 'Failed to fetch applications'
        });
    }
};
exports.getApplicationsForJob = getApplicationsForJob;
const getMyApplications = async (req, res) => {
    try {
        const candidateId = req.user.userId;
        const applications = await ApplicationService_1.ApplicationService.getApplicationsByCandidate(candidateId);
        res.json({
            data: applications,
            count: applications.length,
        });
    }
    catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch applications'
        });
    }
};
exports.getMyApplications = getMyApplications;
const getApplicationById = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const application = await ApplicationService_1.ApplicationService.getApplicationById(String(applicationId), userId, userRole);
        res.json({ application });
    }
    catch (error) {
        console.error('Get application by ID error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({
            error: error.message || 'Failed to fetch application'
        });
    }
};
exports.getApplicationById = getApplicationById;
const getPresignedUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.query;
        if (!fileName || !fileType) {
            return res.status(400).json({
                error: 'fileName and fileType query parameters are required'
            });
        }
        const result = await ApplicationService_1.ApplicationService.getPresignedUrl(fileName, fileType);
        res.json({
            signedUrl: result.signedUrl,
            key: result.key,
        });
    }
    catch (error) {
        console.error('Get presigned URL error:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate upload URL'
        });
    }
};
exports.getPresignedUrl = getPresignedUrl;
