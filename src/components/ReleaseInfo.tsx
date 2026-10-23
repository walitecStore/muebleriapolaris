import Link from 'next/link';
export default function ReleaseInfo() {
  const release = process.env.NEXT_PUBLIC_APP_RELEASE || 'local';
  return (
    <p className="mx-auto max-w-7xl px-5 pb-6 text-xs text-slate-400">
      Polaris · versión {release.slice(0, 7)} ·{' '}
      <Link href="https://muebleriapolaris.vercel.app" className="underline">
        Dirección principal de la tienda
      </Link>
    </p>
  );
}
