# Envíos por ubicación (Etapa 5)

El checkout envía únicamente las coordenadas y categorías a `/api/shipping`. El servidor
obtiene la ruta, identifica provincia/distrito y consulta las tarifas configurables de
Supabase. Al confirmar, `/api/checkout` repite todo el cálculo y la RPC vuelve a calcular
productos, precios, cantidades, envío y total; el costo o la distancia enviados por el
navegador nunca son autoritativos.

Configure `GOOGLE_MAPS_SERVER_API_KEY` **solo en el servidor** con acceso a Routes API y
Geocoding API para producción. No use el prefijo `NEXT_PUBLIC_`. Sin la variable, el sistema
usa los servicios públicos OSRM y Nominatim como fallback sin secretos, apropiado para
desarrollo o contingencia pero sin SLA. Las tarifas se administran en
`shipping_distance_bands` y `shipping_zone_adjustments` después de ejecutar manualmente la
migración de Etapa 5.
