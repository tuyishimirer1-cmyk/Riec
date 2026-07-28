/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  try {
    const existing = await (prisma as any).user.findUnique({
      where: { email },
    });
    if (existing) {
      console.log(`User with email ${email} already exists. Skipping.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await (prisma as any).user.create({
      data: { email, passwordHash, role: 'ADMIN' },
    });

    console.log('Created admin user:', {
      id: created.id,
      email: created.email,
      createdAt: created.createdAt,
    });
    console.log('Seed admin credentials:');
    console.log(`  EMAIL=${email}`);
    console.log(`  PASSWORD=${password}`);
    console.log('Please change the password after first login.');
  } catch (err) {
    console.error('Error seeding admin user', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
