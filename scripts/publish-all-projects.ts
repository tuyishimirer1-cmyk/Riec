import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function publishAllProjects() {
  try {
    console.log('Publishing all unpublished projects...');
    
    const result = await prisma.project.updateMany({
      where: {
        isPublished: false,
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    console.log(`✅ Successfully published ${result.count} projects`);
  } catch (error) {
    console.error('❌ Error publishing projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

publishAllProjects();
