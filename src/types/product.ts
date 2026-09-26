export interface Product {
  id: string;

  category_id: string;

  name: string;

  slug: string;

  description: string;

  price: number;

  image_url: string;

  images: string[];

  stock: number;

  is_active: boolean;

  created_at: string;

  updated_at: string;
}
