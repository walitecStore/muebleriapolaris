'use client';

import {
    Package,
    ShoppingCart,
    Users,
    DollarSign
} from 'lucide-react';

interface StatsCardsProps {

    totalProducts: number;

    totalOrders: number;

    totalUsers: number;

    totalSales: number;

}

const cards = [

    {
        title: 'Productos',
        icon: Package,
        color: 'bg-cyan-500',
        key: 'products'
    },

    {
        title: 'Pedidos',
        icon: ShoppingCart,
        color: 'bg-orange-500',
        key: 'orders'
    },

    {
        title: 'Clientes',
        icon: Users,
        color: 'bg-green-500',
        key: 'users'
    },

    {
        title: 'Ventas',
        icon: DollarSign,
        color: 'bg-purple-500',
        key: 'sales'
    }

];

export default function StatsCards({

    totalProducts,

    totalOrders,

    totalUsers,

    totalSales

}: StatsCardsProps) {

    const values = {

        products: totalProducts,

        orders: totalOrders,

        users: totalUsers,

        sales: `S/ ${totalSales.toFixed(2)}`

    };

    return (

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            {cards.map((card) => {

                const Icon = card.icon;

                return (

                    <div
                        key={card.key}
                        className="
                            bg-white
                            rounded-2xl
                            shadow-sm
                            border
                            border-slate-200
                            p-6
                            hover:shadow-xl
                            hover:-translate-y-1
                            transition-all
                            duration-300
                        "
                    >

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-slate-500 text-sm">

                                    {card.title}

                                </p>

                                <h2 className="text-3xl font-black mt-2">

                                    {values[card.key as keyof typeof values]}

                                </h2>

                                <p className="text-xs text-emerald-500 mt-3">

                                    ▲ Actualizado en tiempo real

                                </p>

                            </div>

                            <div
                                className={`
                                    w-14
                                    h-14
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    text-white
                                    ${card.color}
                                `}
                            >

                                <Icon size={28} />

                            </div>

                        </div>

                    </div>

                );

            })}

        </div>

    );

}