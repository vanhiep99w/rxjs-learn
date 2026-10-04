import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <meta httpEquiv="refresh" content="0; url=/docs/" />
      <div>
        <p>Đang chuyển đến tài liệu RxJS…</p>
        <Link className="underline" href="/docs/">
          Mở tài liệu
        </Link>
      </div>
    </main>
  );
}
