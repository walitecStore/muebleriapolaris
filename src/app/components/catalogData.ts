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
  price: 'S/1,299',
  description: 'Diseño escandinavo con patas de madera natural',
  image: "/assets/images/sofa_azul__cama-1784572914608.jpg",
  gallery: [
  "/assets/images/sofa_azul__cama-1784572914608.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/euro_crema-1784905001176.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Valentina Morales', initials: 'VM', location: 'Lima, Perú', rating: 5, title: 'Superó todas mis expectativas', text: 'Compré el Sofá Nórdico Oslo hace 3 meses y sigue luciendo impecable. La calidad de la tela es increíble, muy fácil de limpiar.', date: 'Hace 2 semanas', verified: true, helpful: 24, tags: ['Calidad premium', 'Entrega rápida', 'Fácil de limpiar'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Carlos Mendoza', initials: 'CM', location: 'Arequipa, Perú', rating: 5, title: 'Perfecto para mi sala', text: 'Las patas de madera le dan un toque muy elegante. El color gris combina con todo. La entrega fue puntual y bien embalado.', date: 'Hace 1 mes', verified: true, helpful: 18, tags: ['Elegante', 'Buen embalaje'], avatarColor: 'bg-secondary' },
  { id: 3, name: 'Sofía Ramírez', initials: 'SR', location: 'Trujillo, Perú', rating: 4, title: 'Muy cómodo, diseño hermoso', text: 'El sofá es precioso y muy cómodo. La tela es suave y resistente.', date: 'Hace 2 meses', verified: true, helpful: 11, tags: ['Cómodo', 'Diseño hermoso'], avatarColor: 'bg-accent' }]

},
{
  id: 2,
  name: 'Sofa Europeo Baul',
  style: 'Clásico',
  color: 'Beige',
  seats: '3 plazas',
  price: 'S/1,599',
  description: 'Elegancia atemporal con tapizado en tela premium',
  image: "/assets/images/sofa_baul__celeste-1784572929056.jpg",
  gallery: [
  "/assets/images/sofa_baul__celeste-1784572929056.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "/assets/images/euro_crema-1784905001176.jpg"],

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
  { id: 1, name: 'Elena Gutiérrez', initials: 'EG', location: 'Lima, Perú', rating: 5, title: 'Elegancia pura', text: 'El Versalles es exactamente lo que buscaba para mi sala clásica. Las patas talladas son una obra de arte.', date: 'Hace 3 semanas', verified: true, helpful: 20, tags: ['Elegante', 'Alta calidad', 'Patas hermosas'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Roberto Silva', initials: 'RS', location: 'Cusco, Perú', rating: 5, title: 'Superó mis expectativas', text: 'La atención por WhatsApp fue muy profesional, me mandaron fotos desde diferentes ángulos antes de confirmar.', date: 'Hace 2 meses', verified: true, helpful: 15, tags: ['Profesional', 'Excelente calidad'], avatarColor: 'bg-secondary' }]

},
{
  id: 3,
  name: 'Sofá Moderno Zen',
  style: 'Minimalista',
  color: 'Gris',
  seats: '2 plazas',
  price: 'S/899',
  description: 'Líneas limpias y comodidad máxima',
  image: "/assets/images/285ade2f-b848-4079-aa1b-8af93f20828b-1784897585473.jpg",
  gallery: [
  "/assets/images/285ade2f-b848-4079-aa1b-8af93f20828b-1784897585473.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg",
  "/assets/images/euro_crema-1784905001176.jpg"],

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
  { id: 1, name: 'Ana Torres', initials: 'AT', location: 'Lima, Perú', rating: 5, title: 'Perfecto para mi departamento', text: 'Vivo en un departamento pequeño y este sofá es ideal. Las líneas limpias hacen que el espacio se vea más grande.', date: 'Hace 1 mes', verified: true, helpful: 16, tags: ['Compacto', 'Minimalista', 'Buen precio'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Diego Flores', initials: 'DF', location: 'Piura, Perú', rating: 4, title: 'Muy buena relación calidad-precio', text: 'El sofá es cómodo y se ve muy bien. Las patas de acero le dan un toque moderno.', date: 'Hace 6 semanas', verified: true, helpful: 9, tags: ['Moderno', 'Cómodo'], avatarColor: 'bg-secondary' }]

},
{
  id: 4,
  name: 'Sofá Industrial Loft',
  style: 'Industrial',
  color: 'Negro',
  seats: '3 plazas',
  price: 'S/1,199',
  description: 'Estilo urbano con estructura metálica',
  image: "/assets/images/5277da74-d8b8-4b0b-ab69-67836c72f751-1784897749342.jpg",
  gallery: [
  "/assets/images/5277da74-d8b8-4b0b-ab69-67836c72f751-1784897749342.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/euro_crema-1784905001176.jpg",
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
  { id: 1, name: 'Marco Delgado', initials: 'MD', location: 'Lima, Perú', rating: 5, title: 'El Industrial Loft es brutal', text: 'La estructura metálica es sólida, no cruje nada. Compré también la mesa de centro y quedó perfecto el conjunto.', date: 'Hace 6 días', verified: true, helpful: 15, tags: ['Cuero premium', 'Estructura sólida', 'Estilo urbano'], avatarColor: 'bg-accent' },
  { id: 2, name: 'Javier Moreno', initials: 'JM', location: 'Arequipa, Perú', rating: 5, title: 'Exactamente lo que buscaba', text: 'Tengo un loft industrial y este sofá encaja perfecto. La calidad del cuero es impresionante.', date: 'Hace 3 semanas', verified: true, helpful: 22, tags: ['Elegante', 'Resistente'], avatarColor: 'bg-primary' }]

},
{
  id: 5,
  name: 'Sofá Chaise Longue Relax',
  style: 'Moderno',
  color: 'Azul',
  seats: 'Chaise Longue',
  price: 'S/1,499',
  description: 'Máxima comodidad con chaise longue extensible',
  image: "/assets/images/Source_Salon_de_lujo_de_diseno_moderno_de_muebles___1_-1784897819781.jpg",
  gallery: [
  "/assets/images/Source_Salon_de_lujo_de_diseno_moderno_de_muebles___1_-1784897819781.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg",
  "/assets/images/euro_crema-1784905001176.jpg"],

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
  { id: 1, name: 'Andrés Fuentes', initials: 'AF', location: 'Lima, Perú', rating: 5, title: 'El Chaise Longue cambió mi sala', text: 'Me mandaron video del sofá, medidas exactas y hasta me ayudaron a elegir el color que mejor combinaba con mi piso.', date: 'Hace 5 días', verified: true, helpful: 12, tags: ['Atención personalizada', 'Muy cómodo', 'Buen precio'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Patricia Vega', initials: 'PV', location: 'Trujillo, Perú', rating: 5, title: 'El azul es espectacular', text: 'El color azul es precioso, muy vibrante. El velvet es suave y lujoso. La chaise longue es perfecta para ver películas.', date: 'Hace 2 semanas', verified: true, helpful: 19, tags: ['Color hermoso', 'Lujoso', 'Cómodo'], avatarColor: 'bg-secondary' }]

},
{
  id: 6,
  name: 'Sofá Escandinavo Hygge',
  style: 'Escandinavo',
  color: 'Beige',
  seats: '2 plazas',
  price: 'S/799',
  description: 'Calidez y confort estilo nórdico',
  image: "/assets/images/a3bbd7eb-1103-4690-9e6a-df1dc5de34a9-1784897870015.jpg",
  gallery: [
  "/assets/images/d17fc9b3-d2bb-4760-97c9-74fe4753383d-1784905103637.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/euro_crema-1784905001176.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Lucía Vargas', initials: 'LV', location: 'Lima, Perú', rating: 4, title: 'Muy buena calidad, entrega puntual', text: 'El Sofá Escandinavo Hygge es exactamente lo que buscaba para mi departamento pequeño. Las patas de madera le dan un toque muy elegante.', date: 'Hace 2 meses', verified: true, helpful: 9, tags: ['Diseño nórdico', 'Compacto', 'Elegante'], avatarColor: 'bg-secondary' },
  { id: 2, name: 'Isabel Ruiz', initials: 'IR', location: 'Ica, Perú', rating: 5, title: 'Perfecto para mi estudio', text: 'Vivo en un estudio pequeño y este sofá es perfecto. El beige es muy cálido y acogedor.', date: 'Hace 1 mes', verified: true, helpful: 14, tags: ['Compacto', 'Cálido', 'Resistente'], avatarColor: 'bg-accent' }]

},
{
  id: 7,
  name: 'Sofá Modular Flex',
  style: 'Moderno',
  color: 'Verde',
  seats: '3 plazas',
  price: 'S/1,799',
  description: 'Configurable según tu espacio',
  image: "/assets/images/Gemini_Generated_Image_m0m7rvm0m7rvm0m7__1_-1784899947033.png",
  gallery: [
  "/assets/images/Gemini_Generated_Image_m0m7rvm0m7rvm0m7__1_-1784899947033.png",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Miguel Ángel Castro', initials: 'MC', location: 'Lima, Perú', rating: 5, title: 'La flexibilidad es increíble', text: 'Compré el Modular Flex y lo reconfiguré 3 veces hasta encontrar la disposición perfecta para mi sala.', date: 'Hace 1 semana', verified: true, helpful: 28, tags: ['Flexible', 'Modular', 'Alta calidad'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Laura Jiménez', initials: 'LJ', location: 'Chiclayo, Perú', rating: 5, title: 'El mejor sofá que he comprado', text: 'Llevamos 6 meses con el Modular Flex y sigue como nuevo. El tapizado antimanchas es una maravilla con dos niños en casa.', date: 'Hace 3 semanas', verified: true, helpful: 35, tags: ['Resistente', 'Antimanchas', 'Familiar'], avatarColor: 'bg-secondary' }]

},
{
  id: 8,
  name: 'Sofá Vintage Retro',
  style: 'Clásico',
  color: 'Rojo',
  seats: '2 plazas',
  price: 'S/1,099',
  description: 'Diseño retro con tapizado en terciopelo',
  image: "/assets/images/Gemini_Generated_Image_d3fw59d3fw59d3fw__1_-1784902759775.png",
  gallery: [
  "/assets/images/Gemini_Generated_Image_d3fw59d3fw59d3fw__1_-1784902759775.png",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/euro_crema-1784905001176.jpg",
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
  { id: 1, name: 'Carmen López', initials: 'CL', location: 'Lima, Perú', rating: 5, title: 'Un sofá con personalidad', text: 'El Vintage Retro es una pieza de arte. El terciopelo rojo es espectacular y las patas doradas le dan un toque muy elegante.', date: 'Hace 2 semanas', verified: true, helpful: 21, tags: ['Elegante', 'Único', 'Llamativo'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Fernando Ruiz', initials: 'FR', location: 'Arequipa, Perú', rating: 4, title: 'Muy bonito, algo delicado', text: 'El sofá es hermoso pero el terciopelo requiere cuidado especial.', date: 'Hace 1 mes', verified: true, helpful: 13, tags: ['Hermoso', 'Requiere cuidado'], avatarColor: 'bg-secondary' }]

},
{
  id: 9,
  name: 'Sofá Minimalista Blanco',
  style: 'Minimalista',
  color: 'Blanco',
  seats: '3 plazas',
  price: 'S/1,349',
  description: 'Pureza y elegancia en blanco total',
  image: "/assets/images/europeo1-1784904704929.jpg",
  gallery: [
  "/assets/images/Gemini_Generated_Image_he1jnjhe1jnjhe1j__1_-1784903707261.png",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg",
  "/assets/images/euro_crema-1784905001176.jpg"],

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
  { id: 1, name: 'Natalia Herrera', initials: 'NH', location: 'Lima, Perú', rating: 5, title: 'Transforma cualquier espacio', text: 'El blanco es puro y elegante. El tratamiento antimanchas funciona muy bien. Llevamos 4 meses y sigue impecable.', date: 'Hace 3 semanas', verified: true, helpful: 17, tags: ['Elegante', 'Antimanchas', 'Versátil'], avatarColor: 'bg-primary' }]

},
{
  id: 10,
  name: 'Sofá Familiar XL',
  style: 'Moderno',
  color: 'Gris',
  seats: 'Chaise Longue',
  price: 'S/2,199',
  description: 'Espacio para toda la familia',
  image: "/assets/images/descarga__3_-1784903840931.jpg",
  gallery: [
  "/assets/images/descarga__3_-1784903840931.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Camila Restrepo', initials: 'CR', location: 'Lima, Perú', rating: 5, title: 'Perfecto para familia con niños', text: 'El Sofá Familiar XL es perfecto para mis tres hijos. Muy cómodo, de gran calidad y el servicio fue de primera.', date: 'Hace 3 semanas', verified: true, helpful: 18, tags: ['Resistente', 'Ideal para niños', 'Gran tamaño'], avatarColor: 'bg-accent' },
  { id: 2, name: 'Pablo Morales', initials: 'PM', location: 'Trujillo, Perú', rating: 5, title: 'El más grande y cómodo', text: 'Somos una familia de 5 y todos cabemos cómodamente. La calidad es excepcional.', date: 'Hace 1 mes', verified: true, helpful: 31, tags: ['Espacioso', 'Familiar', 'Versátil'], avatarColor: 'bg-primary' }]

},
{
  id: 11,
  name: 'Sofá Cama Convertible',
  style: 'Moderno',
  color: 'Negro',
  seats: '2 plazas',
  price: 'S/1,099',
  description: 'Sofá de día, cama de noche',
  image: "/assets/images/The_Furniture_World_U_Shape_9_Seater_Fabric_Sofa_Set_with_Tea_Table___4_Puffy_2___2___2___1___1___1-1784903888189.jpg",
  gallery: [
  "/assets/images/The_Furniture_World_U_Shape_9_Seater_Fabric_Sofa_Set_with_Tea_Table___4_Puffy_2___2___2___1___1___1-1784903888189.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "/assets/images/euro_crema-1784905001176.jpg",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Gabriela Mendez', initials: 'GM', location: 'Lima, Perú', rating: 5, title: 'Perfecto para cuarto de huéspedes', text: 'El mecanismo es muy fácil de usar y la cama es cómoda. Mis invitados siempre quedan satisfechos.', date: 'Hace 2 semanas', verified: true, helpful: 22, tags: ['Funcional', 'Cómodo', 'Fácil de usar'], avatarColor: 'bg-primary' },
  { id: 2, name: 'Tomás Vega', initials: 'TV', location: 'Arequipa, Perú', rating: 4, title: 'Muy práctico', text: 'El sofá cama es muy práctico. El mecanismo funciona perfecto.', date: 'Hace 1 mes', verified: true, helpful: 11, tags: ['Práctico', 'Funcional'], avatarColor: 'bg-secondary' }]

},
{
  id: 12,
  name: 'Sofá Polaris Signature',
  style: 'Moderno',
  color: 'Azul',
  seats: '3 plazas',
  price: 'S/1,899',
  description: 'Nuestra pieza estrella, diseño exclusivo Polaris',
  image: "/assets/images/europeo-1784904634946.jpg",
  gallery: [
  "/assets/images/euro_baul_1-1784904859095.jpg",
  "/assets/images/euro_crema_2-1784905017426.jpg",
  "https://images.unsplash.com/photo-1540574163026-643ea20ade25",
  "/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg"],

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
  { id: 1, name: 'Rodrigo Espinoza', initials: 'RE', location: 'Lima, Perú', rating: 5, title: 'El Polaris Signature es una obra de arte', text: 'El Sofá Polaris Signature llegó en perfectas condiciones, el diseño es exactamente como en las fotos.', date: 'Hace 1 mes', verified: true, helpful: 31, tags: ['Diseño exclusivo', 'Color exacto', 'Bien embalado'], avatarColor: 'bg-secondary' },
  { id: 2, name: 'Mariana Ortiz', initials: 'MO', location: 'Cusco, Perú', rating: 5, title: 'El mejor sofá del mercado', text: 'El velvet es de una calidad excepcional. Las patas doradas son preciosas.', date: 'Hace 2 semanas', verified: true, helpful: 45, tags: ['Sin competencia', 'Calidad excepcional', 'Lujoso'], avatarColor: 'bg-primary' },
  { id: 3, name: 'Sebastián Torres', initials: 'ST', location: 'Trujillo, Perú', rating: 5, title: 'Vale cada centavo y más', text: 'Es el sofá más cómodo que he tenido en mi vida. El relleno de plumas es increíble.', date: 'Hace 3 semanas', verified: true, helpful: 38, tags: ['Ergonómico', 'Cómodo', 'Trabajo desde casa'], avatarColor: 'bg-accent' }]
},
// --- EXPANDED CATALOG (IDs 13-32) ---
{ id: 13, name: 'Sofá Velvet Esmeralda', style: 'Moderno', color: 'Verde', seats: '2 plazas', price: 'S/1,150', description: 'Terciopelo esmeralda con patas doradas', image: "https://images.unsplash.com/photo-1646171734470-46b1a7dc9c82", gallery: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"], specs: { 'Dimensiones': '180 × 85 × 80 cm', 'Material': 'Velvet esmeralda', 'Patas': 'Metal dorado' }, features: ['Velvet premium', 'Patas doradas', 'Diseño elegante'], rating: 4.7, reviewCount: 38, sku: 'POL-VEL-ES-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Rosa Mendoza', initials: 'RM', location: 'Lima, Perú', rating: 5, title: 'Color precioso', text: 'El verde esmeralda es espectacular, muy elegante.', date: 'Hace 1 mes', verified: true, helpful: 12, tags: ['Elegante', 'Color único'], avatarColor: 'bg-primary' }] },
{ id: 14, name: 'Sofá Capitoné Royal', style: 'Clásico', color: 'Azul', seats: '3 plazas', price: 'S/1,750', description: 'Capitoné clásico con botones decorativos', image: "https://images.unsplash.com/photo-1638368888198-0558b2f2aa7c", gallery: ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600"], specs: { 'Dimensiones': '220 × 90 × 85 cm', 'Material': 'Tela capitoné', 'Patas': 'Madera tallada' }, features: ['Capitoné artesanal', 'Botones decorativos', 'Patas talladas'], rating: 4.8, reviewCount: 55, sku: 'POL-CAP-AZ-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Luis García', initials: 'LG', location: 'Arequipa, Perú', rating: 5, title: 'Clásico y elegante', text: 'El capitoné es perfecto para una sala clásica.', date: 'Hace 2 meses', verified: true, helpful: 18, tags: ['Clásico', 'Elegante'], avatarColor: 'bg-secondary' }] },
{ id: 15, name: 'Sofá L Modular Gris', style: 'Moderno', color: 'Gris', seats: 'Chaise Longue', price: 'S/2,050', description: 'Sofá en L con módulos independientes', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a13262e5-1784911131205.png", gallery: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600"], specs: { 'Dimensiones': '290 × 170 × 82 cm', 'Material': 'Tela gris premium', 'Patas': 'Madera oscura' }, features: ['Módulos independientes', 'Chaise longue reversible', 'Tapizado premium'], rating: 4.9, reviewCount: 92, sku: 'POL-L-GR-CL', availability: 'En stock', reviews: [{ id: 1, name: 'Sandra Pérez', initials: 'SP', location: 'Lima, Perú', rating: 5, title: 'Perfecto para sala grande', text: 'El sofá en L es ideal para mi sala amplia.', date: 'Hace 3 semanas', verified: true, helpful: 25, tags: ['Espacioso', 'Modular'], avatarColor: 'bg-accent' }] },
{ id: 16, name: 'Sofá Rústico Madera', style: 'Industrial', color: 'Beige', seats: '3 plazas', price: 'S/1,380', description: 'Estructura de madera maciza estilo rústico', image: "https://images.unsplash.com/photo-1734154162371-34d35438a2bf", gallery: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600"], specs: { 'Dimensiones': '215 × 88 × 85 cm', 'Material': 'Tela beige + madera', 'Patas': 'Madera maciza' }, features: ['Estructura rústica', 'Madera maciza', 'Cojines extraíbles'], rating: 4.6, reviewCount: 43, sku: 'POL-RUS-BE-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Jorge Quispe', initials: 'JQ', location: 'Cusco, Perú', rating: 5, title: 'Estilo rústico perfecto', text: 'Combina perfecto con mi decoración rústica.', date: 'Hace 1 mes', verified: true, helpful: 14, tags: ['Rústico', 'Natural'], avatarColor: 'bg-primary' }] },
{ id: 17, name: 'Sofá Terciopelo Vino', style: 'Clásico', color: 'Rojo', seats: '2 plazas', price: 'S/1,280', description: 'Terciopelo color vino con detalles dorados', image: "https://images.unsplash.com/photo-1646171734470-46b1a7dc9c82", gallery: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600"], specs: { 'Dimensiones': '175 × 85 × 82 cm', 'Material': 'Terciopelo vino', 'Patas': 'Metal dorado' }, features: ['Terciopelo premium', 'Detalles dorados', 'Diseño lujoso'], rating: 4.8, reviewCount: 61, sku: 'POL-TER-VN-2P', availability: 'En stock', reviews: [{ id: 1, name: 'María Flores', initials: 'MF', location: 'Lima, Perú', rating: 5, title: 'Lujoso y elegante', text: 'El color vino es precioso, muy sofisticado.', date: 'Hace 2 semanas', verified: true, helpful: 20, tags: ['Lujoso', 'Sofisticado'], avatarColor: 'bg-secondary' }] },
{ id: 18, name: 'Sofá Minimalista Negro', style: 'Minimalista', color: 'Negro', seats: '3 plazas', price: 'S/1,420', description: 'Elegancia minimalista en negro profundo', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1d27f846e-1773044479844.png", gallery: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"], specs: { 'Dimensiones': '210 × 88 × 78 cm', 'Material': 'Cuero negro premium', 'Patas': 'Acero negro' }, features: ['Cuero premium', 'Patas de acero', 'Diseño minimalista'], rating: 4.7, reviewCount: 49, sku: 'POL-MIN-NK-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Carlos Ríos', initials: 'CR', location: 'Trujillo, Perú', rating: 5, title: 'Elegante y moderno', text: 'El negro es muy elegante y combina con todo.', date: 'Hace 1 mes', verified: true, helpful: 16, tags: ['Elegante', 'Versátil'], avatarColor: 'bg-accent' }] },
{ id: 19, name: 'Sofá Escandinavo Blanco', style: 'Escandinavo', color: 'Blanco', seats: '2 plazas', price: 'S/920', description: 'Pureza nórdica con patas de madera clara', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1898a3e7d-1772441229806.png", gallery: ["https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600"], specs: { 'Dimensiones': '170 × 82 × 76 cm', 'Material': 'Tela blanca nórdica', 'Patas': 'Madera de abedul' }, features: ['Estilo nórdico', 'Patas de abedul', 'Diseño limpio'], rating: 4.6, reviewCount: 35, sku: 'POL-ESC-BL-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Ana Vargas', initials: 'AV', location: 'Lima, Perú', rating: 5, title: 'Nórdico y elegante', text: 'El blanco nórdico es perfecto para mi sala.', date: 'Hace 3 semanas', verified: true, helpful: 11, tags: ['Nórdico', 'Limpio'], avatarColor: 'bg-primary' }] },
{ id: 20, name: 'Sofá Cuero Marrón', style: 'Clásico', color: 'Beige', seats: '3 plazas', price: 'S/1,650', description: 'Cuero genuino color marrón cálido', image: "https://images.unsplash.com/photo-1628069435404-0712c6ca816f", gallery: ["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600"], specs: { 'Dimensiones': '220 × 92 × 85 cm', 'Material': 'Cuero genuino', 'Patas': 'Madera oscura' }, features: ['Cuero genuino', 'Envejecimiento natural', 'Muy duradero'], rating: 4.9, reviewCount: 78, sku: 'POL-CUE-MA-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Pedro Huanca', initials: 'PH', location: 'Arequipa, Perú', rating: 5, title: 'Cuero de primera calidad', text: 'El cuero genuino es increíble, mejora con el tiempo.', date: 'Hace 2 meses', verified: true, helpful: 28, tags: ['Cuero genuino', 'Duradero'], avatarColor: 'bg-secondary' }] },
{ id: 21, name: 'Sofá Azul Marino', style: 'Moderno', color: 'Azul', seats: '2 plazas', price: 'S/1,080', description: 'Azul marino profundo con líneas modernas', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1fcbc54c8-1769510770320.png", gallery: ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600"], specs: { 'Dimensiones': '178 × 85 × 80 cm', 'Material': 'Tela azul marino', 'Patas': 'Metal negro' }, features: ['Color intenso', 'Patas metálicas', 'Diseño contemporáneo'], rating: 4.7, reviewCount: 44, sku: 'POL-AZM-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Lucía Torres', initials: 'LT', location: 'Lima, Perú', rating: 5, title: 'Azul marino perfecto', text: 'El color es exactamente como en las fotos.', date: 'Hace 1 mes', verified: true, helpful: 15, tags: ['Color exacto', 'Moderno'], avatarColor: 'bg-accent' }] },
{ id: 22, name: 'Sofá Verde Oliva', style: 'Escandinavo', color: 'Verde', seats: '3 plazas', price: 'S/1,320', description: 'Verde oliva natural con textura bouclé', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1065d7918-1771884763956.png", gallery: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"], specs: { 'Dimensiones': '205 × 88 × 80 cm', 'Material': 'Bouclé verde oliva', 'Patas': 'Madera natural' }, features: ['Bouclé premium', 'Color natural', 'Estilo escandinavo'], rating: 4.8, reviewCount: 52, sku: 'POL-VOL-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Valeria Quispe', initials: 'VQ', location: 'Cusco, Perú', rating: 5, title: 'Verde oliva hermoso', text: 'El color verde oliva es muy natural y elegante.', date: 'Hace 2 semanas', verified: true, helpful: 19, tags: ['Natural', 'Elegante'], avatarColor: 'bg-primary' }] },
{ id: 23, name: 'Sofá Gris Perla', style: 'Minimalista', color: 'Gris', seats: '1 plaza', price: 'S/650', description: 'Sillón individual gris perla minimalista', image: "https://img.rocket.new/generatedImages/rocket_gen_img_10febaeec-1767125293758.png", gallery: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600"], specs: { 'Dimensiones': '90 × 85 × 80 cm', 'Material': 'Tela gris perla', 'Patas': 'Acero cromado' }, features: ['Sillón individual', 'Diseño minimalista', 'Ideal para lectura'], rating: 4.6, reviewCount: 29, sku: 'POL-GP-1P', availability: 'En stock', reviews: [{ id: 1, name: 'Beatriz Lara', initials: 'BL', location: 'Lima, Perú', rating: 5, title: 'Perfecto para mi rincón de lectura', text: 'Muy cómodo para leer, el gris perla es muy elegante.', date: 'Hace 1 mes', verified: true, helpful: 10, tags: ['Cómodo', 'Compacto'], avatarColor: 'bg-secondary' }] },
{ id: 24, name: 'Sofá Blanco Nube', style: 'Moderno', color: 'Blanco', seats: '2 plazas', price: 'S/1,180', description: 'Suavidad extrema estilo nube', image: "https://images.unsplash.com/photo-1722521309768-7ef1411244bf", gallery: ["https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600"], specs: { 'Dimensiones': '185 × 90 × 78 cm', 'Material': 'Tela ultra suave', 'Patas': 'Madera blanca' }, features: ['Ultra suave', 'Relleno extra', 'Diseño nube'], rating: 4.8, reviewCount: 67, sku: 'POL-BN-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Claudia Mamani', initials: 'CM', location: 'Puno, Perú', rating: 5, title: 'Como sentarse en una nube', text: 'El sofá es increíblemente suave y cómodo.', date: 'Hace 3 semanas', verified: true, helpful: 22, tags: ['Ultra suave', 'Cómodo'], avatarColor: 'bg-accent' }] },
{ id: 25, name: 'Sofá Rojo Pasión', style: 'Clásico', color: 'Rojo', seats: '3 plazas', price: 'S/1,480', description: 'Rojo intenso que domina cualquier sala', image: "https://images.unsplash.com/photo-1699832127583-3945f8d5bc97", gallery: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600"], specs: { 'Dimensiones': '215 × 90 × 85 cm', 'Material': 'Terciopelo rojo', 'Patas': 'Madera oscura' }, features: ['Terciopelo rojo', 'Diseño clásico', 'Muy llamativo'], rating: 4.7, reviewCount: 41, sku: 'POL-RP-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Gabriela Soto', initials: 'GS', location: 'Lima, Perú', rating: 5, title: 'El rojo es espectacular', text: 'El sofá rojo es el centro de atención de mi sala.', date: 'Hace 1 mes', verified: true, helpful: 17, tags: ['Llamativo', 'Elegante'], avatarColor: 'bg-primary' }] },
{ id: 26, name: 'Sofá Beige Lino', style: 'Escandinavo', color: 'Beige', seats: '3 plazas', price: 'S/1,150', description: 'Lino natural beige de textura suave', image: "https://img.rocket.new/generatedImages/rocket_gen_img_15505ea49-1768416233200.png", gallery: ["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600"], specs: { 'Dimensiones': '210 × 88 × 80 cm', 'Material': 'Lino natural', 'Patas': 'Madera de roble' }, features: ['Lino natural', 'Ecológico', 'Textura suave'], rating: 4.6, reviewCount: 36, sku: 'POL-BL-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Teresa Condori', initials: 'TC', location: 'Arequipa, Perú', rating: 5, title: 'Natural y elegante', text: 'El lino natural es muy agradable al tacto.', date: 'Hace 2 meses', verified: true, helpful: 13, tags: ['Natural', 'Ecológico'], avatarColor: 'bg-secondary' }] },
{ id: 27, name: 'Sofá Industrial Gris', style: 'Industrial', color: 'Gris', seats: '2 plazas', price: 'S/1,050', description: 'Estilo industrial con tapizado gris oscuro', image: "https://images.unsplash.com/photo-1598831629742-b091f925a426", gallery: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600"], specs: { 'Dimensiones': '180 × 85 × 80 cm', 'Material': 'Tela gris industrial', 'Patas': 'Hierro negro' }, features: ['Estilo industrial', 'Hierro forjado', 'Muy resistente'], rating: 4.7, reviewCount: 48, sku: 'POL-IG-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Raúl Mendoza', initials: 'RM', location: 'Lima, Perú', rating: 5, title: 'Industrial y elegante', text: 'El estilo industrial es perfecto para mi loft.', date: 'Hace 1 mes', verified: true, helpful: 16, tags: ['Industrial', 'Resistente'], avatarColor: 'bg-accent' }] },
{ id: 28, name: 'Sofá Turquesa Tropical', style: 'Moderno', color: 'Azul', seats: '2 plazas', price: 'S/1,220', description: 'Turquesa vibrante para espacios frescos', image: "https://img.rocket.new/generatedImages/rocket_gen_img_15159dfae-1784911122662.png", gallery: ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600"], specs: { 'Dimensiones': '178 × 85 × 80 cm', 'Material': 'Tela turquesa', 'Patas': 'Metal blanco' }, features: ['Color vibrante', 'Patas blancas', 'Diseño tropical'], rating: 4.7, reviewCount: 33, sku: 'POL-TUR-2P', availability: 'En stock', reviews: [{ id: 1, name: 'Paola Ríos', initials: 'PR', location: 'Lima, Perú', rating: 5, title: 'Color único y hermoso', text: 'El turquesa es perfecto para mi sala de playa.', date: 'Hace 3 semanas', verified: true, helpful: 12, tags: ['Vibrante', 'Único'], avatarColor: 'bg-primary' }] },
{ id: 29, name: 'Sofá Cuero Negro Premium', style: 'Industrial', color: 'Negro', seats: '3 plazas', price: 'S/1,950', description: 'Cuero negro premium de alta durabilidad', image: "https://img.rocket.new/generatedImages/rocket_gen_img_147ec2b4f-1766411901095.png", gallery: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"], specs: { 'Dimensiones': '220 × 92 × 85 cm', 'Material': 'Cuero negro premium', 'Patas': 'Acero inoxidable' }, features: ['Cuero premium', 'Muy duradero', 'Fácil de limpiar'], rating: 4.9, reviewCount: 85, sku: 'POL-CNP-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Ernesto Cárdenas', initials: 'EC', location: 'Lima, Perú', rating: 5, title: 'Cuero de primera', text: 'El cuero negro es de altísima calidad.', date: 'Hace 2 semanas', verified: true, helpful: 30, tags: ['Premium', 'Duradero'], avatarColor: 'bg-secondary' }] },
{ id: 30, name: 'Sofá Chesterfield Clásico', style: 'Clásico', color: 'Beige', seats: '3 plazas', price: 'S/2,100', description: 'Chesterfield inglés con capitoné artesanal', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b2848dab-1772196144462.png", gallery: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600"], specs: { 'Dimensiones': '225 × 95 × 90 cm', 'Material': 'Cuero beige', 'Patas': 'Madera tallada' }, features: ['Chesterfield auténtico', 'Capitoné artesanal', 'Patas talladas'], rating: 4.9, reviewCount: 72, sku: 'POL-CHE-BE-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Alfredo Paredes', initials: 'AP', location: 'Lima, Perú', rating: 5, title: 'Chesterfield auténtico', text: 'El Chesterfield es una pieza de colección.', date: 'Hace 1 mes', verified: true, helpful: 25, tags: ['Clásico', 'Artesanal'], avatarColor: 'bg-accent' }] },
{ id: 31, name: 'Sofá Gris Marengo', style: 'Moderno', color: 'Gris', seats: '3 plazas', price: 'S/1,380', description: 'Gris marengo profundo con líneas rectas', image: "https://img.rocket.new/generatedImages/rocket_gen_img_14be03324-1784911124550.png", gallery: ["https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600"], specs: { 'Dimensiones': '215 × 90 × 82 cm', 'Material': 'Tela gris marengo', 'Patas': 'Metal negro' }, features: ['Gris profundo', 'Líneas rectas', 'Diseño contemporáneo'], rating: 4.7, reviewCount: 46, sku: 'POL-GM-3P', availability: 'En stock', reviews: [{ id: 1, name: 'Silvia Tapia', initials: 'ST', location: 'Trujillo, Perú', rating: 5, title: 'Gris perfecto', text: 'El gris marengo es muy versátil y elegante.', date: 'Hace 2 semanas', verified: true, helpful: 14, tags: ['Versátil', 'Elegante'], avatarColor: 'bg-primary' }] },
{ id: 32, name: 'Sofá Polaris Gold', style: 'Moderno', color: 'Beige', seats: '3 plazas', price: 'S/2,450', description: 'Edición especial dorada con detalles premium', image: "https://img.rocket.new/generatedImages/rocket_gen_img_1dd9cd04a-1773562996153.png", gallery: ["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600"], specs: { 'Dimensiones': '230 × 95 × 88 cm', 'Material': 'Velvet dorado premium', 'Patas': 'Metal dorado 24k' }, features: ['Edición limitada', 'Velvet dorado', 'Patas doradas 24k', 'Certificado de autenticidad'], rating: 5.0, reviewCount: 28, sku: 'POL-GOLD-3P', availability: 'Últimas unidades', reviews: [{ id: 1, name: 'Victoria Salas', initials: 'VS', location: 'Lima, Perú', rating: 5, title: 'Pieza de lujo absoluto', text: 'El Polaris Gold es simplemente espectacular.', date: 'Hace 1 semana', verified: true, helpful: 18, tags: ['Lujo', 'Exclusivo', 'Premium'], avatarColor: 'bg-secondary' }] }];



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