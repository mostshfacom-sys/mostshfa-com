import { prisma } from '../src/lib/db/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@mostshfa.com';
  const password = 'AdminPassword123!'; // يمكنك تغييرها لاحقاً من لوحة التحكم
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  });

  console.log('Admin user created/updated successfully:');
  console.log(JSON.stringify({ email: admin.email, role: admin.role }, null, 2));
  console.log('Password set to: ' + password);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
