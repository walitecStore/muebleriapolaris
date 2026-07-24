// ============================================================
// MUEBLERÍA POLARIS — CATALOG DATA
// Easy to add/remove products: just push to the products array
// ============================================================

export interface CatalogProduct {
  id: string;
  name: string;
  measures: string;
  price: string;
  previousPrice?: string;
  image: string;
  alt: string;
  category: string;
  subcategory?: string;
  color?: string;
  material?: string;
}

export interface SubCatalog {
  slug: string;
  label: string;
  capacity: number;
  products: CatalogProduct[];
}

export interface CatalogCategory {
  slug: string;
  label: string;
  description: string;
  image: string;
  alt: string;
  capacity: number;
  subcatalogs: SubCatalog[];
  products: CatalogProduct[];
}

// ─── HELPER: placeholder product ───────────────────────────
function placeholder(id: string, cat: string, sub?: string): CatalogProduct {
  return {
    id,
    name: 'Próximamente',
    measures: 'Por confirmar',
    price: 'Consultar',
    image: '/assets/images/no_image.png',
    alt: 'Producto próximamente disponible en Mueblería Polaris',
    category: cat,
    subcategory: sub,
    color: '',
    material: '',
  };
}

function placeholders(count: number, cat: string, sub?: string, startId = 1): CatalogProduct[] {
  return Array.from({ length: count }, (_, i) =>
    placeholder(`${cat}-${sub ?? 'main'}-${startId + i}`, cat, sub)
  );
}

// ─── EXISTING IMAGES ───────────────────────────────────────
const IMG = {
  euro1: '/assets/images/europeo-1784904634946.jpg',
  euro2: '/assets/images/europeo1-1784904704929.jpg',
  euroBaul: '/assets/images/euro_baul_1-1784904859095.jpg',
  euroCrema: '/assets/images/euro_crema-1784905001176.jpg',
  euroCrema2: '/assets/images/euro_crema_2-1784905017426.jpg',
  euro9163: '/assets/images/9163576e-f483-478e-a4ec-b63753f51e30-1784904958683.jpg',
  euroD17: '/assets/images/d17fc9b3-d2bb-4760-97c9-74fe4753383d-1784905103637.jpg',
  sofaBaulCeleste: '/assets/images/sofa_baul__celeste-1784572929056.jpg',
  sofaAzulCama: '/assets/images/sofa_azul__cama-1784572914608.jpg',
  modular1: '/assets/images/Gemini_Generated_Image_m0m7rvm0m7rvm0m7__1_-1784899947033.png',
  modular2: '/assets/images/Gemini_Generated_Image_d3fw59d3fw59d3fw__1_-1784902759775.png',
  modular3: '/assets/images/Gemini_Generated_Image_he1jnjhe1jnjhe1j__1_-1784903707261.png',
  seccional1: '/assets/images/The_Furniture_World_U_Shape_9_Seater_Fabric_Sofa_Set_with_Tea_Table___4_Puffy_2___2___2___1___1___1-1784903888189.jpg',
  seccional2: '/assets/images/descarga__3_-1784903840931.jpg',
  seccional3: '/assets/images/Set_Sofa_Tamu_Minimalis_Jakarta_Terbaru__1_-1784897220233.jpg',
  seccional4: '/assets/images/5277da74-d8b8-4b0b-ab69-67836c72f751-1784897749342.jpg',
  seccional5: '/assets/images/Source_Salon_de_lujo_de_diseno_moderno_de_muebles___1_-1784897819781.jpg',
  seccional6: '/assets/images/a3bbd7eb-1103-4690-9e6a-df1dc5de34a9-1784897870015.jpg',
  seccional7: '/assets/images/285ade2f-b848-4079-aa1b-8af93f20828b-1784897585473.jpg',
  seccional8: '/assets/images/ab15ca76-b580-4192-ac0c-2ff41094db8d-1784506178116.jpg',
  whatsapp: '/assets/images/WhatsApp_Image_2026-07-24_at_7.58.35_AM-1784899076228.jpeg',
};

