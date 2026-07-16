# Tiện ích tự động đăng tin vnPortal → Zalo OA (Thượng Đức)

Service Node.js chạy nền, định kỳ gọi API vnPortal (`/api/public/articles`,
`/api/public/documents`) để phát hiện tin bài / văn bản mới, tự động tạo
"Nội dung dạng Bài viết" trên Zalo OA rồi broadcast tới người quan tâm —
tương tự cách Tổng đài 1022 Đà Nẵng tự động đẩy tin tức.

Kèm theo webhook/OAuth server (Express) phục vụ xác thực domain, nhận sự
kiện webhook, và luồng cấp quyền OAuth PKCE của Zalo OA.

## Cấu trúc

Repo gồm 2 tính năng, mỗi tính năng nằm gọn trong `frontend/<TenTinhNang>/`:
- **`frontend/DangTin/`** — tự động đăng tin vnPortal → Zalo OA (service Node.js chạy nền + webhook/OAuth server)
- **`frontend/HoTroPCTT/`** — web app tĩnh Infographic + Video hướng dẫn kỹ năng PCTT cho người dân

```
frontend/DangTin/
  src/
    config.js              đọc cấu hình từ .env (o goc project)
    vnportal/client.js     gọi API vnPortal (categories/articles/documents)
    zalo/client.js         quan ly access/refresh token (Redis hoac file JSON)
    zalo/oauth.js          luong cap quyen OAuth v4 (PKCE)
    zalo/articleClient.js  tao + verify + broadcast "Noi dung dang Bai viet"
    state/store.js         luu ID tin/van ban da gui vao data/state.json (chong gui trung)
    services/               logic doi chieu "tin moi" va goi Zalo gui
    server.js               Express: trang chu (meta xac thuc domain), webhook, OAuth callback
    index.js                scheduler (node-cron) + che do chay 1 lan (--once)
  public/                   file tinh phuc vu boi server.js (vd anh cover mac dinh cho Zalo)
  scripts/create-test-article.js  tao thu 1 bai Zalo OA tu 1 bai vnPortal cu the (test thu cong)
  data/state.json           state chong gui trung (gitignore)
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

Toàn bộ logic nằm trong [frontend/DangTin/src/zalo/articleClient.js](frontend/DangTin/src/zalo/articleClient.js).

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

`frontend/DangTin/data/state.json` lưu lại `ArticleID` và khóa văn bản (`CodeID + DateOfIssued`)
đã gửi. Xóa file này nếu muốn gửi lại từ đầu (cẩn thận: sẽ gửi lại toàn bộ tin
hiện có trong lần chạy kế tiếp).

## Web app Infographic + Video hướng dẫn PCTT

Trang tĩnh cho người dân xem infographic và video hướng dẫn kỹ năng phòng
chống thiên tai, phục vụ tại `/infographic/` và `/video/` trên cùng domain.
Toàn bộ code + output nằm trong `frontend/HoTroPCTT/`:

```
frontend/HoTroPCTT/
  scripts/
    build-media-manifest.js   quet docs/, nen anh, sinh manifest + HTML  (can docs/)
    build-pages.js            sinh lai HTML tu manifest da commit        (KHONG can docs/)
    lib/slugify.js, lib/parseOrder.js
    lib/titles.js             lam sach tieu de hien thi (viet tat, loi go, VIET HOA)
    lib/categoryMeta.js       bieu tuong + mau cho tung chuyen de thien tai
    lib/generatePages.js      sinh trang + chi muc tim kiem (dung chung 2 script tren)
    templates/*.js            template HTML (layout, home, infographic, video)
  public/                      thu muc phuc vu web (Express serve tinh)
    assets/css/media.css       he thong giao dien (sang/toi, uu tien dien thoai)
    assets/js/viewer.js        doi kho anh, phong to anh, chia se
    assets/js/search.js        tim kiem khong dau, chay tren trinh duyet
    data/media-manifest.json   commit git
    data/search-index.json     sinh ra luc build, commit git
    index.html                 trang chu, infographic/**, video/**  - HTML tinh, commit git
    media/**                   anh/video nhi phan, GITIGNORE (qua lon cho git)
    vercel.json                cau hinh khi trien khai ban tinh len Vercel
  preview/                     ban thiet ke giao dien moi (index.html/script.js/styles.css,
                                du lieu demo) - THAM KHAO, chua noi voi pipeline build/templates o tren
```

### Sua giao dien (khong can docs/)

```bash
npm run build:pages
```

Sinh lai toan bo HTML tu `frontend/HoTroPCTT/public/data/media-manifest.json` da commit — dung
khi chi doi template/CSS/tieu de. Khong can thu muc `docs/` (~2.5GB) va khong can `sharp`.
Chay `npm run build:media` chi khi noi dung nguon (anh/video) thay doi.

**Tieu de**: manifest giu tieu de GOC theo ten file. Viec lam sach de hien thi
(`HD` → `Hướng dẫn`, `ko` → `không`, bo `_THỦ NGỮ`, ha VIET HOA...) chay luc render trong
`lib/titles.js`. Luu y: **khong duoc doi slug** — slug da nam trong URL dang chay va trong
duong dan file media tren VPS (`/media/infographic/<catSlug>/<itemSlug>/`).

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
`frontend/HoTroPCTT/public/data/media-manifest.json`, và sinh HTML tĩnh vào
`frontend/HoTroPCTT/public/infographic/`, `frontend/HoTroPCTT/public/video/` (các file này commit
vào git bình thường). File nhị phân (`frontend/HoTroPCTT/public/media/**`) bị gitignore
vì quá lớn cho GitHub (video 100-185MB/file, vượt giới hạn 100MB) — triển khai
riêng bằng `frontend/HoTroPCTT/scripts/deploy-media.sh` (scp thẳng lên VPS), KHÔNG qua
GitHub Actions.

`frontend/DangTin/src/server.js` phục vụ cả 2 thư mục tĩnh: `frontend/DangTin/public/`
(backend gốc, vd ảnh cover Zalo) và `frontend/HoTroPCTT/public/` (web app), cùng mount ở `/`.

⚠️ Route `app.get("/")` phải khai báo **trước** `express.static(frontendPublicDir)`.
Trang chủ cần chèn thẻ `<meta zalo-platform-site-verification>` vào `<head>`; nếu để
static tự trả `frontend/HoTroPCTT/public/index.html` thì thẻ này biến mất → hỏng bước "Xác thực
domain" trên Zalo Developers. (Cũng không dùng `{ index: false }` để chặn — nó tắt
index.html của **cả** thư mục con, làm `/infographic/` và `/video/` thành 404.)

Cập nhật nội dung sau này: chạy lại `npm run build:media` + `deploy-media.sh`,
rồi `git push` như bình thường để publish HTML/manifest mới.

## Triển khai bản tĩnh lên Vercel

Import repo trên vercel.com với **Root Directory = `frontend/HoTroPCTT/public`**, Framework
Preset = Other, không có build command (HTML đã commit sẵn).

⚠️ Sau đợt tái cấu trúc thư mục này, dự án Vercel đang trỏ tới `frontend/public` (đường dẫn
cũ) cần được **cập nhật thủ công trên Vercel dashboard** (Settings → General → Root Directory)
thành `frontend/HoTroPCTT/public`, nếu không site trên Vercel sẽ build lỗi/404.

`frontend/HoTroPCTT/public/vercel.json` lo phần ảnh/video: file nhị phân bị gitignore nên không
có trên GitHub, Vercel lấy chúng từ VPS —
- **ảnh** (`/media/infographic/*`): `rewrites` → proxy qua Vercel, URL vẫn thuộc domain
  Vercel và được CDN cache lại;
- **video** (`/media/video/*`): `redirects` → tải thẳng từ VPS, tránh đốt 100GB băng
  thông/tháng của gói Hobby vì mỗi video nặng 100–185MB.

Hệ quả: bản Vercel phụ thuộc VPS để có media. VPS sập thì giao diện vẫn chạy nhưng
ảnh/video mất.
