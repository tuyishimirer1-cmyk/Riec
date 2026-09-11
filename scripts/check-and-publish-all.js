// Check database and publish ALL properties
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking all properties in database...\n');
    
    // Get ALL properties (any status)
    const allProperties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        verificationStatus: true,
        publishedAt: true,
        verifiedAt: true,
        seller: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (allProperties.length === 0) {
      console.log('❌ No properties found in database!');
      console.log('   Please create at least one property first.');
      return;
    }

    console.log(`📋 Found ${allProperties.length} properties in database:\n`);
    
    allProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. "${prop.title}"`);
      console.log(`      Status: ${prop.status}`);
      console.log(`      Verification: ${prop.verificationStatus}`);
      console.log(`      Owner: ${prop.seller.email} (${prop.seller.role})`);
      console.log(`      Published At: ${prop.publishedAt || 'Not published'}`);
      console.log('');
    });

    // Count by status
    const draftCount = allProperties.filter(p => p.status === 'DRAFT').length;
    const publishedCount = allProperties.filter(p => p.status === 'PUBLISHED').length;
    
    console.log(`📊 Status Summary:`);
    console.log(`   Draft: ${draftCount}`);
    console.log(`   Published: ${publishedCount}`);
    console.log('');

    if (draftCount === 0) {
      console.log('✅ All properties are already published!');
      console.log('   They should be visible on the frontend.');
      console.log('   If not visible, check:');
      console.log('   1. Frontend deployment status on Render');
      console.log('   2. Browser cache (try Ctrl+Shift+R)');
      console.log('   3. API endpoint: https://riec-ofuu.onrender.com/api/properties');
      return;
    }

    console.log(`🚀 Publishing ${draftCount} draft properties...\n`);

    // Update ALL properties to PUBLISHED + VERIFIED
    const result = await prisma.property.updateMany({
      where: {
        OR: [
          { status: { not: 'PUBLISHED' } },
          { verificationStatus: { not: 'VERIFIED' } },
        ],
      },
      data: {
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        publishedAt: new Date(),
        verifiedAt: new Date(),
      },
    });

    console.log(`✅ Successfully updated ${result.count} properties!`);
    console.log('   Status: → PUBLISHED');
    console.log('   Verification: → VERIFIED');
    console.log('   Published At: → Current timestamp');
    console.log('');

    // Verify the update
    console.log('🔍 Verifying update...\n');
    
    const verifiedProperties = await prisma.property.findMany({
      where: {
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
      },
      select: {
        title: true,
        status: true,
        verificationStatus: true,
      },
    });

    console.log(`✅ ${verifiedProperties.length} properties are now PUBLISHED and VERIFIED:`);
    verifiedProperties.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title} - ${prop.status} (${prop.verificationStatus})`);
    });
    console.log('');

    console.log('🎉 SUCCESS! All properties are now published!');
    console.log('');
    console.log('📍 Next steps:');
    console.log('   1. Check API: https://riec-ofuu.onrender.com/api/properties');
    console.log('   2. Wait for frontend deployment (if not done)');
    console.log('   3. Visit: https://www.riec.rw/properties');
    console.log('   4. Hard refresh browser: Ctrl+Shift+R');
    console.log('');
    console.log('   Properties should be visible to end users! 🚀');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Check DATABASE_URL environment variable');
    console.error('   - Verify MongoDB connection is working');
    console.error('   - Run: npx prisma generate');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
