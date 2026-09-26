'use client';

import { Phone, Mail, Truck, Globe, MessageCircle } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="hidden lg:block bg-slate-950 text-white text-sm">
      <div className="max-w-[1440px] mx-auto px-6 h-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>Envíos a todo el Perú</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>+51 916 832 791</span>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>ventas@muebleriapolaris.com</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Globe className="w-4 h-4 cursor-pointer hover:text-cyan-400 transition-colors" />

          <MessageCircle className="w-4 h-4 cursor-pointer hover:text-cyan-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
