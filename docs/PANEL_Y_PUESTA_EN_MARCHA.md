# Panel de control y puesta en marcha

## Qué incluye

- `/admin`: resumen de cobros, pedidos pendientes, stock bajo, clientes y productos más vendidos.
- `/admin/estadisticas`: reportes por día, semana, mes y año, con fecha de referencia y exportación CSV.
- `/admin/productos`: búsqueda, categorías, filtro de stock y visibilidad, con paginación. Los productos se ocultan sin borrar el historial.
- `/admin/productos/nuevo` y `/admin/productos/[id]`: nombre, descripción, SKU, categoría, precio normal/oferta, existencias, imágenes, factor de envío y destacados. El formulario usa control de versión para no sobrescribir un stock modificado mientras se editaba.
- `/admin/categorias`: crear y editar categorías reales.
- `/admin/pedidos`: revisar pagos manuales con referencia real, filtrar pendientes y gestionar logística. Un pedido sin pago aprobado no puede prepararse ni entregarse.
- `/admin/clientes`: listado paginado y acceso a los pedidos de cada cliente.
- `/admin/devoluciones`: revisar solicitudes, aprobarlas y registrar un reembolso confirmado. Los estados finales no se reabren.
- `/admin/resenas`: publicar o rechazar reseñas; el cliente ya no recibe una confirmación de publicación ficticia cuando falla Supabase.
- `/admin/configuracion`: nombre, descripción, logo por URL, contacto, dirección, horarios, redes, RUC, políticas, Libro de Reclamaciones y origen de entregas.
- `/admin/pagos`: datos públicos de Yape, Plin y transferencia. Tarjeta/Mercado Pago no se habilitan sin una integración real.
- `/admin/envios`: cobertura, referencias, tarifas y ajustes por distrito.

Todas las rutas administrativas comparten un control de sesión/rol en el servidor. La base de datos mantiene sus propios permisos; ocultar el panel no es la barrera de seguridad.

## Cómo se cuentan las ventas

La zona horaria es `America/Lima` y la moneda es PEN. Las semanas empiezan el lunes y los intervalos incluyen su inicio y excluyen el final. El reporte diario agrupa por hora; semana/mes por día; año por mes.

- **Cobros aprobados:** suma de pedidos con pago aprobado, según `paid_at`, incluido el envío. Un pedido cancelado después de pagar sigue representando un cobro hasta registrar la devolución correspondiente.
- **Reembolsos:** importes efectivamente marcados como reembolsados, según `refunded_at`, aunque correspondan a una venta de otro período.
- **Neto cobrado:** cobros menos esos reembolsos. No es ganancia ni utilidad: no descuenta costos, impuestos ni otros gastos.
- **Más vendidos:** artículos de los pedidos pagados del período, antes de devoluciones y sin envío.
- Las alertas de pendientes, inventario y clientes reflejan el estado actual, independientemente del filtro temporal.

Los totales se agregan en Postgres para evitar el límite de filas de la API. Los costos internos de productos ya no son legibles por los roles públicos/clientes.

## Antes de usarlo en Supabase real

1. Respaldar la base y comprobar qué migraciones ya están aplicadas. **No volver a ejecutar las migraciones antiguas sobre una base con datos**: la inicial contiene `DROP TYPE ... CASCADE`.
2. Si están aplicadas las siete migraciones anteriores, revisar y ejecutar **una sola vez** `supabase/migrations/20261023125410_store_control_and_checkout_hardening.sql` mediante el flujo de migraciones de Supabase o el SQL Editor. El archivo está envuelto en una transacción y no contiene claves.
3. La migración agrega perfil de tienda, reportes, reservas e idempotencia, endurece perfiles, restringe costos y corrige pagos/devoluciones. Desactiva métodos de pago que no tengan configuración operativa. Revisar sus datos y volver a activarlos desde el panel.
4. En Supabase alojado, configura el bucket público `product-images` y políticas administrativas para subir/editar/borrar imágenes. Si el bucket ya existía, se conserva su configuración: revisar sus tipos/tamaño y cualquier política anterior que pudiera conceder permisos más amplios. Solo deben ser públicas las fotos comerciales, no documentos de clientes.
5. Crear o confirmar la cuenta que administrará la tienda. Un administrador autorizado puede asignarle el rol desde SQL Editor, sustituyendo el correo y comprobando que se actualice una sola fila:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'CORREO_REAL_DEL_RESPONSABLE'
RETURNING id, email, role;
```

La web no permite a los clientes cambiar roles ni borrar/recrear su perfil. No se utiliza `user_metadata.role` para autorizar administradores.

## Variables y acceso

En el entorno de desarrollo y en Vercel, configurar los valores propios de cada ambiente:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=CLAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=CLAVE_PRIVADA_SOLO_SERVIDOR
NEXT_PUBLIC_SITE_URL=https://DOMINIO_REAL
```

No copiar valores reales a Git, capturas o chats. Reemplazar la clave privilegiada que fue compartida anteriormente y actualizar sus consumidores antes de usarla. Los secretos de proxy deben tener como destino el hostname exacto del proyecto. No asignar `NEXT_PUBLIC_` a la clave privada.

