# ParkWise — Zalo Mini App (zmp-cli)

Web app đã chuyển theo hướng dẫn [Zalo Mini App CLI](https://docs.zaloplatforms.com/docs/MA/devtools/cli/intro) và [convert Web App → Mini App](https://docs.zaloplatforms.com/docs/MA/intro/getting-started/convert-web-app-to-mini-app).

API chung với web: `backend/` Mongo Express (**:4000**).

## 1. Cài CLI

```bash
npm install -g zmp-cli
zmp --help
```

## 2. Tạo Mini App ID

1. Vào [mini.zalo.me](https://mini.zalo.me) / Zalo for Developers
2. Tạo Zalo App → tạo Mini App → lấy **Mini App ID**
3. Copy `.env.example` → `.env` và điền:

```env
VITE_API_URL=http://localhost:4000
APP_ID=<your-mini-app-id>
VITE_ZALO_MINI_APP_ID=<your-mini-app-id>
```

## 3. Liên kết project với ZMP (một lần)

```bash
cd frontend/zalo-miniapp
npm install
zmp login          # quét QR bằng app Zalo
zmp init           # chọn "Use ZMP to deploy only" + nhập APP_ID + tên ParkWise
```

Project đã có sẵn `app-config.json` + root `#app` + `base: "./"` — `zmp init` sẽ ghi `.env` deploy nếu chưa có.

## 4. Chạy local

```bash
# terminal A — shared Mongo API
npm run seed
npm run dev:backend       # :4000

# terminal B
cd frontend/zalo-miniapp
npm run dev               # browser preview :5173
# hoặc
npm run zmp:start         # Zalo frame preview
npm run zmp:device        # QR → mở trên Zalo thật (cần APP_ID)
```

Demo SĐT `0898466842` → cùng user web `22040002` / `nhan.nguyen220402@vnuk.edu.vn`.

## 5. Named tunnel (URL ổn định — khuyến nghị)

Quick tunnel (`trycloudflare.com`) hay hết hạn. Named tunnel cần **domain đã gắn Cloudflare**:

```bash
# Một lần: login CF + tạo tunnel + DNS (thay hostname của bạn)
npm run parkwise:tunnel:setup -- api.yourdomain.com

# Mỗi ngày: giữ mở (API :4000 + named tunnel)
npm run parkwise:zalo

# Chỉ khi đổi code Mini App / lần đầu sau setup
npm run parkwise:zalo:deploy
```

Không có domain → `parkwise:zalo` vẫn fallback quick tunnel (URL đổi / dễ chết).

Nếu deploy báo login hết hạn: `cd frontend/zalo-miniapp && zmp login --app-id 3804607974416934390`

`zmp start -D` **không** dùng được với project kiểu “deploy only”.
