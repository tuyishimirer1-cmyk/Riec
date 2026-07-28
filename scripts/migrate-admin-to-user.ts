/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log(
      'AdminUser model has been removed from the Prisma schema. If you still have an old AdminUser collection in Mongo, please migrate it manually to the User collection with role=ADMIN before dropping it.',
    );
    console.log(
      'This script is now a no-op placeholder to avoid compile-time errors after the unification.',
    );
  } catch (err) {
    console.error('Migration failed', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
