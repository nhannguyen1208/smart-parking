import {
  computeLotStatus,
  ParkingLot,
} from "../models/ParkingLot.js";

type LotFootprint = [number, number][]; // [lat, lng] rings

/**
 * 3 bãi sát khuôn viên ĐHĐN (41 Lê Duẩn).
 * OSM campus bbox ≈ 16.07070–16.07121 × 108.21909–108.22036
 * - Lê Duẩn: phía BẮC campus
 * - Lê Lợi: phía ĐÔNG campus
 * - Nguyễn Thị Minh Khai: phía TÂY campus
 */
export const UNIVERSITY_DA_NANG_LOTS = [
  {
    code: "LOT_A",
    name: "Bãi Lê Duẩn",
    locationDescription: "Dọc Đường Lê Duẩn — cổng Bắc trụ sở ĐHĐN",
    campus: "Đại học Đà Nẵng",
    latitude: 16.07132,
    longitude: 108.21972,
    totalCapacity: 80,
    currentOccupancyEstimate: 24,
    footprint: [
      [16.07142, 108.21940],
      [16.07142, 108.22004],
      [16.07122, 108.22004],
      [16.07122, 108.21940],
    ] as LotFootprint,
  },
  {
    code: "LOT_B",
    name: "Bãi Lê Lợi",
    locationDescription: "Dọc Đường Lê Lợi — phía Đông ĐHĐN / cạnh VNUK",
    campus: "Đại học Đà Nẵng",
    latitude: 16.07095,
    longitude: 108.22042,
    totalCapacity: 100,
    currentOccupancyEstimate: 89,
    footprint: [
      [16.07118, 108.22028],
      [16.07118, 108.22056],
      [16.07072, 108.22056],
      [16.07072, 108.22028],
    ] as LotFootprint,
  },
  {
    code: "LOT_C",
    name: "Bãi Nguyễn Thị Minh Khai",
    locationDescription: "Dọc Đường Nguyễn Thị Minh Khai — phía Tây ĐHĐN",
    campus: "Đại học Đà Nẵng",
    latitude: 16.07085,
    longitude: 108.21888,
    totalCapacity: 60,
    currentOccupancyEstimate: 60,
    footprint: [
      [16.07110, 108.21872],
      [16.07110, 108.21904],
      [16.07060, 108.21904],
      [16.07060, 108.21872],
    ] as LotFootprint,
  },
] as const;

export const CAMPUS_MAP_CENTER = {
  latitude: 16.07095,
  longitude: 108.2197,
  zoom: 18,
  label: "Đại học Đà Nẵng · 41 Lê Duẩn",
};

export function footprintByCode(code: string): LotFootprint | null {
  const hit = UNIVERSITY_DA_NANG_LOTS.find((l) => l.code === code);
  return hit ? [...hit.footprint.map((p) => [...p] as [number, number])] : null;
}

/** Upsert the 3 campus lots (safe to call from API / seed). */
export async function ensureUniversityDaNangLots() {
  for (const def of UNIVERSITY_DA_NANG_LOTS) {
    const status = computeLotStatus(
      def.totalCapacity,
      def.currentOccupancyEstimate,
    );
    await ParkingLot.findOneAndUpdate(
      { code: def.code },
      {
        $set: {
          name: def.name,
          locationDescription: def.locationDescription,
          campus: def.campus,
          latitude: def.latitude,
          longitude: def.longitude,
          totalCapacity: def.totalCapacity,
          nearlyFullThresholdPct: 85,
        },
        $setOnInsert: {
          currentOccupancyEstimate: def.currentOccupancyEstimate,
          status,
          countSource: "GATE_EVENTS",
        },
      },
      { upsert: true, new: true },
    );

    const lot = await ParkingLot.findOne({ code: def.code });
    if (lot) {
      lot.status = computeLotStatus(
        lot.totalCapacity,
        lot.currentOccupancyEstimate,
        lot.nearlyFullThresholdPct,
      );
      lot.latitude = def.latitude;
      lot.longitude = def.longitude;
      lot.name = def.name;
      lot.locationDescription = def.locationDescription;
      if (!lot.campus) lot.campus = def.campus;
      await lot.save();
    }
  }
}
