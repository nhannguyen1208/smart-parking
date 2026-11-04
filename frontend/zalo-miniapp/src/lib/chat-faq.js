export const CHAT_QUICK_REPLIES = [
  "Khoá thẻ",
  "Backup Pass QR",
  "Night-Owl",
];

const RULES = [
  {
    id: "kill-switch",
    keywords: [
      "khoa",
      "khoá",
      "khoa the",
      "khoá thẻ",
      "kill",
      "switch",
      "lock",
      "rfid",
      "disable",
      "inactive",
      "bao mat",
      "bảo mật",
    ],
    reply: {
      text: "Khoá thẻ (Kill-Switch) tắt RFID ParkWise tại cổng — không khoá máy xe. Bật/tắt ngay trên màn hình chính Mini App (cùng tài khoản web).",
      action: null,
      actionLabel: null,
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
      "membership",
      "goi",
      "gói",
      "plan",
      "10k",
      "30k",
    ],
    reply: {
      text: "Backup Pass là QR tạm khi quên thẻ. Mở Backup Pass trong tiện ích — cần gói gửi xe trên web. Dùng QR cũng tính Rewards.",
      action: "guest",
      actionLabel: "Mở Backup Pass",
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
      "ve nha",
      "về nhà",
    ],
    reply: {
      text: "Night-Owl tạo link theo dõi khi bạn về nhà. Chỉ dùng vị trí trong lúc phiên đang chạy.",
      action: "night",
      actionLabel: "Mở Night-Owl",
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
      "xe",
      "vehicle",
    ],
    reply: {
      text: "Chỗ trống, membership và SOS trên web ParkWise. Mini App: Khoá thẻ, Backup Pass, Night-Owl — cùng tài khoản.",
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
      text: "Hỏi về Backup Pass hoặc Night-Owl — hoặc chọn câu nhanh bên dưới.",
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => q.includes(normalize(kw)))) {
      return rule.reply;
    }
  }

  return {
    text: "Mình hỗ trợ Backup Pass và Night-Owl. Membership / SOS mở trên web ParkWise.",
  };
}

export const CHAT_WELCOME = {
  text: "Xin chào — ParkWise Assist. Hỏi Backup Pass hoặc Night-Owl nhé.",
};
