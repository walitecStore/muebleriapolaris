# Revisión de publicación y perfil de Polaris

## Hallazgos y correcciones

1. La dirección reportada por el dueño, `https://muebleriapolaris-1l3505adh-walitecstores-projects.vercel.app/#inicio`, corresponde al despliegue `8a91c5c`. Es una URL inmutable anterior a las tarjetas compartidas, ruleta, membresías y aplicación instalable del commit `7fe3e42`.
2. La dirección principal declarada en la configuración del repositorio es `https://muebleriapolaris.vercel.app`. Los enlaces de uso cotidiano deben apuntar a esta dirección. No se deben entregar enlaces de despliegues antiguos como si se actualizaran automáticamente.
3. El formulario de Mi Perfil conservaba un `upsert` que intentaba insertar un perfil y cambiar `email`, además de escribir en `telefono`. La seguridad del proyecto permite solo modificar `full_name`, `phone` y `avatar_url`. Se reemplazó por UPDATE de nombre/teléfono sobre el UUID del usuario autenticado, sin permisos nuevos de INSERT/DELETE ni cambios de rol. La lectura recupera el teléfono legado si aún está guardado en `telefono`.
4. El enlace al panel del dueño ahora está visible en una fila del encabezado tanto en móvil como en escritorio y entre las opciones de Mi Perfil. Un usuario sin rol de dueño ve su cuenta y una explicación; no se lo devuelve silenciosamente al inicio.
5. El pie y `/api/release` identifican la versión del código y la dirección principal. Los nuevos despliegues de producción redirigen desde su URL temporal a la dirección principal; no es posible modificar retroactivamente un despliegue inmutable antiguo.
6. La integración de Supabase reportaba un fallo al crear el índice de `profiles.role`. La migración inicial contenía DROP TYPE CASCADE, que puede eliminar columnas dependientes cuando ya existen tablas. La inicialización ahora conserva tipos y datos existentes y añade las columnas de perfil faltantes. Esto corrige instalaciones/pruebas futuras; no implica volver a ejecutar la migración inicial en producción.

## Funciones revisadas

- Tarjetas compartidas de inicio/catálogo/favoritos/buscador/recomendaciones con descripción, favoritos, disponibilidad, precio, carrito y detalles.
- Ofertas de productos participantes de hasta S/60; descuento validado en servidor y SQL de S/10 por cada S/150 elegibles. Cupones de ruleta sin acumulación indebida.
- Mi Perfil puede guardar nombre y teléfono sin modificar email ni rol.
- La solicitud de membresía registra S/50 pendientes; solo el dueño puede aprobar el abono real.
- El vendedor solo administra sus productos y sus ventas. Las direcciones se muestran después del pago.
- La generación de anuncios produce un PNG descargable y texto/enlaces para compartir. No publica automáticamente en redes que no ofrecen una integración abierta.
- Instalación PWA y navegación móvil/escritorio. Publicar en Google Play sigue requiriendo el proceso de la cuenta del propietario.
- Los tests del servidor de envíos usan respuestas de proveedores con la forma real de Nominatim: Comas, Miraflores, San Martín de Porres y el límite con Callao. Comprueban tarifas, volumen y reutilización de rutas. La prueba de datos verifica cobertura configurada de los 43 distritos de Lima Metropolitana.

## Validación y límites

`npm test`, `npm run type-check`, `npm run lint`, `npm run test:database`, `npm run test:browser`.

Las pruebas de navegador usan cuentas y pagos sintéticos. Los tests SQL incluyen una base con perfiles y tipos previamente existentes para comprobar que no se eliminan datos, además de permisos, inventario, membresías y descuentos. No prueban un depósito Yape real ni la cuenta privada del dueño.

La sesión actual dispone de GitHub, pero no tiene token de Vercel ni acceso administrativo a Supabase. El proxy también bloquea la apertura directa de los dominios Vercel; la publicación se confirma mediante los estados de despliegue de GitHub/Vercel, sin afirmar haber navegado la cuenta alojada. La autorización inicial del dueño exige un operador autorizado de la base; no se convierte al primer visitante en administrador ni se acepta una contraseña compartida.

No repetir migraciones ya ejecutadas. El logo y QR de cobro deben cargarse desde sus archivos originales en Perfil de la tienda. El QR de Yape no se puede derivar de forma verificada únicamente del número de teléfono.

El acceso del dueño incluye «Soy el propietario: autorizar mi cuenta». Genera un comando SQL únicamente para el UUID de la cuenta autenticada; el propietario debe ejecutarlo en su propio SQL Editor y comprobar el correo devuelto. La aplicación no ejecuta el cambio de rol ni permite autoasignarse admin mediante una API. Así se evita pedir contraseñas y repetir manualmente el correo de la cuenta.

La integración detectó además un BOM UTF-8 al principio de `20260830220000_commerce_foundation.sql`. Se retiró ese carácter invisible sin modificar su SQL y el verificador local ahora rechaza esa codificación antes de migrar.

## Administración cotidiana sin despliegues

El panel incorpora `/admin/guia`, accesible desde «Cómo administrar» y el resumen.
Vincula las tareas existentes de configuración, categorías, productos, cobros,
vendedores, pedidos y reportes. Conserva el acceso exclusivo del administrador;
los vendedores siguen entrando a `/vender` y administran sus propios datos.