// ─── 1. SOFÁS MODELO EUROPEO ───────────────────────────────
const europeoPrincipal: CatalogProduct[] = [
  { id: 'euro-1', name: 'Sofá Europeo Clásico Crema', measures: '220 × 90 × 85 cm', price: 'S/1,599', previousPrice: 'S/1,899', image: IMG.euroCrema, alt: 'Sofá europeo clásico color crema con tapizado elegante', category: 'europeo', color: 'Crema', material: 'Tela premium' },
  { id: 'euro-2', name: 'Sofá Europeo Crema Doble', measures: '240 × 95 × 88 cm', price: 'S/1,799', image: IMG.euroCrema2, alt: 'Sofá europeo crema doble con diseño clásico y elegante', category: 'europeo', color: 'Crema', material: 'Tela jacquard' },
  { id: 'euro-3', name: 'Sofá Europeo Moderno', measures: '225 × 92 × 86 cm', price: 'S/1,699', image: IMG.euro1, alt: 'Sofá europeo moderno con líneas elegantes y tapizado premium', category: 'europeo', color: 'Gris', material: 'Velvet' },
  { id: 'euro-4', name: 'Sofá Europeo Premium', measures: '230 × 95 × 90 cm', price: 'S/1,899', previousPrice: 'S/2,199', image: IMG.euro2, alt: 'Sofá europeo premium con acabados de lujo', category: 'europeo', color: 'Beige', material: 'Cuero sintético' },
  { id: 'euro-5', name: 'Sofá Europeo Baúl Celeste', measures: '235 × 98 × 92 cm', price: 'S/1,950', image: IMG.sofaBaulCeleste, alt: 'Sofá europeo baúl color celeste con almacenamiento interior', category: 'europeo', color: 'Celeste', material: 'Tela premium' },
  { id: 'euro-6', name: 'Sofá Europeo Baúl Clásico', measures: '230 × 95 × 90 cm', price: 'S/1,850', image: IMG.euroBaul, alt: 'Sofá europeo baúl clásico con tapizado elegante y almacenamiento', category: 'europeo', color: 'Beige', material: 'Tela jacquard' },
  { id: 'euro-7', name: 'Sofá Europeo Gris Perla', measures: '220 × 90 × 85 cm', price: 'S/1,650', image: IMG.euro9163, alt: 'Sofá europeo gris perla con diseño sofisticado', category: 'europeo', color: 'Gris', material: 'Tela premium' },
  { id: 'euro-8', name: 'Sofá Europeo Beige Natural', measures: '225 × 92 × 87 cm', price: 'S/1,720', image: IMG.euroD17, alt: 'Sofá europeo beige natural con tapizado de alta calidad', category: 'europeo', color: 'Beige', material: 'Lino natural' },
  { id: 'euro-9', name: 'Sofá Europeo Azul Marino', measures: '230 × 93 × 88 cm', price: 'S/1,780', image: IMG.sofaAzulCama, alt: 'Sofá europeo azul marino con diseño clásico europeo', category: 'europeo', color: 'Azul', material: 'Velvet' },
  { id: 'euro-10', name: 'Sofá Europeo Signature', measures: '240 × 98 × 92 cm', price: 'S/2,100', previousPrice: 'S/2,450', image: IMG.euroCrema, alt: 'Sofá europeo signature edición especial Mueblería Polaris', category: 'europeo', color: 'Crema', material: 'Velvet premium' },
  { id: 'euro-11', name: 'Sofá Europeo Capitoné', measures: '225 × 92 × 88 cm', price: 'S/1,950', image: IMG.euro1, alt: 'Sofá europeo capitoné con botones decorativos artesanales', category: 'europeo', color: 'Gris', material: 'Tela capitoné' },
  { id: 'euro-12', name: 'Sofá Europeo Chesterfield', measures: '235 × 96 × 90 cm', price: 'S/2,200', image: IMG.euro2, alt: 'Sofá europeo estilo chesterfield con tapizado clásico', category: 'europeo', color: 'Beige', material: 'Cuero genuino' },
  ...placeholders(18, 'europeo', undefined, 13),
];

