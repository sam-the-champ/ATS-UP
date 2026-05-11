import { z } from 'zod';

// Job DTOs
export const CreateJobDto = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(5000),
  location: z.string().min(1).max(100),
  salaryRange: z.string().optional(),
});

export const UpdateJobDto = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(5000).optional(),
  location: z.string().min(1).max(100).optional(),
  salaryRange: z.string().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
});

export const JobResponseDto = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  salaryRange: z.string().nullable(),
  status: z.string(),
  employerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const JobWithEmployerDto = JobResponseDto.extend({
  employer: z.object({
    id: z.string(),
    email: z.string(),
  }),
  _count: z.object({
    applications: z.number(),
  }),
});

export type CreateJobDtoType = z.infer<typeof CreateJobDto>;
export type UpdateJobDtoType = z.infer<typeof UpdateJobDto>;
export type JobResponseDtoType = z.infer<typeof JobResponseDto>;
export type JobWithEmployerDtoType = z.infer<typeof JobWithEmployerDto>;