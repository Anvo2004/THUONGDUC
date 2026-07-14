# Tiện ích tự động đăng tin vnPortal → Zalo OA (Thượng Đức)

Service Node.js chạy nền, định kỳ gọi API vnPortal (`/api/public/articles`,
`/api/public/documents`) để phát hiện tin bài / văn bản mới, sau đó tự động gửi
broadcast (dạng List Template) tới người quan tâm Zalo OA — tương tự cách
Tổng đài 1022 Đà Nẵng tự động đẩy tin tức.

## Cấu trúc

```
src/
  config.js            đọc cấu hình từ .env
  vnportal/client.js   gọi API vnPortal (categories/articles/documents)
  zalo/client.js       refresh token + gửi broadcast Zalo OA
  state/store.js       lưu ID tin/văn bản đã gửi vào data/state.json (chống gửi trùng)
  services/            logic đối chiếu "tin mới" và gọi Zalo gửi
  index.js             scheduler (node-cron) + chế độ chạy 1 lần (--once)
```

## Cài đặt

```bash
npm install
copy .env.example .env    # Windows
```

Điền vào `.env`:
- `VNPORTAL_HOST_NAME`: domain thật của site vnPortal (không có `/` cuối)
- `ZALO_APP_ID`, `ZALO_APP_SECRET`: lấy từ ứng dụng đã tạo trên developers.zalo.me
- `ZALO_OA_ACCESS_TOKEN`, `ZALO_OA_REFRESH_TOKEN`: token có được sau khi hoàn
  tất OAuth lần đầu cho OA (token sẽ tự refresh và lưu vào `data/zalo-token.json`
  cho các lần sau, không cần sửa `.env` nữa)

## ⚠️ Bắt buộc kiểm tra trước khi bật gửi thật

Phần gọi API Zalo trong [src/zalo/client.js](src/zalo/client.js) được viết dựa
trên hiểu biết chung về Zalo OA OpenAPI (v3.0 Message API, v4 OAuth refresh),
**chưa được đối chiếu trực tiếp với tài liệu developers.zalo.me** tại thời
điểm viết (trang tài liệu render bằng JavaScript nên không tự động lấy được
nội dung). Trước khi dùng thật:

1. Đăng nhập https://developers.zalo.me, mở app OA của bạn, kiểm tra:
   - Endpoint gửi tin broadcast chính xác (`BROADCAST_URL` trong `zalo/client.js`)
   - Cấu trúc payload (field `recipient.target.broadcast_type`, list template
     `elements`) đúng theo phiên bản API OA hiện tại của bạn
   - OA của bạn đã được cấp quyền gửi "tin truyền thông broadcast" hay chưa
     (tính năng này thường cần OA đã xác thực/đủ điều kiện, giống Tổng đài 1022)
2. Sửa lại các hàm `buildListElement()` và `broadcastListMessage()` nếu field
   không khớp — toàn bộ logic gửi Zalo nằm gọn trong 1 file này.
3. Giữ `ZALO_SEND_ENABLED=false` (mặc định) để chạy dry-run trước — log sẽ in
   ra payload dự định gửi mà không gọi API thật.

## Chạy thử (dry-run, 1 lần)

```bash
npm run sync:once
```

Xem log console để kiểm tra danh sách tin/văn bản "mới" phát hiện được và
payload sẽ gửi. Nếu ổn, đặt `ZALO_SEND_ENABLED=true` trong `.env`.

## Chạy nền liên tục

```bash
npm start
```

Mặc định polling mỗi 10 phút (`SYNC_CRON_EXPRESSION=*/10 * * * *`). Để chạy
như Windows Service, có thể dùng [PM2](https://pm2.keymetrics.io/) hoặc
Task Scheduler trỏ vào `npm start`.

## Chống gửi trùng

`data/state.json` lưu lại `ArticleID` và khóa văn bản (`CodeID + DateOfIssued`)
đã gửi. Xóa file này nếu muốn gửi lại từ đầu (cẩn thận: sẽ gửi lại toàn bộ tin
hiện có trong lần chạy kế tiếp).

