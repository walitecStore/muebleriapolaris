import Link from 'next/link';

const tasks = [
  [
    '1. Completa tu tienda',
    '/admin/configuracion',
    'Guarda el nombre, logo, contacto, dirección y datos de Yape. Usa tu QR real de Yape para recibir pagos.',
  ],
  [
    '2. Organiza el catálogo',
    '/admin/categorias',
    'Crea las categorías que usarás para ordenar tus productos.',
  ],
  [
    '3. Publica tus productos',
    '/admin/productos',
    'Agrega fotos, descripción, precio, existencias y entrega. Activa el producto para mostrarlo; desactívalo para retirarlo sin perder su historial.',
  ],
  [
    '4. Configura cobros y entregas',
    '/admin/pagos',
    'Habilita los medios de pago que tengas operativos. Revisa también las tarifas de envío antes de vender.',
  ],
  [
    '5. Autoriza vendedores',
    '/admin/vendedores',
    'Comprueba el abono de S/50 en tu Yape antes de aprobar la membresía. Puedes revisar o suspender vendedores desde aquí.',
  ],
  [
    '6. Atiende pedidos',
    '/admin/pedidos',
    'Verifica pagos, actualiza el estado del pedido y coordina la entrega. Atiende las devoluciones desde su sección.',
  ],
  [
    '7. Revisa tus resultados',
    '/admin/estadisticas',
    'Consulta cobros y reembolsos por día, semana, mes o año y descarga el reporte CSV. El neto cobrado no equivale a la utilidad.',
  ],
] as const;

export default function OwnerGuide() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-3xl font-black">Cómo administrar Polaris</h1>
        <p className="mt-3 text-slate-600">
          Realiza las tareas diarias desde este panel. No necesitas editar código ni ejecutar
          migraciones para cambiar productos o datos de tu tienda.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map(([title, href, description]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border bg-white p-5 hover:border-cyan-600 focus-visible:outline-cyan-700"
          >
            <h2 className="font-bold">{title} →</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Guarda y comprueba el resultado</h2>
        <p className="mt-2 text-sm text-slate-600">
          Después de guardar, abre la tienda para revisar tu cambio. El catálogo y los datos de la
          tienda se vuelven a consultar al regresar a la pestaña y cada minuto mientras está
          visible. Los productos deben estar activos, y sus vendedores deben tener una membresía
          vigente.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-cyan-800">
          <Link href="/catalogo">Ver catálogo →</Link>
          <Link href="/admin/envios">Revisar tarifas de envío →</Link>
          <Link href="/vender">Abrir panel de vendedor →</Link>
        </div>
      </section>
    </main>
  );
}
