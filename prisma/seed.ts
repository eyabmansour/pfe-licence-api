import { PrismaClient, RoleCodeEnum } from '@prisma/client';
import { UserRole } from '../src/roles/user-role.model';

const prisma = new PrismaClient();
async function main() {
  await prisma.role.upsert({
    where: { code: RoleCodeEnum.ADMINISTRATOR },
    update: {
      name: 'Admin',
      weight: UserRole.ADMINISTRATOR,
    },
    create: {
      name: 'Admin',
      code: RoleCodeEnum.ADMINISTRATOR,
      weight: UserRole.ADMINISTRATOR,
    },
  });

  await prisma.role.upsert({
    where: { code: RoleCodeEnum.RESTAURATEUR },
    update: {
      name: 'Restaurateur',
      weight: UserRole.RESTAURATEUR,
    },
    create: {
      name: 'Restaurateur',
      code: RoleCodeEnum.RESTAURATEUR,
      weight: UserRole.RESTAURATEUR,
    },
  });

  await prisma.role.upsert({
    where: { code: RoleCodeEnum.DELIVERY_PERSON },
    update: {
      name: 'Livreur',
      weight: UserRole.DELIVERY_PERSON,
    },
    create: {
      name: 'Livreur',
      code: RoleCodeEnum.DELIVERY_PERSON,
      weight: UserRole.DELIVERY_PERSON,
    },
  });

  await prisma.role.upsert({
    where: { code: RoleCodeEnum.CLIENT },
    update: {
      name: 'Client',
      weight: UserRole.CLIENT,
    },
    create: {
      name: 'Client',
      code: RoleCodeEnum.CLIENT,
      weight: UserRole.CLIENT,
    },
  });
  //TODO : seed first admin
  await prisma.user.upsert({
    where: { email: 'eyabms452@gmail.com' },
    update: {},
    create: {
      username: 'eyabms',
      email: 'eyabms452@gmail.com',
      password: 'eya123',
    },
  });
}
console.log('Seed completed!');

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
