# Học RxJS

Project tài liệu tiếng Việt về RxJS, được xây dựng bằng Next.js App Router và Fumadocs.

## Phiên bản nền tảng

- Next.js 16.3.8
- React / React DOM 19.3.0
- Fumadocs UI / Core 16.16.0
- Fumadocs MDX 15.4.6
- Tailwind CSS 4

Yêu cầu Node.js 20.9.0 trở lên.

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000/docs](http://localhost:3000/docs).

> Project được scaffold trong môi trường không có network nên dependency chưa được cài và build chưa được chạy.

## Deploy Cloudflare Pages

Project dùng Next.js static export và sinh website vào thư mục `out/`.

- Build command: `npm run build`
- Build output directory: `out`

`wrangler.toml` đã khai báo `pages_build_output_dir = "./out"` để cấu hình trong repository là source of truth cho Cloudflare Pages.

## Nội dung

Tài liệu đi từ reactive programming, Observable, operators và Subjects đến higher-order streams, testing, integration, production patterns và troubleshooting. Các bài hiện là placeholder để được viết chi tiết từng trang trong bước tiếp theo.
