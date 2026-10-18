export type ChatReply = {
  text: string;
  href?: string;
  linkLabel?: string;
};

type FaqRule = {
  id: string;
  keywords: string[];
  reply: ChatReply;
};

export const CHAT_QUICK_REPLIES = [
  "Membership plans",
  "Backup Pass QR",
  "Kill-Switch",
  "Parking status",
  "SOS help",
] as const;

const RULES: FaqRule[] = [
  {
    id: "membership",
    keywords: [
      "membership",
      "goi",
      "gói",
      "plan",
      "10k",
      "30k",
      "10000",
      "30000",
      "daily",
      "monthly",
      "huy goi",
      "huỷ gói",
      "hủy gói",
      "cancel plan",
      "renew",
      "gia",
      "giá",
    ],
    reply: {
      text: "Parking plans: Daily 10,000 VND or Monthly 30,000 VND. Backup Pass only works while a plan is active. You can renew, change, or cancel on Membership.",
      href: "/membership",
      linkLabel: "Open Membership",
    },
  },
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
      "invite",
    ],
    reply: {
      text: "Backup Pass is your rotating QR when you lose or forget your RFID card. It counts as your check-in for Rewards. You need an active Daily or Monthly plan first.",
      href: "/qr-pass",
      linkLabel: "Open Backup Pass",
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
      "gate lock",
    ],
    reply: {
      text: "Kill-Switch on your student card sets gate access to Active or Inactive. Inactive ignores RFID scans until you turn it back on.",
      href: "/profile",
      linkLabel: "Open Profile card",
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
      "slot",
      "capacity",
      "lot",
      "bai xe",
      "bãi xe",
      "status",
    ],
    reply: {
      text: "Parking Status shows estimated occupancy and available spaces across campus lots. Figures may be estimates when sensors are in DEMO mode.",
      href: "/parking",
      linkLabel: "View parking status",
    },
  },
  {
    id: "sos",
    keywords: [
      "sos",
      "help",
      "tro giup",
      "trợ giúp",
      "su co",
      "sự cố",
      "flat",
      "battery",
      "tire",
      "bao ve",
      "bảo vệ",
      "guard",
      "emergency",
    ],
    reply: {
      text: "For campus issues (flat tire, battery, assistance), submit an SOS on Help. Requests stay OPEN until a guard or admin accepts. This demo does not dispatch a real emergency team.",
      href: "/help",
      linkLabel: "Open Help / SOS",
    },
  },
  {
    id: "history",
    keywords: ["history", "lich su", "lịch sử", "session", "entry", "exit", "vao", "vào", "ra"],
    reply: {
      text: "Entry and exit activity appears under History when the gate system records sessions.",
      href: "/history",
      linkLabel: "Open History",
    },
  },
];

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function matchChatFaq(input: string): ChatReply {
  const q = normalize(input);
  if (!q) {
    return {
      text: "Ask about Membership, Backup Pass, Kill-Switch, Parking status, or SOS — or pick a quick reply below.",
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => q.includes(normalize(kw)))) {
      return rule.reply;
    }
  }

  return {
    text: "I can help with Membership (10k/30k), Backup Pass QR, Kill-Switch (Active/Inactive), Parking status, History, or SOS. For urgent campus issues, contact the guard post or submit SOS on Help.",
    href: "/help",
    linkLabel: "Go to Help / SOS",
  };
}

export const CHAT_WELCOME: ChatReply = {
  text: "Hi — I’m ParkWise Assist. Ask about plans, Backup Pass, Kill-Switch, parking status, or campus SOS.",
};
