import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
export default function Access() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[80vh] max-w-4xl px-5 pb-16 pt-32">
        <h1 className="text-3xl font-black">Tu espacio en Polaris</h1>
        <p className="mt-3 text-slate-600">
          Ingresa con tu correo y contraseña. Cada cuenta ve únicamente las funciones autorizadas.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            [
              'Comprar',
              'Guarda favoritos y revisa tus pedidos.',
              '/login?next=/pedidos',
              'Ingresar a mi cuenta',
            ],
            [
              'Vender',
              'Crea tu perfil y activa tu membresía de S/50 al mes.',
              '/vender',
              'Panel del vendedor',
            ],
          ].map(([title, text, url, cta]) => (
            <section key={title} className="space-y-4 rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-slate-600">{text}</p>
              <Link
                className="inline-block rounded-full bg-cyan-600 px-4 py-3 text-sm font-bold text-white"
                href={url}
              >
                {cta}
              </Link>
            </section>
          ))}
        </div>
        <Link href="/register" className="mt-8 inline-block text-cyan-700 underline">
          Crear una cuenta
        </Link>
      </main>
      <Footer />
    </>
  );
}
