import { PrismaClient, JobStatus } from '@prisma/client';
import { CacheService } from '../../../core/cache/RedisService';

const prisma = new PrismaClient();

export class JobRepository {
  static async create(data: { title: string; description: string; location: string; employerId: string }) {
    return await prisma.job.create({ data });
  }

  static async findAllOpen() {
  const cacheKey = 'jobs:open:all';
  
  // 1. Try Cache
  const cachedJobs = await CacheService.get(cacheKey);
  if (cachedJobs) return cachedJobs;

  // 2. If not in cache, query DB
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    include: { employer: { select: { email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Store in cache for 60 seconds
  await CacheService.set(cacheKey, jobs, 60);
  return jobs;
}

  static async findById(id: string) {
    return await prisma.job.findUnique({ where: { id } });
  }

  static async findPaged(limit: number, cursor?: string) {
  return await prisma.job.findMany({
    take: limit,
    skip: cursor ? 1 : 0, // Skip the cursor itself
    cursor: cursor ? { id: cursor } : undefined,
    where: { status: "OPEN" },
    orderBy: { createdAt: 'desc' }
  });
}
}