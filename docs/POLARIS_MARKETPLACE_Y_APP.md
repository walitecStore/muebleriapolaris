# Polaris: vendedores, ofertas y aplicación

## Publicación y activación

Esta entrega convierte la tienda en una plataforma con un panel del dueño separado del panel de vendedores. No requiere convertir a los vendedores en administradores.

1. Conservar un respaldo de Supabase.
2. La migración anterior `20261023125410_store_control_and_checkout_hardening.sql` debe estar aplicada (ya fue ejecutada por el dueño en el SQL Editor).
3. Ejecutar **una sola vez** el archivo nuevo `supabase/migrations/20261023170000_polaris_marketplace.sql` completo: de `BEGIN;` a `COMMIT;`. No repetir las ocho migraciones anteriores.
4. El dueño entra desde **Ingresar → Panel del dueño**, o `/admin`. Usa el correo y contraseña de su cuenta existente. Pagar una membresía nunca asigna el rol `admin`.
5. En `/admin/configuracion`, subir el archivo original del logo y el QR de cobro exportado desde Yape. Confirmar número `916832791`, nombre real del titular y guardar el perfil. El sistema no inventa el contenido del QR.
6. En `/admin/envios`, revisar tarifas comerciales antes de recibir pedidos. Los parámetros proceden de las migraciones anteriores y pueden modificarse.
7. Probar el registro de una cuenta real de vendedor, un pago de S/50 verificado manualmente, una publicación, un pedido y su entrega. No aprobar referencias ficticias en producción.

El entorno de desarrollo actual tiene GitHub, pero no credenciales administrativas de Supabase. El SQL local se prueba en PostgreSQL desechable; no equivale a haber actualizado la base alojada. El despliegue conserva el catálogo básico si la migración nueva aún no está disponible; vendedores, cupones y ofertas necesitan esta migración.

## Dueño y vendedores

- `/acceso`: entrada visible a compras, vendedores y dueño.
- `/admin`: el dueño ve el panel completo existente: productos, clientes, pedidos, devoluciones, ventas, datos de negocio, medios de pago y envíos.
- `/admin/vendedores`: verifica pagos, revisa membresías, suspende y reactiva vendedores. Muestra ingresos históricos por membresías separados de ventas de productos.
- `/vender`: registro del nombre de negocio, descripción, teléfono, foto/logo por URL, transporte y coordinación.
- La membresía cuesta S/50 y cada pago aprobado agrega **un mes calendario** desde el vencimiento vigente o desde la aprobación. No es un débito automático.
- El vendedor registra el número de operación. El dueño compara el abono real en Yape antes de aprobarlo. Una referencia o una captura no confirma por sí misma el pago.
- Al vencer o suspenderse la membresía, los productos del vendedor dejan de ser públicos y no se pueden comprar ni editar. El historial de ventas permanece disponible. Renovar vuelve a habilitar las publicaciones activas.
- `/vender/productos`: administrar únicamente productos propios, con precios de oferta, stock, imágenes y entrega en motorizado o camión, coordinada con Polaris o con transportista particular.
- `/vender/pedidos`: últimas 200 líneas de venta del vendedor; dirección y referencia solo después del pago. El estado global y la aprobación del pago los maneja el dueño.
- `/vender/estadisticas`: día, semana (lunes a domingo), mes y año, horario de Perú. Agregación SQL de todo el período, sin el límite de 200 líneas de la lista. Ventas brutas, descuentos distribuidos por línea, reembolsos y ventas netas. No incluye envío ni membresía y no representa utilidad ni transferencia al vendedor.
- `/tiendas/<id>`: perfil comercial público seguro y catálogo del vendedor activo. No publica el correo ni el teléfono privado del perfil de usuario.

**Liquidación al vendedor:** las ventas se cobran con los medios configurados por Polaris. El despacho y la transferencia al vendedor se coordinan con el dueño. Esta entrega no ejecuta transferencias, divide fondos ni integra una pasarela de pagos de marketplace. No debe presentarse como un servicio de abonos automáticos.

## Tarjetas, favoritos y búsquedas

Todas las listas activas de catálogo, destacados, favoritos, recomendaciones y buscador usan `ProductCard`: foto, corazón, disponibilidad, descripción, precio, carrito y detalles. Si hay variantes, se eligen en la página del producto para no añadir una variante incompleta.

Los visitantes pueden guardar hasta 200 favoritos en el navegador. Al iniciar sesión se sincronizan en su cuenta de Supabase. Las búsquedas recientes (máximo 12) se guardan solo en ese navegador, se usan para recomendaciones y pueden borrarse. No se envía este historial a redes publicitarias.

## Ofertas y ruleta

Interpretación de la instrucción comercial: **hasta S/60**, incluyendo productos de S/40, S/50 y S/60; no se muestran productos de S/70 o más en `/ofertas`.

