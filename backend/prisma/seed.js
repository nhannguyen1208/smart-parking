import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.guestPass.deleteMany();
  await prisma.vehicle.deleteMany();

  await prisma.vehicle.create({
    data: {
      id: "veh_001",
      plate: "59X1-12345",
      rfidTag: "RFID-A1B2C3",
      ownerName: "Minh Nguyen",
      zaloUserId: "zalo_demo_001",
      locked: false,
      zone: "Zone A",
      row: "Row 3",
      note: "Near library elevator",
      zoneSavedAt: new Date("2026-10-17T08:15:00.000Z"),
    },
  });

  console.log("Prisma seed complete → vehicle veh_001");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
