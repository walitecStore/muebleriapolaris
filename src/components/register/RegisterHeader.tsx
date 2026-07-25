'use client';

import AppLogo from '@/components/ui/AppLogo';

export default function RegisterHeader() {
  return (
    <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-8 py-10 text-center">

      <div className="flex justify-center">
        <AppLogo size={90} />
      </div>

      <h1 className="mt-5 text-4xl font-extrabold text-white">
        Crear cuenta
      </h1>

      <p className="mt-3 text-white/90 max-w-md mx-auto leading-relaxed">
        Regístrate para comprar muebles, guardar tus favoritos
        y realizar el seguimiento de tus pedidos.
      </p>

    </div>
  );
}