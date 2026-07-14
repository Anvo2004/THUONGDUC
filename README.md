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

## Web app Infographic + Video hướng dẫn PCTT

Trang tĩnh cho người dân xem infographic và video hướng dẫn kỹ năng phòng
chống thiên tai, phục vụ tại `/infographic/` và `/video/` trên cùng domain.
Toàn bộ code + output nằm trong `frontend/`:

```
frontend/
  scripts/
    build-media-manifest.js   script chinh: quet docs/, nen anh, sinh HTML
    lib/slugify.js, lib/parseOrder.js
    templates/*.js             template HTML (layout, infographic, video)
  public/                      thu muc phuc vu web (Express serve tinh)
    assets/css, assets/js
    data/media-manifest.json   commit git
    infographic/**, video/**   HTML tinh, commit git
    media/**                   anh/video nhi phan, GITIGNORE (qua lon cho git)
```

Sinh lúc build từ nội dung nguồn (đặt ở `docs/` tại gốc project, không commit
vào git vì quá lớn):

```
docs/INFOGRAPHIC HƯỚNG DẪN KỸ NĂNG PCTT 2025.../   (~469MB, 228 ảnh JPG)
docs/VIDEO HƯỚNG DẪN BÃO, LŨ, LŨ QUÉT, SẠT LỞ 2025.../  (~2GB, 14 video mp4)
```

```bash
npm run build:media
```

Script quét `docs/`, nén ảnh (`sharp`, ~469MB → ~50MB), copy video, ghi
`frontend/public/data/media-manifest.json`, và sinh HTML tĩnh vào
`frontend/public/infographic/`, `frontend/public/video/` (các file này commit
vào git bình thường). File nhị phân (`frontend/public/media/**`) bị gitignore
vì quá lớn cho GitHub (video 100-185MB/file, vượt giới hạn 100MB) — triển khai
riêng bằng `frontend/scripts/deploy-media.sh` (scp thẳng lên VPS), KHÔNG qua
GitHub Actions.

`src/server.js` phục vụ cả 2 thư mục tĩnh: `public/` (backend gốc, vd ảnh
cover Zalo) và `frontend/public/` (web app), cùng mount ở `/`.

Cập nhật nội dung sau này: chạy lại `npm run build:media` + `deploy-media.sh`,
rồi `git push` như bình thường để publish HTML/manifest mới.