Configurar en Supabase Auth el dominio y `/auth/callback` entre las URLs de redirección autorizadas. Verificar SMTP, confirmación y recuperación con un correo de prueba real. El callback ahora intercambia el parámetro `code`, guarda la sesión y rechaza destinos externos.

Para producción se recomienda un proveedor de rutas con garantías operativas. `GOOGLE_MAPS_SERVER_API_KEY` es opcional y exclusivamente de servidor, con Routes y Geocoding habilitadas. Los servicios públicos OSRM/Nominatim siguen como contingencia; las peticiones tienen tiempo máximo. El origen se toma del perfil de tienda, no de dos constantes distintas. Cambiarlo invalida las distancias de centro almacenadas, pero conserva las tarifas comerciales.

## Configuración del negocio

1. Abrir `/admin` con la cuenta administradora.
2. Completar Perfil de la tienda y publicar textos reales de privacidad, compra, entrega y garantía. El sistema no inventa datos bancarios, dirección comercial ni políticas legales.
3. Crear categorías y productos con fotos/precios/stock reales; marcar los que deben aparecer en destacados.
4. Cargar en Medios de pago el QR oficial, teléfono y titular, o los datos bancarios de transferencia, y activar solo los métodos operativos. Son datos que se mostrarán a los clientes, no credenciales de acceso.
5. Confirmar origen, distancias y tarifas por distrito. Los destinos sin cobertura automática requieren una cotización, no un envío gratuito.

## Inventario y operación diaria

Crear un pedido reserva/descuenta stock del producto y de la variante de forma atómica. Para un producto con variantes, controlar tanto su stock total como el de las variantes existentes. El formulario principal administra el producto; la creación/edición avanzada de variantes se mantiene fuera del alcance de esta primera pantalla.

Los reintentos usan una clave de compra y no crean ni descuentan dos veces el mismo pedido. Cambiar carrito, método o destino representa una nueva solicitud. La clave se conserva en la pestaña para reintentos tras errores de red. El carrito se vacía al registrar el pedido; el pago pendiente se retoma en Mis pedidos.

La reserva vence a las 24 horas, pero **su liberación no depende de un proceso que esta versión no haya instalado**: el panel muestra las reservas vencidas y ofrece `Liberar reservas vencidas`. La acción cancela pedidos sin pago y devuelve el stock, incluidas reservas con pago rechazado/fallido. Ejecutarla en la revisión diaria. No se ha configurado un cron remoto.

Cancelar un pedido reservado restituye sus unidades exactamente una vez. Un pedido cancelado no se reactiva ni admite nuevos pagos. Cancelar no es reembolsar dinero. Un reembolso manual exige una referencia real; la aplicación no transfiere dinero ni repone automáticamente un artículo que podría llegar dañado. Revisar físicamente una devolución antes de ajustar inventario.

## Desarrollo y comprobaciones

Usar Node 24 LTS (`.nvmrc`) y `npm ci`.

```sh
npm run dev                 # puerto 4028, con variables propias configuradas
npm test                    # períodos Lima, redirecciones, CSV, checkout, límites y tarifas
npm run type-check
npm run lint
npm run test:database        # requiere Docker local; crea y elimina su propio Postgres aislado
npx playwright install chromium
npm run test:browser         # compila y prueba con un backend HTTP sintético
```

`test:database` aplica las ocho migraciones a Postgres 17 y prueba RLS/permisos, privacidad de costos, Storage simulado, reservas, reintentos, concurrencia de última unidad, aprobación manual, reembolsos y reportes. Auth y Storage se representan mediante un esquema mínimo: no es una instancia completa de Supabase.

`test:browser` utiliza sesiones y respuestas ficticias únicamente en localhost, comprueba accesos, callback inválido, catálogo/carrito, períodos, CSV, móvil, perfil y editor de productos. Sus capturas y cifras son demostraciones, no ventas reales. Los archivos TypeScript ajustados automáticamente por Next durante esta prueba se restauran al terminar. No ejecutar `dev` y compilaciones simultáneamente en el mismo checkout.

Después de pruebas con valores ficticios, ejecutar **una compilación nueva con las variables reales** antes de desplegar: `NEXT_PUBLIC_*` queda integrado en los archivos del navegador.

## Criterio de salida a producción

- Migración verificada, claves rotadas y cuentas cliente/admin con permisos separados.
- Alta/confirmación, inicio/cierre y recuperación de acceso probados con correo real.
- Catálogo sin productos de ejemplo y compra de prueba con stock y envío correctos.
- Pago manual contrastado con la cuenta real; avance logístico y cancelación probados.
- Políticas y datos comerciales completos; validar facturación y requisitos comerciales aplicables con el responsable de la tienda.
- Preview de Vercel revisado con HTTPS, fotos, dominio y variables apropiadas; luego publicación de producción.

Los tests locales no establecen que estos pasos ya se hayan ejecutado en Supabase/Vercel reales. Tarjeta, Mercado Pago, facturación electrónica y creación avanzada de variantes no se anuncian como integraciones terminadas.
