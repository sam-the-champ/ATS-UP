import { z } from 'zod';

// Application DTOs
export const CreateApplicationDto = z.object({
  jobId: z.string().uuid(),
  resumeUrl: z.string().url(),
});

export const ApplicationResponseDto = z.object({
  id: z.string(),
  jobId: z.string(),
  candidateId: z.string(),
  resumeUrl: z.string(),
  aiScore: z.number().nullable(),
  status: z.string(),
  createdAt: z.date(),
});

export const ApplicationWithJobDto = ApplicationResponseDto.extend({
  job: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    employer: z.object({
      id: z.string(),
      email: z.string(),
    }),
  }),
});

export const ApplicationWithCandidateDto = ApplicationResponseDto.extend({
  candidate: z.object({
    id: z.string(),
    email: z.string(),
  }),
});

export type CreateApplicationDtoType = z.infer<typeof CreateApplicationDto>;
export type ApplicationResponseDtoType = z.infer<typeof ApplicationResponseDto>;
export type ApplicationWithJobDtoType = z.infer<typeof ApplicationWithJobDto>;
export type ApplicationWithCandidateDtoType = z.infer<typeof ApplicationWithCandidateDto>;