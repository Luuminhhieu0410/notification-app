import { PrismaClient, Prisma } from '@/generated/prisma/client';

export type RepositoryClient = PrismaClient | Prisma.TransactionClient;
