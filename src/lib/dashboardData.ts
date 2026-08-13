import { createClient } from '@/lib/supabase/client';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalSales: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
  quantity: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  // Productos activos
  const { count: productsCount } = await supabase
    .from('products')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('is_active', true);

  // Total de pedidos
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('id', {
      count: 'exact',
      head: true,
    });

  // Total de clientes
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('role', 'user');

  // Obtener ventas
  const { data: orders } = await supabase
    .from('orders')
    .select('total');

  const totalSales =
    orders?.reduce((sum, order) => {
      return sum + Number(order.total || 0);
    }, 0) ?? 0;

  return {
    totalProducts: productsCount ?? 0,
    totalOrders: ordersCount ?? 0,
    totalUsers: usersCount ?? 0,
    totalSales,
  };
}

export async function getRecentOrders(
  limit = 5,
): Promise<RecentOrder[]> {
  const supabase = createClient();

  // 1. Obtener pedidos recientes
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      'id, user_id, total, status, created_at',
    )
    .order('created_at', {
      ascending: false,
    })
    .limit(limit);

  if (ordersError) {
    return [];
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  // 2. Obtener perfiles de los clientes
  const userIds = [
    ...new Set(
      orders
        .map((order) => order.user_id)
        .filter(
          (id): id is string => Boolean(id),
        ),
    ),
  ];

  const profilesMap = new Map<
    string,
    {
      full_name: string | null;
      email: string | null;
    }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    profiles?.forEach((profile) => {
      profilesMap.set(profile.id, {
        full_name: profile.full_name,
        email: profile.email,
      });
    });
  }

  // 3. Obtener detalles de los pedidos
  const orderIds = orders.map(
    (order) => order.id,
  );

  const { data: items } = await supabase
    .from('order_items')
    .select(
      'order_id, product_id, quantity, unit_price, subtotal',
    )
    .in('order_id', orderIds);

  // 4. Obtener productos relacionados
  const productIds = [
    ...new Set(
      (items ?? [])
        .map((item) => item.product_id)
        .filter(
          (id): id is string => Boolean(id),
        ),
    ),
  ];

  const productsMap = new Map<string, string>();

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    products?.forEach((product) => {
      productsMap.set(
        product.id,
        product.name,
      );
    });
  }

  // 5. Construir información final
  return orders.map((order) => {
    const profile = profilesMap.get(
      order.user_id,
    );

    const orderItems = (items ?? []).filter(
      (item) =>
        item.order_id === order.id,
    );

    const firstItem = orderItems[0];

    let productName = 'Pedido sin detalle';

    if (firstItem?.product_id) {
      productName =
        productsMap.get(
          firstItem.product_id,
        ) ?? 'Producto no disponible';
    }

    if (orderItems.length > 1) {
      const additionalProducts =
        orderItems.length - 1;

      productName += ` + ${additionalProducts} producto${
        additionalProducts === 1 ? '' : 's'
      }`;
    }

    const customer =
      profile?.full_name?.trim() ||
      profile?.email ||
      'Cliente';

    return {
      id: order.id,

      customer,

      product: productName,

      amount: Number(
        order.total || 0,
      ),

      date: new Intl.DateTimeFormat(
        'es-PE',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      ).format(
        new Date(order.created_at),
      ),

      status: String(
        order.status || 'pendiente',
      ),

      quantity:
        orderItems.reduce(
          (total, item) =>
            total +
            Number(
              item.quantity || 0,
            ),
          0,
        ) || 0,
    };
  });
}

export interface SalesChartData {
  month: string;
  sales: number;
}

export async function getSalesChartData(): Promise<
  SalesChartData[]
> {
  const supabase = createClient();

  const currentYear =
    new Date().getFullYear();

  const startDate = `${currentYear}-01-01T00:00:00.000Z`;

  const { data: orders } =
    await supabase
      .from('orders')
      .select(
        'total, created_at',
      )
      .gte(
        'created_at',
        startDate,
      )
      .order('created_at', {
        ascending: true,
      });

  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  const monthlySales =
    monthNames.map((month) => ({
      month,
      sales: 0,
    }));

  orders?.forEach((order) => {
    const date = new Date(
      order.created_at,
    );

    const monthIndex =
      date.getMonth();

    if (
      monthIndex >= 0 &&
      monthIndex <= 11
    ) {
      monthlySales[
        monthIndex
      ].sales += Number(
        order.total || 0,
      );
    }
  });

  return monthlySales;
}