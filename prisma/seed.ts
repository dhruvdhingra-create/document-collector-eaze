const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.documentRequest.deleteMany({});
  await prisma.user.deleteMany({});

  // Create OM
  const om = await prisma.user.create({
    data: {
      username: 'om1',
      password: 'password', // in a real app, hash this
      role: 'OM',
    },
  });

  // Create Telecaller assigned to OM
  const tc1 = await prisma.user.create({
    data: {
      username: 'tc1',
      password: 'password',
      role: 'TELECALLER',
      managerId: om.id,
    },
  });
  
  // Create another Telecaller not assigned to this OM
  const tc2 = await prisma.user.create({
    data: {
      username: 'tc2',
      password: 'password',
      role: 'TELECALLER',
    },
  });

  console.log('Seed data created successfully!');
  console.log('OM Login: om1 / password');
  console.log('TC Login: tc1 / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