const europeoMediano: CatalogProduct[] = placeholders(30, 'europeo', 'mediano');
const europeoMini: CatalogProduct[] = placeholders(30, 'europeo', 'mini');
const europeoMiniModular: CatalogProduct[] = placeholders(30, 'europeo', 'mini-modular');

// ─── 2. SOFÁS MODULARES ────────────────────────────────────
const modularesPrincipal: CatalogProduct[] = [
  { id: 'mod-1', name: 'Sofá Modular Flex Verde', measures: '240 × 95 × 80 cm', price: 'S/1,799', previousPrice: 'S/2,100', image: IMG.modular1, alt: 'Sofá modular flex color verde con módulos configurables', category: 'modulares', color: 'Verde', material: 'Tela antimanchas' },
  { id: 'mod-2', name: 'Sofá Modular Retro', measures: '178 × 88 × 85 cm', price: 'S/1,099', image: IMG.modular2, alt: 'Sofá modular retro con tapizado vintage y patas doradas', category: 'modulares', color: 'Rojo', material: 'Terciopelo' },
  { id: 'mod-3', name: 'Sofá Modular Minimalista', measures: '210 × 88 × 78 cm', price: 'S/1,349', image: IMG.modular3, alt: 'Sofá modular minimalista blanco con líneas limpias', category: 'modulares', color: 'Blanco', material: 'Tela performance' },
  ...placeholders(27, 'modulares', undefined, 4),
];

const modularSuelto: CatalogProduct[] = placeholders(30, 'modulares', 'suelto');

// ─── 3. SOFÁS SECCIONALES ──────────────────────────────────
const seccionalesPrincipal: CatalogProduct[] = [
  { id: 'sec-1', name: 'Seccional U Shape Premium', measures: '320 × 200 × 85 cm', price: 'S/3,200', previousPrice: 'S/3,800', image: IMG.seccional1, alt: 'Sofá seccional en U shape premium para sala grande', category: 'seccionales', color: 'Gris', material: 'Tela premium' },
  { id: 'sec-2', name: 'Seccional Familiar XL', measures: '320 × 180 × 85 cm', price: 'S/2,199', image: IMG.seccional2, alt: 'Sofá seccional familiar XL con chaise longue reversible', category: 'seccionales', color: 'Gris', material: 'Tela performance' },
  { id: 'sec-3', name: 'Seccional Minimalista Jakarta', measures: '280 × 160 × 82 cm', price: 'S/2,450', image: IMG.seccional3, alt: 'Sofá seccional minimalista estilo Jakarta con diseño moderno', category: 'seccionales', color: 'Beige', material: 'Tela bouclé' },
  { id: 'sec-4', name: 'Seccional Industrial Loft', measures: '215 × 88 × 82 cm', price: 'S/1,199', image: IMG.seccional4, alt: 'Sofá seccional industrial loft con estructura metálica', category: 'seccionales', color: 'Negro', material: 'Cuero sintético' },
  { id: 'sec-5', name: 'Seccional Lujo Moderno', measures: '280 × 160 × 80 cm', price: 'S/2,800', previousPrice: 'S/3,200', image: IMG.seccional5, alt: 'Sofá seccional de lujo moderno para sala elegante', category: 'seccionales', color: 'Beige', material: 'Velvet premium' },
  { id: 'sec-6', name: 'Seccional Escandinavo', measures: '168 × 82 × 78 cm', price: 'S/1,650', image: IMG.seccional6, alt: 'Sofá seccional escandinavo con patas de madera natural', category: 'seccionales', color: 'Beige', material: 'Tela bouclé nórdica' },
  { id: 'sec-7', name: 'Seccional Moderno Zen', measures: '175 × 85 × 75 cm', price: 'S/899', image: IMG.seccional7, alt: 'Sofá seccional moderno zen con líneas minimalistas', category: 'seccionales', color: 'Gris', material: 'Microfibra' },
  { id: 'sec-8', name: 'Seccional Clásico Beige', measures: '230 × 95 × 90 cm', price: 'S/1,599', image: IMG.seccional8, alt: 'Sofá seccional clásico beige con tapizado elegante', category: 'seccionales', color: 'Beige', material: 'Tela jacquard' },
  ...placeholders(22, 'seccionales', undefined, 9),
];

