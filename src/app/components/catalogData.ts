export interface SofaReview {
  id: number;
  name: string;
  initials: string;
  location: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verified: boolean;
  helpful: number;
  tags: string[];
  avatarColor: string;
}

export interface SofaProduct {
  id: number;
  name: string;
  style: 'Moderno' | 'Clásico' | 'Minimalista' | 'Escandinavo' | 'Industrial';
  color: 'Gris' | 'Beige' | 'Azul' | 'Verde' | 'Rojo' | 'Negro' | 'Blanco';
  seats: '1 plaza' | '2 plazas' | '3 plazas' | 'Chaise Longue';
  price: string;
  description: string;
  image: string;
  // Extended fields for product detail page
  gallery?: string[];
  specs?: Record<string, string>;
  features?: string[];
  reviews?: SofaReview[];
  rating?: number;
  reviewCount?: number;
  sku?: string;
  availability?: string;
}

export const sofaProducts: SofaProduct[] = [
{
  id: 1,
  name: 'Sofá Nórdico Oslo',
  style: 'Moderno',
  color: 'Gris',
  seats: '3 plazas',
  price: '$1,299',
  description: 'Diseño escandinavo con patas de madera natural',
  image: "/assets/images/sofa_azul__cama-1784572914608.jpg",
  gallery: [
  "/assets/images/sofa_azul__cama-1784572914608.jpg",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones': '220 × 90 × 80 cm',
    'Profundidad de asiento': '58 cm',
    'Altura de asiento': '44 cm',
    'Material tapizado': 'Tela chenilla premium',
    'Estructura': 'Madera de pino macizo',
    'Patas': 'Madera natural de roble',
    'Relleno': 'Espuma HR 35 kg/m³',
    'Peso': '48 kg',
    'Capacidad de carga': '350 kg'
  },
  features: ['Patas de madera natural desmontables', 'Tapizado resistente a manchas', 'Cojines de respaldo extraíbles', 'Estructura reforzada', 'Fácil montaje en 15 min'],
  rating: 4.9,
  reviewCount: 87,
  sku: 'POL-OSLO-GR-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Valentina Morales', initials: 'VM', location: 'Ciudad de México', rating: 5, title: 'Superó todas mis expectativas', text: 'Compré el Sofá Nórdico Oslo hace 3 meses y sigue luciendo impecable. La calidad de la tela es increíble, muy fácil de limpiar. El proceso por WhatsApp fue súper ágil, me enviaron fotos reales del producto antes de confirmar.', date: 'Hace 2 semanas', verified: true, helpful: 24, tags: ['Calidad premium', 'Entrega rápida', 'Fácil de limpiar'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Carlos Mendoza', initials: 'CM', location: 'Monterrey, México', rating: 5, title: 'Perfecto para mi sala', text: 'Las patas de madera le dan un toque muy elegante. El color gris combina con todo. La entrega fue puntual y bien embalado. Muy recomendado.', date: 'Hace 1 mes', verified: true, helpful: 18, tags: ['Elegante', 'Buen embalaje'], avatarColor: 'bg-secondary' },
  { id: 3, name: 'Sofía Ramírez', initials: 'SR', location: 'Guadalajara, México', rating: 4, title: 'Muy cómodo, diseño hermoso', text: 'El sofá es precioso y muy cómodo. Le doy 4 estrellas porque tardó un poco más de lo esperado en llegar, pero el producto vale cada centavo. La tela es suave y resistente.', date: 'Hace 2 meses', verified: true, helpful: 11, tags: ['Cómodo', 'Diseño hermoso'], avatarColor: 'bg-accent' }]

},
{
  id: 2,
  name: 'Sofa Europeo Baul',
  style: 'Clásico',
  color: 'Beige',
  seats: '3 plazas',
  price: '$1,599',
  description: 'Elegancia atemporal con tapizado en tela premium',
  image: "/assets/images/sofa_baul__celeste-1784572929056.jpg",
  gallery: [
  "/assets/images/sofa_baul__celeste-1784572929056.jpg",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"],

  specs: {
    'Dimensiones': '230 × 95 × 90 cm',
    'Profundidad de asiento': '60 cm',
    'Altura de asiento': '46 cm',
    'Material tapizado': 'Tela jacquard premium',
    'Estructura': 'Madera de haya maciza',
    'Patas': 'Madera tallada lacada',
    'Relleno': 'Espuma HR 40 kg/m³ + fibra',
    'Peso': '55 kg',
    'Capacidad de carga': '380 kg'
  },
  features: ['Tapizado jacquard de alta resistencia', 'Patas talladas a mano', 'Cojines de plumas sintéticas', 'Estructura de haya maciza', 'Disponible en 6 colores'],
  rating: 4.8,
  reviewCount: 64,
  sku: 'POL-VERS-BE-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Elena Gutiérrez', initials: 'EG', location: 'Buenos Aires, Argentina', rating: 5, title: 'Elegancia pura', text: 'El Versalles es exactamente lo que buscaba para mi sala clásica. Las patas talladas son una obra de arte. La tela jacquard es de altísima calidad. Muy satisfecha con la compra.', date: 'Hace 3 semanas', verified: true, helpful: 20, tags: ['Elegante', 'Alta calidad', 'Patas hermosas'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Roberto Silva', initials: 'RS', location: 'Santiago, Chile', rating: 5, title: 'Superó mis expectativas', text: 'Pensé que por el precio sería bueno, pero es excepcional. La atención por WhatsApp fue muy profesional, me mandaron fotos desde diferentes ángulos antes de confirmar.', date: 'Hace 2 meses', verified: true, helpful: 15, tags: ['Profesional', 'Excelente calidad'], avatarColor: 'bg-secondary' }]

},
{
  id: 3,
  name: 'Sofá Moderno Zen',
  style: 'Minimalista',
  color: 'Gris',
  seats: '2 plazas',
  price: '$899',
  description: 'Líneas limpias y comodidad máxima',
  image: "https://images.unsplash.com/photo-1494608875625-6a44a9aa61f4",
  gallery: [
  "https://images.unsplash.com/photo-1494608875625-6a44a9aa61f4",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"],

  specs: {
    'Dimensiones': '175 × 85 × 75 cm',
    'Profundidad de asiento': '55 cm',
    'Altura de asiento': '42 cm',
    'Material tapizado': 'Microfibra premium',
    'Estructura': 'Madera de pino + metal',
    'Patas': 'Acero inoxidable negro',
    'Relleno': 'Espuma HR 32 kg/m³',
    'Peso': '38 kg',
    'Capacidad de carga': '280 kg'
  },
  features: ['Diseño ultra minimalista', 'Patas de acero inoxidable', 'Tapizado antimanchas', 'Ideal para espacios pequeños', 'Montaje sin herramientas'],
  rating: 4.7,
  reviewCount: 52,
  sku: 'POL-ZEN-GR-2P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Ana Torres', initials: 'AT', location: 'Lima, Perú', rating: 5, title: 'Perfecto para mi departamento', text: 'Vivo en un departamento pequeño y este sofá es ideal. Las líneas limpias hacen que el espacio se vea más grande. La calidad es excelente para el precio.', date: 'Hace 1 mes', verified: true, helpful: 16, tags: ['Compacto', 'Minimalista', 'Buen precio'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Diego Flores', initials: 'DF', location: 'Bogotá, Colombia', rating: 4, title: 'Muy buena relación calidad-precio', text: 'El sofá es cómodo y se ve muy bien. Las patas de acero le dan un toque moderno. La entrega fue rápida y bien embalado.', date: 'Hace 6 semanas', verified: true, helpful: 9, tags: ['Moderno', 'Cómodo'], avatarColor: 'bg-secondary' }]

},
{
  id: 4,
  name: 'Sofá Industrial Loft',
  style: 'Industrial',
  color: 'Negro',
  seats: '3 plazas',
  price: '$1,199',
  description: 'Estilo urbano con estructura metálica',
  image: "https://images.unsplash.com/photo-1680823777846-29b42071d7c2",
  gallery: [
  "https://images.unsplash.com/photo-1680823777846-29b42071d7c2",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25"],

  specs: {
    'Dimensiones': '215 × 88 × 82 cm',
    'Profundidad de asiento': '57 cm',
    'Altura de asiento': '43 cm',
    'Material tapizado': 'Cuero sintético premium',
    'Estructura': 'Acero industrial reforzado',
    'Patas': 'Hierro fundido negro mate',
    'Relleno': 'Espuma HR 38 kg/m³',
    'Peso': '62 kg',
    'Capacidad de carga': '420 kg'
  },
  features: ['Cuero sintético de alta durabilidad', 'Estructura de acero industrial', 'Fácil de limpiar', 'Resistente al desgaste', 'Estilo loft urbano'],
  rating: 4.9,
  reviewCount: 73,
  sku: 'POL-LOFT-NK-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Marco Delgado', initials: 'MD', location: 'Buenos Aires, Argentina', rating: 5, title: 'El Industrial Loft es brutal', text: 'Tenía miedo de que el cuero sintético se viera barato pero no, se ve y se siente premium. La estructura metálica es sólida, no cruje nada. Compré también la mesa de centro y quedó perfecto el conjunto.', date: 'Hace 6 días', verified: true, helpful: 15, tags: ['Cuero premium', 'Estructura sólida', 'Estilo urbano'], avatarColor: 'bg-accent' },
  { id: 2, name: 'Javier Moreno', initials: 'JM', location: 'Madrid, España', rating: 5, title: 'Exactamente lo que buscaba', text: 'Tengo un loft industrial y este sofá encaja perfecto. La calidad del cuero es impresionante. El negro es muy profundo y elegante. Muy recomendado.', date: 'Hace 3 semanas', verified: true, helpful: 22, tags: ['Elegante', 'Resistente'], avatarColor: 'bg-primary' }]

},
{
  id: 5,
  name: 'Sofá Chaise Longue Relax',
  style: 'Moderno',
  color: 'Azul',
  seats: 'Chaise Longue',
  price: '$1,499',
  description: 'Máxima comodidad con chaise longue extensible',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1750cc681-1784573097609.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_17016fbc1-1784411975687.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"],

  specs: {
    'Dimensiones': '280 × 160 × 80 cm',
    'Profundidad de asiento': '65 cm',
    'Altura de asiento': '42 cm',
    'Material tapizado': 'Tela velvet premium',
    'Estructura': 'Madera de eucalipto',
    'Patas': 'Madera natural lacada',
    'Relleno': 'Espuma HR 40 kg/m³ + plumas',
    'Peso': '72 kg',
    'Capacidad de carga': '400 kg'
  },
  features: ['Chaise longue reversible (izq/der)', 'Tapizado velvet suave al tacto', 'Cojines de plumas incluidos', 'Estructura reforzada', 'Disponible en 4 colores'],
  rating: 4.8,
  reviewCount: 91,
  sku: 'POL-CHAISE-AZ-CL',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Andrés Fuentes', initials: 'AF', location: 'Guadalajara, México', rating: 5, title: 'El Chaise Longue cambió mi sala', text: 'Dudé mucho antes de comprar por WhatsApp pero la atención fue tan profesional que me convenció. Me mandaron video del sofá, medidas exactas y hasta me ayudaron a elegir el color que mejor combinaba con mi piso.', date: 'Hace 5 días', verified: true, helpful: 12, tags: ['Atención personalizada', 'Muy cómodo', 'Buen precio'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Patricia Vega', initials: 'PV', location: 'Medellín, Colombia', rating: 5, title: 'El azul es espectacular', text: 'El color azul es precioso, muy vibrante. El velvet es suave y lujoso. La chaise longue es perfecta para ver películas. Muy satisfecha con la compra.', date: 'Hace 2 semanas', verified: true, helpful: 19, tags: ['Color hermoso', 'Lujoso', 'Cómodo'], avatarColor: 'bg-secondary' }]

},
{
  id: 6,
  name: 'Sofá Escandinavo Hygge',
  style: 'Escandinavo',
  color: 'Beige',
  seats: '2 plazas',
  price: '$799',
  description: 'Calidez y confort estilo nórdico',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_121c7a096-1784573096164.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_1a61a08e8-1784411974918.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones': '168 × 82 × 78 cm',
    'Profundidad de asiento': '54 cm',
    'Altura de asiento': '43 cm',
    'Material tapizado': 'Tela bouclé nórdica',
    'Estructura': 'Madera de abedul',
    'Patas': 'Madera de abedul natural',
    'Relleno': 'Espuma HR 30 kg/m³ + fibra',
    'Peso': '34 kg',
    'Capacidad de carga': '260 kg'
  },
  features: ['Tela bouclé de textura nórdica', 'Patas de abedul natural', 'Diseño compacto y funcional', 'Ideal para espacios pequeños', 'Fácil de transportar'],
  rating: 4.7,
  reviewCount: 48,
  sku: 'POL-HYGGE-BE-2P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Lucía Vargas', initials: 'LV', location: 'Lima, Perú', rating: 4, title: 'Muy buena calidad, entrega puntual', text: 'El Sofá Escandinavo Hygge es exactamente lo que buscaba para mi departamento pequeño. Las patas de madera le dan un toque muy elegante. Le doy 4 estrellas porque el tiempo de entrega fue un poco más largo de lo esperado.', date: 'Hace 2 meses', verified: true, helpful: 9, tags: ['Diseño nórdico', 'Compacto', 'Elegante'], avatarColor: 'bg-secondary' },
  { id: 2, name: 'Isabel Ruiz', initials: 'IR', location: 'Barcelona, España', rating: 5, title: 'Perfecto para mi estudio', text: 'Vivo en un estudio pequeño y este sofá es perfecto. El beige es muy cálido y acogedor. La tela bouclé es suave y resistente. Muy recomendado.', date: 'Hace 1 mes', verified: true, helpful: 14, tags: ['Compacto', 'Cálido', 'Resistente'], avatarColor: 'bg-accent' }]

},
{
  id: 7,
  name: 'Sofá Modular Flex',
  style: 'Moderno',
  color: 'Verde',
  seats: '3 plazas',
  price: '$1,799',
  description: 'Configurable según tu espacio',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1895067fe-1767953623065.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_1895067fe-1767953623065.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones': '240 × 95 × 80 cm (configurable)',
    'Profundidad de asiento': '60 cm',
    'Altura de asiento': '44 cm',
    'Material tapizado': 'Tela performance antimanchas',
    'Estructura': 'Madera de pino + acero',
    'Patas': 'Acero negro mate',
    'Relleno': 'Espuma HR 38 kg/m³',
    'Peso': '65 kg',
    'Capacidad de carga': '450 kg'
  },
  features: ['Módulos intercambiables', 'Configurable en L, U o lineal', 'Tapizado antimanchas certificado', 'Estructura reforzada para uso intensivo', 'Ampliable con módulos adicionales'],
  rating: 4.9,
  reviewCount: 112,
  sku: 'POL-FLEX-VD-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Miguel Ángel Castro', initials: 'MC', location: 'Ciudad de México', rating: 5, title: 'La flexibilidad es increíble', text: 'Compré el Modular Flex y lo reconfiguré 3 veces hasta encontrar la disposición perfecta para mi sala. El verde es vibrante y moderno. La calidad es excepcional.', date: 'Hace 1 semana', verified: true, helpful: 28, tags: ['Flexible', 'Modular', 'Alta calidad'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Laura Jiménez', initials: 'LJ', location: 'Bogotá, Colombia', rating: 5, title: 'El mejor sofá que he comprado', text: 'Llevamos 6 meses con el Modular Flex y sigue como nuevo. El tapizado antimanchas es una maravilla con dos niños en casa. Muy recomendado.', date: 'Hace 3 semanas', verified: true, helpful: 35, tags: ['Resistente', 'Antimanchas', 'Familiar'], avatarColor: 'bg-secondary' }]

},
{
  id: 8,
  name: 'Sofá Vintage Retro',
  style: 'Clásico',
  color: 'Rojo',
  seats: '2 plazas',
  price: '$1,099',
  description: 'Diseño retro con tapizado en terciopelo',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1151b29a8-1784426449774.png",
  gallery: [
  "https://images.unsplash.com/photo-1696640608601-715b4729cb7f",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25"],

  specs: {
    'Dimensiones': '178 × 88 × 85 cm',
    'Profundidad de asiento': '56 cm',
    'Altura de asiento': '45 cm',
    'Material tapizado': 'Terciopelo premium',
    'Estructura': 'Madera de haya maciza',
    'Patas': 'Madera torneada lacada dorada',
    'Relleno': 'Espuma HR 35 kg/m³ + plumas',
    'Peso': '42 kg',
    'Capacidad de carga': '300 kg'
  },
  features: ['Terciopelo de alta densidad', 'Patas torneadas doradas', 'Botones capitoné decorativos', 'Diseño inspirado en los años 60', 'Disponible en 5 colores'],
  rating: 4.8,
  reviewCount: 59,
  sku: 'POL-RETRO-RJ-2P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Carmen López', initials: 'CL', location: 'Madrid, España', rating: 5, title: 'Un sofá con personalidad', text: 'El Vintage Retro es una pieza de arte. El terciopelo rojo es espectacular y las patas doradas le dan un toque muy elegante. Todos mis invitados lo admiran.', date: 'Hace 2 semanas', verified: true, helpful: 21, tags: ['Elegante', 'Único', 'Llamativo'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Fernando Ruiz', initials: 'FR', location: 'Lima, Perú', rating: 4, title: 'Muy bonito, algo delicado', text: 'El sofá es hermoso pero el terciopelo requiere cuidado especial. No apto para hogares con mascotas. Para una sala de estar sin niños ni mascotas es perfecto.', date: 'Hace 1 mes', verified: true, helpful: 13, tags: ['Hermoso', 'Requiere cuidado'], avatarColor: 'bg-secondary' }]

},
{
  id: 9,
  name: 'Sofá Minimalista Blanco',
  style: 'Minimalista',
  color: 'Blanco',
  seats: '3 plazas',
  price: '$1,349',
  description: 'Pureza y elegancia en blanco total',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_140c2e408-1784573095432.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_13020e091-1784411974456.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e"],

  specs: {
    'Dimensiones': '210 × 88 × 78 cm',
    'Profundidad de asiento': '57 cm',
    'Altura de asiento': '42 cm',
    'Material tapizado': 'Tela performance blanca',
    'Estructura': 'Madera de pino + acero',
    'Patas': 'Acero cromado',
    'Relleno': 'Espuma HR 36 kg/m³',
    'Peso': '44 kg',
    'Capacidad de carga': '360 kg'
  },
  features: ['Tapizado tratado antimanchas', 'Patas de acero cromado', 'Diseño ultra limpio', 'Fácil de combinar con cualquier decoración', 'Cojines extraíbles y lavables'],
  rating: 4.6,
  reviewCount: 41,
  sku: 'POL-MINI-BL-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Natalia Herrera', initials: 'NH', location: 'Santiago, Chile', rating: 5, title: 'Transforma cualquier espacio', text: 'El blanco es puro y elegante. El tratamiento antimanchas funciona muy bien. Llevamos 4 meses y sigue impecable. La atención por WhatsApp fue excelente.', date: 'Hace 3 semanas', verified: true, helpful: 17, tags: ['Elegante', 'Antimanchas', 'Versátil'], avatarColor: 'bg-primary' }]

},
{
  id: 10,
  name: 'Sofá Familiar XL',
  style: 'Moderno',
  color: 'Gris',
  seats: 'Chaise Longue',
  price: '$2,199',
  description: 'Espacio para toda la familia',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_19c66c277-1784573097388.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_1f2f9d933-1775735433932.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones': '320 × 180 × 85 cm',
    'Profundidad de asiento': '68 cm',
    'Altura de asiento': '44 cm',
    'Material tapizado': 'Tela performance familiar',
    'Estructura': 'Madera de pino + acero reforzado',
    'Patas': 'Madera natural',
    'Relleno': 'Espuma HR 42 kg/m³ + fibra premium',
    'Peso': '95 kg',
    'Capacidad de carga': '600 kg'
  },
  features: ['Capacidad para 5-6 personas', 'Chaise longue reversible', 'Tapizado ultra resistente', 'Estructura reforzada para uso intensivo', 'Ideal para familias numerosas'],
  rating: 4.9,
  reviewCount: 138,
  sku: 'POL-FAM-XL-GR-CL',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Camila Restrepo', initials: 'CR', location: 'Santiago, Chile', rating: 5, title: 'Perfecto para familia con niños', text: 'El Sofá Familiar XL es perfecto para mis tres hijos. Muy cómodo, de gran calidad y el servicio fue de primera. Llevamos 5 meses usándolo a diario y no tiene ningún desgaste.', date: 'Hace 3 semanas', verified: true, helpful: 18, tags: ['Resistente', 'Ideal para niños', 'Gran tamaño'], avatarColor: 'bg-accent' },
  { id: 2, name: 'Pablo Morales', initials: 'PM', location: 'Monterrey, México', rating: 5, title: 'El más grande y cómodo', text: 'Somos una familia de 5 y todos cabemos cómodamente. La calidad es excepcional. El gris es muy versátil y combina con todo. Muy recomendado para familias grandes.', date: 'Hace 1 mes', verified: true, helpful: 31, tags: ['Espacioso', 'Familiar', 'Versátil'], avatarColor: 'bg-primary' },
  { id: 3, name: 'Daniela Castro', initials: 'DC', location: 'Bogotá, Colombia', rating: 5, title: 'Vale cada centavo', text: 'Es una inversión pero vale la pena. La calidad es superior a sofás que cuestan el doble en tiendas físicas. La entrega fue perfecta y el montaje muy fácil.', date: 'Hace 2 meses', verified: true, helpful: 24, tags: ['Calidad superior', 'Buena inversión'], avatarColor: 'bg-secondary' }]

},
{
  id: 11,
  name: 'Sofá Cama Convertible',
  style: 'Moderno',
  color: 'Negro',
  seats: '2 plazas',
  price: '$1,099',
  description: 'Sofá de día, cama de noche',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1859f42bd-1784411975132.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_1859f42bd-1784411975132.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones sofá': '185 × 90 × 80 cm',
    'Dimensiones cama': '185 × 130 × 40 cm',
    'Profundidad de asiento': '55 cm',
    'Altura de asiento': '42 cm',
    'Material tapizado': 'Tela resistente fácil limpieza',
    'Estructura': 'Acero reforzado',
    'Mecanismo': 'Clic-clac de apertura fácil',
    'Peso': '52 kg',
    'Capacidad de carga': '320 kg'
  },
  features: ['Mecanismo clic-clac silencioso', 'Convierte en cama en 10 segundos', 'Colchón incluido de 12 cm', 'Tapizado fácil de limpiar', 'Ideal para cuartos de huéspedes'],
  rating: 4.7,
  reviewCount: 76,
  sku: 'POL-CAMA-NK-2P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Gabriela Mendez', initials: 'GM', location: 'Ciudad de México', rating: 5, title: 'Perfecto para cuarto de huéspedes', text: 'Tengo un cuarto de huéspedes pequeño y este sofá cama es la solución perfecta. El mecanismo es muy fácil de usar y la cama es cómoda. Mis invitados siempre quedan satisfechos.', date: 'Hace 2 semanas', verified: true, helpful: 22, tags: ['Funcional', 'Cómodo', 'Fácil de usar'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Tomás Vega', initials: 'TV', location: 'Buenos Aires, Argentina', rating: 4, title: 'Muy práctico', text: 'El sofá cama es muy práctico. El mecanismo funciona perfecto. El colchón incluido es decente, no de hotel 5 estrellas pero muy cómodo para dormir ocasionalmente.', date: 'Hace 1 mes', verified: true, helpful: 11, tags: ['Práctico', 'Funcional'], avatarColor: 'bg-secondary' }]

},
{
  id: 12,
  name: 'Sofá Polaris Signature',
  style: 'Moderno',
  color: 'Azul',
  seats: '3 plazas',
  price: '$1,899',
  description: 'Nuestra pieza estrella, diseño exclusivo Polaris',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_15d7f2ede-1784573098601.png",
  gallery: [
  "https://img.rocket.new/generatedImages/rocket_gen_img_1fa776d5c-1784411975462.png",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5"],

  specs: {
    'Dimensiones': '225 × 95 × 85 cm',
    'Profundidad de asiento': '62 cm',
    'Altura de asiento': '46 cm',
    'Material tapizado': 'Velvet premium exclusivo',
    'Estructura': 'Madera de teca maciza',
    'Patas': 'Madera de teca dorada',
    'Relleno': 'Espuma HR 45 kg/m³ + plumas premium',
    'Peso': '68 kg',
    'Capacidad de carga': '450 kg'
  },
  features: ['Diseño exclusivo Mueblería Polaris', 'Velvet premium importado', 'Patas de teca dorada', 'Relleno de plumas premium', 'Garantía extendida 3 años', 'Certificado de autenticidad'],
  rating: 5.0,
  reviewCount: 203,
  sku: 'POL-SIG-AZ-3P',
  availability: 'En stock',
  reviews: [
  { id: 1, name: 'Rodrigo Espinoza', initials: 'RE', location: 'Bogotá, Colombia', rating: 5, title: 'El Polaris Signature es una obra de arte', text: 'Me asesoraron perfectamente para elegir el color y el tamaño. El Sofá Polaris Signature llegó en perfectas condiciones, el diseño es exactamente como en las fotos. El azul es precioso, muy profundo.', date: 'Hace 1 mes', verified: true, helpful: 31, tags: ['Diseño exclusivo', 'Color exacto', 'Bien embalado'], avatarColor: 'bg-secondary' },
  { id: 2, name: 'Mariana Ortiz', initials: 'MO', location: 'Ciudad de México', rating: 5, title: 'El mejor sofá del mercado', text: 'Investigué mucho antes de comprar y el Polaris Signature no tiene competencia en su rango de precio. El velvet es de una calidad excepcional. Las patas doradas son preciosas.', date: 'Hace 2 semanas', verified: true, helpful: 45, tags: ['Sin competencia', 'Calidad excepcional', 'Lujoso'], avatarColor: 'bg-primary' },
  { id: 3, name: 'Sebastián Torres', initials: 'ST', location: 'Lima, Perú', rating: 5, title: 'Vale cada centavo y más', text: 'Es el sofá más cómodo que he tenido en mi vida. El relleno de plumas es increíble. Después de 8 horas sentado trabajando desde casa, no me duele la espalda. Inversión que vale la pena.', date: 'Hace 3 semanas', verified: true, helpful: 38, tags: ['Ergonómico', 'Cómodo', 'Trabajo desde casa'], avatarColor: 'bg-accent' }]

}];


export const styleOptions = ['Moderno', 'Clásico', 'Minimalista', 'Escandinavo', 'Industrial'] as const;
export const colorOptions = ['Gris', 'Beige', 'Azul', 'Verde', 'Rojo', 'Negro', 'Blanco'] as const;
export const seatsOptions = ['1 plaza', '2 plazas', '3 plazas', 'Chaise Longue'] as const;

export const colorMap: Record<string, string> = {
  Gris: '#9ca3af',
  Beige: '#d2b48c',
  Azul: '#3b82f6',
  Verde: '#22c55e',
  Rojo: '#ef4444',
  Negro: '#1f2937',
  Blanco: '#f3f4f6'
};