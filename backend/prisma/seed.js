const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('AdminPass123!', 10);
  const commanderPassword = await bcrypt.hash('CommandPass123!', 10);
  const logisticsPassword = await bcrypt.hash('LogisticsPass123!', 10);

  // Create Bases
  const fortAlpha = await prisma.base.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Fort Alpha',
      location: 'Northern Sector',
    },
  });

  const fortBravo = await prisma.base.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Fort Bravo',
      location: 'Eastern Sector',
    },
  });

  const fortCharlie = await prisma.base.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Fort Charlie',
      location: 'Western Sector',
    },
  });

  console.log('Created bases:', fortAlpha.name, fortBravo.name, fortCharlie.name);

  // Create Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin_user' },
    update: {},
    create: {
      username: 'admin_user',
      passwordHash: adminPassword,
      role: 'ADMIN',
      baseId: null,
    },
  });

  const commanderAlpha = await prisma.user.upsert({
    where: { username: 'commander_alpha' },
    update: {},
    create: {
      username: 'commander_alpha',
      passwordHash: commanderPassword,
      role: 'BASE_COMMANDER',
      baseId: 1,
    },
  });

  const logisticsOfficer = await prisma.user.upsert({
    where: { username: 'logistics_officer' },
    update: {},
    create: {
      username: 'logistics_officer',
      passwordHash: logisticsPassword,
      role: 'LOGISTICS_OFFICER',
      baseId: 1,
    },
  });

  console.log('Created users:', admin.username, commanderAlpha.username, logisticsOfficer.username);

  // Create Equipment Types
  const m4Carbine = await prisma.equipmentType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'M4 Carbine',
      category: 'WEAPON',
    },
  });

  const ak47 = await prisma.equipmentType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'AK-47',
      category: 'WEAPON',
    },
  });

  const humvee = await prisma.equipmentType.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Humvee',
      category: 'VEHICLE',
    },
  });

  const ammo556 = await prisma.equipmentType.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: '5.56mm Ammunition',
      category: 'AMMUNITION',
    },
  });

  const ammo762 = await prisma.equipmentType.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: '7.62mm Ammunition',
      category: 'AMMUNITION',
    },
  });

  console.log('Created equipment types:', m4Carbine.name, ak47.name, humvee.name, ammo556.name, ammo762.name);

  // Create initial Assets (inventory)
  await prisma.asset.createMany({
    data: [
      { equipmentTypeId: 1, baseId: 1, quantity: 50, status: 'AVAILABLE' },
      { equipmentTypeId: 2, baseId: 1, quantity: 30, status: 'AVAILABLE' },
      { equipmentTypeId: 3, baseId: 1, quantity: 10, status: 'AVAILABLE' },
      { equipmentTypeId: 4, baseId: 1, quantity: 5000, status: 'AVAILABLE' },
      { equipmentTypeId: 5, baseId: 1, quantity: 3000, status: 'AVAILABLE' },
      { equipmentTypeId: 1, baseId: 2, quantity: 40, status: 'AVAILABLE' },
      { equipmentTypeId: 3, baseId: 2, quantity: 8, status: 'AVAILABLE' },
      { equipmentTypeId: 4, baseId: 2, quantity: 4000, status: 'AVAILABLE' },
      { equipmentTypeId: 2, baseId: 3, quantity: 35, status: 'AVAILABLE' },
      { equipmentTypeId: 3, baseId: 3, quantity: 12, status: 'AVAILABLE' },
      { equipmentTypeId: 5, baseId: 3, quantity: 3500, status: 'AVAILABLE' },
    ],
  });

  console.log('Created initial assets');

  // Create sample Purchases
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await prisma.purchase.createMany({
    data: [
      {
        baseId: 1,
        equipmentTypeId: 1,
        quantity: 20,
        purchaseDate: lastMonth,
        referenceNumber: 'PO-2024-001',
        createdBy: admin.id,
      },
      {
        baseId: 1,
        equipmentTypeId: 4,
        quantity: 2000,
        purchaseDate: lastMonth,
        referenceNumber: 'PO-2024-002',
        createdBy: admin.id,
      },
      {
        baseId: 2,
        equipmentTypeId: 3,
        quantity: 5,
        purchaseDate: today,
        referenceNumber: 'PO-2024-003',
        createdBy: admin.id,
      },
      {
        baseId: 3,
        equipmentTypeId: 5,
        quantity: 1500,
        purchaseDate: today,
        referenceNumber: 'PO-2024-004',
        createdBy: admin.id,
      },
    ],
  });

  console.log('Created sample purchases');

  // Create sample Transfers
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await prisma.transfer.createMany({
    data: [
      {
        sourceBaseId: 1,
        destinationBaseId: 2,
        equipmentTypeId: 4,
        quantity: 500,
        status: 'COMPLETED',
        timestamp: lastWeek,
        initiatedBy: admin.id,
      },
      {
        sourceBaseId: 1,
        destinationBaseId: 3,
        equipmentTypeId: 1,
        quantity: 10,
        status: 'COMPLETED',
        timestamp: lastWeek,
        initiatedBy: admin.id,
      },
      {
        sourceBaseId: 2,
        destinationBaseId: 3,
        equipmentTypeId: 4,
        quantity: 300,
        status: 'IN_TRANSIT',
        timestamp: today,
        initiatedBy: logisticsOfficer.id,
      },
    ],
  });

  console.log('Created sample transfers');

  // Create sample Assignments
  await prisma.assignment.createMany({
    data: [
      {
        baseId: 1,
        equipmentTypeId: 1,
        personnelName: 'Sgt. John Smith',
        quantity: 2,
        assignedBy: commanderAlpha.id,
        status: 'ACTIVE',
      },
      {
        baseId: 1,
        equipmentTypeId: 3,
        personnelName: 'Cpl. Jane Doe',
        quantity: 1,
        assignedBy: commanderAlpha.id,
        status: 'ACTIVE',
      },
      {
        baseId: 2,
        equipmentTypeId: 1,
        personnelName: 'Lt. Mike Johnson',
        quantity: 3,
        assignedBy: admin.id,
        status: 'ACTIVE',
      },
    ],
  });

  console.log('Created sample assignments');

  // Create sample Expenditures
  await prisma.expenditure.createMany({
    data: [
      {
        baseId: 1,
        equipmentTypeId: 4,
        quantity: 500,
        reason: 'Training exercise',
        recordedBy: logisticsOfficer.id,
      },
      {
        baseId: 1,
        equipmentTypeId: 5,
        quantity: 300,
        reason: 'Field operation',
        recordedBy: logisticsOfficer.id,
      },
      {
        baseId: 2,
        equipmentTypeId: 4,
        quantity: 400,
        reason: 'Qualification test',
        recordedBy: admin.id,
      },
    ],
  });

  console.log('Created sample expenditures');

  // Create sample Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN',
        details: 'Admin user logged in',
      },
      {
        userId: commanderAlpha.id,
        action: 'PURCHASE',
        entityType: 'Purchase',
        details: 'Created purchase PO-2024-001',
      },
      {
        userId: logisticsOfficer.id,
        action: 'TRANSFER_CREATED',
        entityType: 'Transfer',
        details: 'Initiated transfer from Fort Alpha to Fort Bravo',
      },
    ],
  });

  console.log('Created sample audit logs');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
