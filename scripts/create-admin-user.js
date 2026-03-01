const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = 'admin@admin.com';
  const password = 'Admin@987';
  const hashed = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role: 'admin', isActive: true },
    });
    console.log('updated');
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: 'admin',
        name: 'Admin',
        isActive: true,
      },
    });
    console.log('created');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