const seccionalesSueltos: CatalogProduct[] = placeholders(30, 'seccionales', 'sueltos');
const seccionalesConParlantes: CatalogProduct[] = placeholders(30, 'seccionales', 'con-parlantes');

// ─── 4. SOFÁS CAMA ─────────────────────────────────────────
const sofasCamaPrincipal: CatalogProduct[] = [
  { id: 'cama-1', name: 'Sofá Cama Convertible Negro', measures: 'Sofá: 185×90×80 / Cama: 185×130×40 cm', price: 'S/1,099', image: IMG.seccional1, alt: 'Sofá cama convertible negro con mecanismo clic-clac silencioso', category: 'sofas-cama', color: 'Negro', material: 'Tela resistente' },
  { id: 'cama-2', name: 'Sofá Cama Azul Marino', measures: 'Sofá: 180×88×78 / Cama: 180×128×38 cm', price: 'S/1,150', image: IMG.sofaAzulCama, alt: 'Sofá cama azul marino con diseño moderno y funcional', category: 'sofas-cama', color: 'Azul', material: 'Tela premium' },
  ...placeholders(28, 'sofas-cama', undefined, 3),
];

const sofasCamaSueltos: CatalogProduct[] = placeholders(20, 'sofas-cama', 'sueltos');

// ─── 5. SOFÁS 3-2-1 ────────────────────────────────────────
const sofas321Principal: CatalogProduct[] = [
  { id: '321-1', name: 'Set 3-2-1 Nórdico Oslo', measures: '3P: 220×90×80 / 2P: 175×90×80 / 1P: 90×90×80 cm', price: 'S/2,899', previousPrice: 'S/3,400', image: IMG.seccional5, alt: 'Set de sofás 3-2-1 estilo nórdico Oslo con patas de madera', category: 'sofas-321', color: 'Gris', material: 'Tela chenilla' },
  { id: '321-2', name: 'Set 3-2-1 Clásico Europeo', measures: '3P: 230×95×90 / 2P: 180×95×90 / 1P: 95×95×90 cm', price: 'S/3,200', image: IMG.euroCrema, alt: 'Set de sofás 3-2-1 clásico europeo con tapizado premium', category: 'sofas-321', color: 'Crema', material: 'Tela jacquard' },
  ...placeholders(28, 'sofas-321', undefined, 3),
];

const sofas321Sueltos: CatalogProduct[] = placeholders(40, 'sofas-321', 'sueltos');

// ─── 6. PUFS Y DECORATIVOS ─────────────────────────────────
const pufsPrincipal: CatalogProduct[] = [
  { id: 'puf-1', name: 'Puf Redondo Velvet Gris', measures: '60 × 60 × 40 cm', price: 'S/280', image: IMG.modular3, alt: 'Puf redondo de velvet gris para sala moderna', category: 'pufs', color: 'Gris', material: 'Velvet' },
  { id: 'puf-2', name: 'Puf Cuadrado Beige', measures: '50 × 50 × 45 cm', price: 'S/250', image: IMG.seccional6, alt: 'Puf cuadrado beige decorativo para sala o dormitorio', category: 'pufs', color: 'Beige', material: 'Tela premium' },
  ...placeholders(48, 'pufs', undefined, 3),
];