- Solo productos que aceptan participar. El vendedor puede desmarcar la opción; el descuento reduce el importe de su venta.
- El precio que decide la elegibilidad es el precio final por unidad, incluyendo ajustes de variante.
- Por cada S/150 elegibles, S/10 menos: S/150→S/10, S/300→S/20, S/450→S/30. Envío excluido.
- Ruleta: un cupón por cuenta y día calendario en Lima. S/5, S/10 o S/15 con igual probabilidad, mínimo S/150 elegibles, vigencia de 24 horas, un uso. Volver a girar devuelve el mismo cupón de ese día.
- No se acumula el cupón con el descuento por monto: se aplica el mayor. Ejemplo S/300 elegibles y cupón de S/15: descuento S/20.
- El descuento y el consumo del cupón se calculan dentro de la misma transacción SQL que reserva inventario. Reintentar un pedido no crea otro descuento ni descuenta stock dos veces.
- Los reembolsos no pueden exceder el importe pagado por mercancía después de descuentos.
- La ventana promocional de inicio solo aparece si existen productos participantes; se muestra una vez por sesión del navegador.

## Envíos en los 43 distritos de Lima Metropolitana

Se corrigió la interpretación de Nominatim: por ejemplo Comas viene como `city`, y Lima Metropolitana como `state_district`. La provincia ya no se confunde con el distrito.

El motor verifica el destino y la distancia vial con Google (si hay clave del servidor) o Nominatim + OSRM. Solo hay dos consultas externas por destino, se agrupan solicitudes simultáneas iguales y se reutiliza la ruta cinco minutos en la misma instancia.

- Se respetan las tarifas base por distrito configuradas.
- Para distritos sin tarifa fija, se usan los tramos de distancia ya existentes en `shipping_distance_bands`.
- Los ajustes antes/después del centro solo se aplican cuando el dueño configuró una distancia de centro. No se inventan distancias de ruta.
- Se respetan mínimo, máximo y factor de volumen, redondeando según la regla comercial existente.
- San Martín de Porres se habilita dentro de los 43 distritos.
- Callao y provincias fuera de Lima Metropolitana requieren cobertura y condiciones propias; no se clasifican falsamente como Lima.
- Si geocodificación o rutas no responden, no se inventa un precio y no se crea un pedido con envío desconocido.
- Elegir motorizado o camión registra la logística del producto; no contrata al conductor ni garantiza una tarifa diferente por sí solo. Las tarifas las controla Polaris.

Los servidores gratuitos de Nominatim y OSRM son servicios de uso público sin garantía comercial. Para crecimiento, configurar un proveedor contratado o instancias propias; no interpretar disponibilidad en pruebas como garantía permanente.

## Aplicación y anuncios

- `/instalar`: aplicación web instalable (PWA), Android, iOS y computadoras compatibles.
- Manifest, iconos 192/512, inicio independiente y pantalla sin conexión. Nunca se cachean APIs, pagos, sesiones ni páginas privadas.
- El propietario puede subir el logo comercial exacto para la web. Los iconos de instalación estáticos deben sustituirse por exportaciones 192/512 del logo original antes de presentar una versión definitiva a las tiendas.
- Google Play: requiere cuenta del propietario en Play Console, dominio definitivo HTTPS, empaquetado Android firmado (por ejemplo Trusted Web Activity), vinculación Digital Asset Links con la huella real del certificado, ficha, privacidad, clasificación de contenido y revisión de Google. No hay APK firmado ni publicación en Play en esta entrega; no se usa una huella o una cuenta inventada.
- `/vender/anuncios`: dos plantillas de imagen cuadrada 1080×1080 con nombre, precio y fotografía del producto; descarga PNG, copia de texto, enlace al producto y compartir por Facebook/WhatsApp/selector del dispositivo.
- Fotos externas que no permitan CORS pueden no incorporarse al PNG. Las imágenes subidas al almacenamiento de Polaris son la opción recomendada; siempre se puede compartir el enlace y el texto.
- Facebook Marketplace, Instagram y otras redes exigen permisos, cuentas e integraciones oficiales para publicar por API. No se promete publicación automática gratuita donde no existe. No se publican mensajes en nombre del usuario sin su acción.

## Validación

Ejecutar `npm test`, `npm run type-check`, `npm run lint`, `npm run test:database` y `npm run test:browser`.

Los tests SQL verifican permisos, aislamiento de vendedores, membresías, cupones, descuentos, vencimiento, privacidad de direcciones y las garantías previas de inventario/pagos. Las pruebas de navegador usan datos sintéticos; no prueban depósitos reales, correo SMTP ni publicaciones en redes. El ensayo final en Supabase/Vercel debe hacerse con la migración aplicada y datos reales del negocio.
