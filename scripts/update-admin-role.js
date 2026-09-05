// Update admin user role to ADMIN
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  // Update the user with this email to have ADMIN role
  const adminEmail = 'izerelibert@gmail.com';

  try {
    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      console.log(`❌ User with email ${adminEmail} not found in database.`);
      console.log('   Please check the email address.');
      process.exitCode = 1;
      return;
    }

    // Update the user role to ADMIN
    const user = await prisma.user.update({
      where: { email: adminEmail },
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