// ─── MAIN CATEGORIES ───────────────────────────────────────
export const catalogCategories: CatalogCategory[] = [
  {
    slug: 'europeo',
    label: 'Sofás Modelo Europeo',
    description: 'Elegancia y sofisticación con diseño europeo clásico y moderno. Tapizados premium, estructuras sólidas y acabados de lujo.',
    image: IMG.euroCrema,
    alt: 'Sofás modelo europeo con tapizado crema elegante de Mueblería Polaris',
    capacity: 30,
    products: europeoPrincipal,
    subcatalogs: [
      { slug: 'mediano', label: 'Europeo Mediano', capacity: 30, products: europeoMediano },
      { slug: 'mini', label: 'Europeo Mini', capacity: 30, products: europeoMini },
      { slug: 'mini-modular', label: 'Europeo Mini Modular', capacity: 30, products: europeoMiniModular },
    ],
  },
  {
    slug: 'modulares',
    label: 'Sofás Modulares',
    description: 'Flexibilidad total para configurar tu espacio. Módulos intercambiables que se adaptan a cualquier sala.',
    image: IMG.modular1,
    alt: 'Sofás modulares configurables en L, U o lineal de Mueblería Polaris',
    capacity: 30,
    products: modularesPrincipal,
    subcatalogs: [
      { slug: 'suelto', label: 'Modular Suelto', capacity: 30, products: modularSuelto },
    ],
  },
  {
    slug: 'seccionales',
    label: 'Sofás Seccionales',
    description: 'Amplitud y comodidad para toda la familia. Diseños seccionales que maximizan el espacio de tu sala.',
    image: IMG.seccional1,
    alt: 'Sofás seccionales en U shape para sala grande de Mueblería Polaris',
    capacity: 30,
    products: seccionalesPrincipal,
    subcatalogs: [
      { slug: 'sueltos', label: 'Seccionales Sueltos', capacity: 30, products: seccionalesSueltos },
      { slug: 'con-parlantes', label: 'Seccionales con Parlantes', capacity: 30, products: seccionalesConParlantes },
    ],
  },
  {
    slug: 'sofas-cama',
    label: 'Sofás Cama',
    description: 'La solución perfecta 2 en 1. Sofá de día, cama de noche. Ideal para cuartos de huéspedes y espacios pequeños.',
    image: IMG.sofaAzulCama,
    alt: 'Sofás cama convertibles 2 en 1 de Mueblería Polaris',
    capacity: 30,
    products: sofasCamaPrincipal,
    subcatalogs: [
      { slug: 'sueltos', label: 'Sofás Cama Sueltos', capacity: 20, products: sofasCamaSueltos },
    ],
  },
  {
    slug: 'sofas-321',
    label: 'Sofás 3-2-1',
    description: 'Sets completos para amueblar toda tu sala. Combinaciones perfectas de 3, 2 y 1 plaza en el mismo estilo.',
    image: IMG.seccional5,
    alt: 'Sets de sofás 3-2-1 completos para sala de Mueblería Polaris',
    capacity: 30,
    products: sofas321Principal,
    subcatalogs: [
      { slug: 'sueltos', label: 'Sofás 3-2-1 Sueltos', capacity: 40, products: sofas321Sueltos },
    ],
  },
  {
    slug: 'pufs',
    label: 'Pufs y Decorativos',
    description: 'Complementa tu sala con pufs y elementos decorativos de diseño. El toque final que tu hogar necesita.',
    image: IMG.modular3,
    alt: 'Pufs y elementos decorativos para sala de Mueblería Polaris',
    capacity: 50,
    products: pufsPrincipal,
    subcatalogs: [],
  },
];

export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return catalogCategories.find((c) => c.slug === slug);
}

export function getSubcatalogBySlug(categorySlug: string, subSlug: string): SubCatalog | undefined {
  const cat = getCategoryBySlug(categorySlug);
  return cat?.subcatalogs.find((s) => s.slug === subSlug);
}

export const WHATSAPP_NUMBER = '51916832791';

export function buildWhatsAppUrl(productName: string): string {
  const msg = encodeURIComponent(
    `Hola. Estoy interesado en el producto: ${productName}. Deseo recibir mayor información. Muchas gracias.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}
