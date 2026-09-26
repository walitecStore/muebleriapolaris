import { createClient } from './supabase/client';
import { Product } from '@/types/product';

export async function getProducts(): Promise<Product[]> {
  const supabase = createClient();

  const { data, error } = await supabase

    .from('products')

    .select('*')

    .eq('is_active', true)

    .order('name', { ascending: true });

  if (error) {
    console.error('Error cargando productos:', error);

    return [];
  }

  return data as Product[];
}