Las tarjetas recuperan el contenedor, foto, colores y botones del catálogo anterior,
conservando descripción, favoritos y «Ver detalles». El catálogo y el perfil público
de tienda consultan los datos sin caché al recuperar el foco, reconectar o volver
visible la pestaña, y cada 60 segundos mientras está visible. Al refrescar el
catálogo se vuelve a la primera página para evitar duplicar resultados paginados.
No requiere activar Supabase Realtime ni aplicar una migración nueva.

La prueba de navegador usa un backend sintético: cambia el nombre de un producto
en ese backend y comprueba que aparece al recuperar el foco sin recargar la página.
También comprueba la guía y su enlace al administrador de productos. Esto no
certifica credenciales, permisos ni datos de la base alojada del propietario.

## Acceso administrativo separado de la tienda pública

Por decisión del propietario, se retiraron los enlaces «Panel del dueño» del
encabezado, menú móvil, pie, página de acceso y perfil del comprador. El acceso
administrativo se conserva en `/admin`, con autenticación y comprobación del rol
en el servidor. La ausencia del enlace no sustituye esa autorización. El dueño
puede guardar esa dirección en sus favoritos. Los vendedores conservan su acceso
a `/vender`, y los compradores acceden a «Mi cuenta». Esta decisión sustituye la
recomendación anterior de mostrar el panel al público para facilitar encontrarlo.

## Reparación de autorización inicial del dueño

El error `Only administrators can change profile roles` identifica la versión
antigua de `protect_profile_role` (etapa 2), que bloquea el primer administrador
incluso en SQL Editor cuando no existe `auth.uid()` de la aplicación. La nueva
migración `20261023200000_owner_role_bootstrap.sql` repone la protección de etapa 8,
con `SECURITY INVOKER` explícito: solo `postgres` y `supabase_admin` pueden cambiar
roles. No desactiva triggers ni RLS, ni concede UPDATE(role) a clientes.

El comando mostrado en la pantalla de autorización ahora incluye esa reparación
antes del UPDATE de la cuenta autenticada, dentro de una transacción. Ejecutarlo
únicamente desde SQL Editor con el rol postgres. No volver a ejecutar migraciones
antiguas para solucionar este error. La migración sola no autoriza ninguna cuenta;
el UPDATE generado en la pantalla autoriza el UUID concreto de quien inició sesión.

La prueba SQL comprueba que postgres puede autorizar y que el trigger rechaza a un
comprador incluso concediendo temporalmente UPDATE(role), con rollback completo.

## Perfil de tienda: proteger el guardado ante errores

La configuración ahora exige una lectura correcta antes de permitir modificaciones.
Si falla la consulta, muestra el error con «Reintentar carga del perfil», sin un
formulario con valores vacíos o predeterminados que pudiera sobrescribir datos.
También se bloquea Guardar mientras se sube el logo o QR, y se bloquean nuevas
subidas mientras se guarda. Cargar una imagen borra el aviso de guardado anterior:
el archivo nuevo todavía requiere Guardar perfil para publicarse.

La aceptación de navegador simula una lectura fallida, comprueba que no existe
el botón Guardar, reintenta con éxito, modifica el nombre, guarda y recarga para
comprobar su persistencia. El backend es sintético; los archivos originales del
logo y QR deben subirlos los propietarios desde el panel.

## Productos: carga segura y pruebas de administración

El editor compartido de dueño y vendedor no permite guardar si falla la carga de
categorías o del producto, y ofrece reintentar. Esto incluye el alta de productos:
no se muestra un formulario incompleto como si hubiera cargado correctamente.
Los vendedores ya no ven el enlace a gestionar categorías globales del dueño.

La aceptación de navegador amplía la cobertura con la creación de un producto
oculto (nombre, descripción, identificador automático, precio y stock), fallo de
lectura y recuperación del editor, y cambios de precio y stock en un producto
existente. Comprueba que el UPDATE mantiene la condición updated_at para rechazar
ediciones que sobrescriban ventas concurrentes y conserva la imagen de portada.
Estas pruebas usan datos sintéticos y no crean productos en la tienda alojada.

## Vendedores: carga y vigencia de membresía

La cuenta de vendedor bloquea formularios cuando falla la lectura del perfil o
historial de pagos y ofrece reintentar. Guarda el perfil comprobando que Supabase
devuelva la fila afectada, valida nombre/teléfono y conserva los datos introducidos
al consultar de nuevo la membresía. La vigencia y el historial se actualizan al
volver a la pestaña, recuperar la conexión y cada minuto visible, sin sobrescribir
la edición del perfil. Las fechas de vigencia usan America/Lima.

Si hay un pago pendiente, muestra el estado y bloquea otra solicitud tanto en el
botón como en el manejador. Las restricciones SQL de pagos de S/50 y de solicitudes
pendientes siguen siendo la autoridad. La referencia no prueba un abono: el dueño
verifica en Yape y aprueba manualmente en Vendedores y membresías.

La aceptación de navegador simula error de lectura, reintento, membresía vencida
y posterior aprobación desde el backend. Comprueba que al recuperar el foco se
actualiza la vigencia sin perder el nombre que todavía se estaba editando.
