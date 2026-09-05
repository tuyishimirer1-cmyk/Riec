// Update admin user role to ADMIN
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Update the user with email admin@example.com to have ADMIN role
    const user = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'ADMIN' },
    });

    console.log('✅ Successfully updated user role:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   User ID:', user.id);
    console.log('\n✅ You can now create properties that will auto-publish!');
  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
