import { prisma } from '../src/lib/db/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['admin', 'super_admin']
      }
    },
    select: {
      email: true,
      role: true
    }
  });

  console.log('Admin Users:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
