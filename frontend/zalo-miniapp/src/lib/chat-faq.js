export const CHAT_QUICK_REPLIES = [
  "Backup Pass QR",
  "Kill-Switch",
  "Zone Memory",
  "Night-Owl",
  "Parking help",
];

const RULES = [
  {
    id: "guest-pass",
    keywords: [
      "guest",
      "backup",
      "qr",
      "pass",
      "ma qr",
      "mã qr",
      "guest pass",
      "backup pass",
      "mat the",
      "mất thẻ",
      "quen the",
      "quên thẻ",
      "membership",
      "goi",
      "gói",
      "plan",
      "10k",
      "30k",
    ],
    reply: {
      text: "Backup Pass is your time-limited QR when you lose or forget your RFID card. Open Backup from Features — you need an active campus plan on the web Membership page. Using it counts for Rewards.",
      action: "guest",
      actionLabel: "Open Backup Pass",
    },
  },
  {
    id: "kill-switch",
    keywords: [
      "kill",
      "switch",
      "active",
      "inactive",
      "lock",
      "rfid",
      "khoa",
      "khoá",
      "disable",
      "enable",
      "gate",
    ],
    reply: {
      text: "Kill-Switch sets gate access to Active or Inactive. Inactive ignores RFID until you unlock again — use the big button on the home card.",
      action: null,
      actionLabel: null,
    },
  },
  {
    id: "zone",
    keywords: ["zone", "memory", "spot", "vi tri", "vị trí", "do", "đỗ", "parked", "row"],
    reply: {
      text: "Zone Memory saves where you parked (zone, row, note) so you can find your bike later.",
      action: "zone",
      actionLabel: "Open Zone Memory",
    },
  },
  {
    id: "night",
    keywords: [
      "night",
      "owl",
      "safe",
      "ride",
      "dem",
      "đêm",
      "track",
      "location",
      "gps",
    ],
    reply: {
      text: "Night-Owl starts a safe-ride share link so a friend can follow your trip home. Location is only used while the session is active.",
      action: "night",
      actionLabel: "Open Night-Owl",
    },
  },
  {
    id: "parking",
    keywords: [
      "parking",
      "occupancy",
      "available",
      "cho trong",
      "chỗ trống",
      "status",
      "bai xe",
      "bãi xe",
      "help",
      "sos",
      "tro giup",
      "trợ giúp",
    ],
    reply: {
      text: "For lot occupancy and SOS forms, use the ParkWise web app (Dashboard / Parking / Help). In this Mini App you can lock the gate, open Backup Pass, save your zone, or start Night-Owl.",
      action: null,
      actionLabel: null,
    },
  },
];

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function matchChatFaq(input) {
  const q = normalize(input);
  if (!q) {
    return {
      text: "Ask about Backup Pass, Kill-Switch, Zone Memory, or Night-Owl — or tap a quick reply.",
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => q.includes(normalize(kw)))) {
      return rule.reply;
    }
  }

  return {
    text: "I can help with Backup Pass QR, Kill-Switch (Active/Inactive), Zone Memory, and Night-Owl. For membership billing or SOS, open ParkWise on the web.",
  };
}

export const CHAT_WELCOME = {
  text: "Hi — I’m ParkWise Assist. Same helper as the web app. Ask about Backup Pass, Kill-Switch, Zone, or Night-Owl.",
};
