'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    ShoppingCart,
    Users,
    TicketPercent,
    BarChart3,
    Settings,
    LogOut,
    Sofa
} from 'lucide-react';

const menu = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard
    },
    {
        title: 'Productos',
        href: '/admin/productos',
        icon: Sofa
    },
    {
        title: 'Categorías',
        href: '/admin/categorias',
        icon: FolderTree
    },
    {
        title: 'Pedidos',
        href: '/admin/pedidos',
        icon: ShoppingCart
    },
    {
        title: 'Clientes',
        href: '/admin/clientes',
        icon: Users
    },
    {
        title: 'Promociones',
        href: '/admin/promociones',
        icon: TicketPercent
    },
    {
        title: 'Estadísticas',
        href: '/admin/estadisticas',
        icon: BarChart3
    },
    {
        title: 'Configuración',
        href: '/admin/configuracion',
        icon: Settings
    }
];

export default function DashboardSidebar() {

    const pathname = usePathname();

    return (

        <aside className="w-[270px] min-h-screen bg-slate-950 border-r border-slate-800 flex flex-col">

            <div className="h-20 flex items-center px-8 border-b border-slate-800">

                <div>

                    <h1 className="text-white text-xl font-black tracking-wide">
                        Polaris
                    </h1>

                    <p className="text-cyan-400 text-xs">
                        Panel Administrativo
                    </p>

                </div>

            </div>

            <nav className="flex-1 px-4 py-6">

                <div className="space-y-2">

                    {menu.map((item) => {

                        const Icon = item.icon;

                        const active = pathname === item.href;

                        return (

                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                px-4
                                py-3
                                transition-all
                                duration-300

                                ${
                                    active
                                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
                            `}
                            >

                                <Icon size={20} />

                                <span className="font-semibold">

                                    {item.title}

                                </span>

                            </Link>

                        );

                    })}

                </div>

            </nav>

            <div className="border-t border-slate-800 p-4">

                <button
                    className="
                    w-full
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-red-400
                    hover:bg-red-500/10
                    transition-all
                "
                >

                    <LogOut size={20} />

                    <span>

                        Cerrar sesión

                    </span>

                </button>

            </div>

        </aside>

    );

}