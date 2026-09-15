import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

const rooms = [
  { name: 'Sala', description: 'Sofás, sillones, mesas de centro y más para reunirte.', image: '/assets/images/Source_Salon_de_lujo_de_diseno_moderno_de_muebles___1_-1784897819781.jpg' },
  { name: 'Comedor', description: 'Mesas y sillas para compartir cada momento especial.', image: '/assets/images/The_Furniture_World_U_Shape_9_Seater_Fabric_Sofa_Set_with_Tea_Table___4_Puffy_2___2___2___1___1___1-1784903888189.jpg' },
  { name: 'Dormitorio', description: 'Camas, cabeceras y piezas que invitan a descansar.', image: '/assets/images/euro_crema_2-1784905017426.jpg' },
  { name: 'Oficina y decoración', description: 'Soluciones funcionales y detalles para terminar tu espacio.', image: '/assets/images/Gemini_Generated_Image_he1jnjhe1jnjhe1j__1_-1784903707261.png' },
];

export default function RoomsSection() {
  return (
    <section className="py-20 bg-muted/40" aria-labelledby="rooms-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Compra por ambiente</p>
            <h2 id="rooms-title" className="text-3xl sm:text-4xl font-extrabold text-foreground">Todo para cada rincón de tu hogar</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">Encuentra muebles y accesorios pensados para vivir mejor cada espacio.</p>
          </div>
          <Link href="/catalogo" className="font-bold text-primary hover:underline shrink-0">Explorar todo el catálogo →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rooms.map((room) => (
            <Link key={room.name} href="/catalogo" className="group relative min-h-72 overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
              <AppImage src={room.image} alt={`Muebles para ${room.name}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-extrabold">{room.name}</h3>
                <p className="text-sm text-white/80 mt-1 leading-relaxed">{room.description}</p>
                <span className="inline-flex mt-4 text-sm font-bold text-cyan-300">Ver productos →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
