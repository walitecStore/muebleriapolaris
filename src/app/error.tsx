'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es"><body className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <main className="mx-auto mt-24 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Muebleria Polaris</p>
        <h1 className="mt-3 text-3xl font-extrabold">Algo no salio como esperabamos</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">No se perdio tu informacion. Intenta nuevamente o vuelve al inicio.</p>
        <div className="mt-7 flex justify-center gap-3"><button onClick={reset} className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white">Reintentar</button><a href="/" className="rounded-xl border border-slate-200 px-5 py-3 font-bold">Inicio</a></div>
      </main>
    </body></html>
  );
}
