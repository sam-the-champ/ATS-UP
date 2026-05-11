import { z } from 'zod';

// User DTOs
export const CreateUserDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'EMPLOYER', 'CANDIDATE']),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UserResponseDto = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type UserResponseDtoType = z.infer<typeof UserResponseDto>;