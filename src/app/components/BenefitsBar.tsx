import Link from 'next/link';
export default function BenefitsBar() {
  return (
    <section className="border-b bg-slate-50 px-5 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Envío según ubicación', 'Consulta cobertura y tarifas', '/politicas/envios'],
          ['Condiciones claras', 'Revisa garantía y devoluciones', '/politicas/devoluciones'],
          ['Pago verificado', 'Sigue tu pedido desde tu cuenta', '/pedidos'],
          ['Productos disponibles', 'Consulta precios y existencias', '/catalogo'],
        ].map(([title, detail, url]) => (
          <Link key={url} href={url} className="text-center">
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
