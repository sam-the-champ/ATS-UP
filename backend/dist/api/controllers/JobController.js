"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyJobs = exports.deleteJob = exports.updateJob = exports.getJobById = exports.getAllJobs = exports.createJob = void 0;
const JobService_1 = require("../../modules/jobs/services/JobService");
const dto_1 = require("../../modules/jobs/dto");
const createJob = async (req, res) => {
    try {
        const employerId = req.user.userId;
        const jobData = dto_1.CreateJobDto.parse(req.body);
        const job = await JobService_1.JobService.createJob(employerId, jobData);
        res.status(201).json({
            message: 'Job created successfully',
            job,
        });
    }
    catch (error) {
        console.error('Create job error:', error);
        res.status(400).json({
            error: error.message || 'Failed to create job'
        });
    }
};
exports.createJob = createJob;
const getAllJobs = async (req, res) => {
    try {
        const jobs = await JobService_1.JobService.getAllJobs();
        res.json({
            data: jobs,
            count: jobs.length,
        });
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch jobs'
        });
    }
};
exports.getAllJobs = getAllJobs;
const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await JobService_1.JobService.getJobById(String(jobId));
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ job });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch job'
        });
    }
};
exports.getJobById = getJobById;
const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const employerId = req.user.userId;
        const updateData = dto_1.UpdateJobDto.parse(req.body);
        const job = await JobService_1.JobService.updateJob(String(jobId), employerId, updateData);
        res.json({
            message: 'Job updated successfully',
            job,
        });
    }
    catch (error) {
        console.error('Update job error:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: error.message || 'Failed to update job'
        });
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const employerId = req.user.userId;
        await JobService_1.JobService.deleteJob(String(jobId), employerId);
        res.json({
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete job error:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: error.message || 'Failed to delete job'
        });
    }
};
exports.deleteJob = deleteJob;
const getMyJobs = async (req, res) => {
    try {
        const employerId = req.user.userId;
        const jobs = await JobService_1.JobService.getJobsByEmployer(employerId);
        res.json({
            data: jobs,
            count: jobs.length,
        });
    }
    catch (error) {
        console.error('Get my jobs error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch your jobs'
        });
    }
};
exports.getMyJobs = getMyJobs;
