# Pagos — Etapa 6

## Estado funcional

- Los pedidos nacen con pago `pending`; pago y logística permanecen separados.
- Yape/Plin y transferencia son flujos manuales. El QR y los datos bancarios solo se muestran si un administrador los carga en `payment_methods.metadata`.
- Transferencia no requiere proveedor: puede activarse con `bank`, `account_holder` y `account_number` oficiales en `metadata` (`cci` es opcional). Sin esos campos no aparece como método iniciable.
- Continuar, reintentar y cambiar método reutilizan el pedido. Un índice parcial impide dos intentos pendientes simultáneos.
- “Ya realicé el pago” únicamente ejecuta una consulta GET; no crea intentos ni modifica estados.
- La aprobación/rechazo manual usa `review_manual_payment`, protegida por `is_admin()`. El cliente solo consulta el estado.

## Proveedor automático pendiente

Tarjeta, código de pago y Mercado Pago permanecen deshabilitados hasta contar con un proveedor real. Para producción se debe implementar un adaptador que tokenice la tarjeta en el SDK del proveedor, valide la firma con `PAYMENT_WEBHOOK_SECRET`, use `PAYMENT_PROVIDER_ACCESS_TOKEN` solo en servidor, registre el `event_id` en `payment_events` y actualice el intento de forma idempotente. El endpoint de webhook responde `501` hasta entonces y nunca simula aprobación.

No se deben guardar PAN, CVV, credenciales, QR inventados ni códigos inventados en la base de datos o en almacenamiento del navegador.
