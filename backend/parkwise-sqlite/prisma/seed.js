import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.safeRideSession.deleteMany();
  await prisma.guestPass.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: "user_demo_001",
      zaloUserId: "zalo_demo_001",
      phone: "84898466842",
      displayName: "Nguyễn Minh Nhân",
      studentId: "22040002",
      dateOfBirth: "12/08/2004",
    },
  });

  await prisma.vehicle.create({
    data: {
      id: "veh_001",
      plate: "59X1-12345",
      rfidTag: "RFID-A1B2C3",
      ownerName: user.displayName,
      ownerId: user.id,
      locked: false,
      zone: "Zone A",
      row: "Row 3",
      note: "Near library elevator",
      zoneSavedAt: new Date("2026-10-17T08:15:00.000Z"),
    },
  });

  console.log(
    "Prisma seed → Nguyễn Minh Nhân / 22040002 / phone 84898466842 (0898466842) / veh_001",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
