// Publish all draft properties immediately
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Finding draft properties...');
    
    // Find all properties with Draft status
    const draftProperties = await prisma.property.findMany({
      where: {
        status: 'DRAFT',
      },
      select: {
        id: true,
        title: true,
        status: true,
        verificationStatus: true,
      },
    });

    if (draftProperties.length === 0) {
      console.log('✅ No draft properties found. All properties are already published!');
      return;
    }

    console.log(`📋 Found ${draftProperties.length} draft properties:`);
    draftProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} (Status: ${prop.status})`);
    });

    console.log('\n🚀 Publishing all properties...');

    // Update all draft properties to published
    const result = await prisma.property.updateMany({
      where: {
        status: 'DRAFT',
      },
      data: {
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        publishedAt: new Date(),
        verifiedAt: new Date(),
      },
    });

    console.log(`\n✅ Successfully published ${result.count} properties!`);
    console.log('   Status: DRAFT → PUBLISHED');
    console.log('   Verification: NOT_VERIFIED → VERIFIED');
    console.log('   All properties are now visible on the public website!');
    
  } catch (error) {
    console.error('❌ Error publishing properties:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
