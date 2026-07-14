# Tiện ích tự động đăng tin vnPortal → Zalo OA (Thượng Đức)

Service Node.js chạy nền, định kỳ gọi API vnPortal (`/api/public/articles`,
`/api/public/documents`) để phát hiện tin bài / văn bản mới, tự động tạo
"Nội dung dạng Bài viết" trên Zalo OA rồi broadcast tới người quan tâm —
tương tự cách Tổng đài 1022 Đà Nẵng tự động đẩy tin tức.

Kèm theo webhook/OAuth server (Express) phục vụ xác thực domain, nhận sự
kiện webhook, và luồng cấp quyền OAuth PKCE của Zalo OA.

## Cấu trúc

```
src/
  config.js              đọc cấu hình từ .env
  vnportal/client.js     gọi API vnPortal (categories/articles/documents)
  zalo/client.js         quan ly access/refresh token (Redis hoac file JSON)
  zalo/oauth.js          luong cap quyen OAuth v4 (PKCE)
  zalo/articleClient.js  tao + verify + broadcast "Noi dung dang Bai viet"
  state/store.js         luu ID tin/van ban da gui vao data/state.json (chong gui trung)
  services/               logic doi chieu "tin moi" va goi Zalo gui
  server.js               Express: trang chu (meta xac thuc domain), webhook, OAuth callback
  index.js                scheduler (node-cron) + che do chay 1 lan (--once)
```

## Cài đặt

```bash
npm install
copy .env.example .env    # Windows
```

Điền vào `.env` (xem chú thích chi tiết trong `.env.example`):
- `VNPORTAL_HOST_NAME`: domain thật của site vnPortal (không có `/` cuối)
- `ZALO_APP_ID`, `ZALO_APP_SECRET`: lấy từ ứng dụng đã tạo trên developers.zalo.me
- `ZALO_OA_ACCESS_TOKEN`, `ZALO_OA_REFRESH_TOKEN`: token có được sau khi hoàn
  tất OAuth lần đầu cho OA (token sẽ tự refresh và lưu vào Redis/`data/zalo-token.json`)
- `ZALO_DEFAULT_COVER_URL`: ảnh cover mặc định (vd logo UBND xã) — Zalo Article
  bắt buộc phải có cover, tin/văn bản không có ảnh riêng sẽ dùng ảnh này

## API Zalo đã dùng (đối chiếu trực tiếp với developers.zalo.me)

1. Tạo bài viết: `POST https://openapi.zalo.me/v2.0/article/create`
2. Kiểm tra tiến trình (lấy id thật): `POST https://openapi.zalo.me/v2.0/article/verify`
3. Broadcast bài viết: `POST https://openapi.zalo.me/v2.0/oa/message` (tối đa 5 bài/lần,
   Zalo cần ~30 phút kiểm duyệt trước khi thực sự gửi tới người dùng)

Toàn bộ logic nằm trong [src/zalo/articleClient.js](src/zalo/articleClient.js).

## Chạy thử (dry-run, 1 lần)

```bash
npm run sync:once
```

Mặc định `ZALO_SEND_ENABLED=false` — log sẽ in ra nội dung dự định tạo mà
không gọi API thật (tạo bài với `status: "show"` là hành động thật, hiện
ngay trên OA, nên bắt buộc phải dry-run được trước). Xem log để kiểm tra
danh sách tin/văn bản "mới" phát hiện được, nếu ổn thì đặt
`ZALO_SEND_ENABLED=true` trong `.env`.

## Chạy nền liên tục

```bash
npm start        # scheduler dong bo (cron)
npm run server   # webhook/OAuth server
```

Mặc định polling mỗi 10 phút (`SYNC_CRON_EXPRESSION=*/10 * * * *`). Trên VPS
production 2 tiến trình này chạy bằng PM2 (`thuongduc-sync`, `thuongduc-webhook`)
và tự deploy qua GitHub Actions khi push lên nhánh `main`.

## Chống gửi trùng

`data/state.json` lưu lại `ArticleID` và khóa văn bản (`CodeID + DateOfIssued`)
đã gửi. Xóa file này nếu muốn gửi lại từ đầu (cẩn thận: sẽ gửi lại toàn bộ tin
hiện có trong lần chạy kế tiếp).
