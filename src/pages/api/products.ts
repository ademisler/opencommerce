import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchProductsPage as fetchWooProductsPage,
  fetchProducts,
  WooConfig,
} from '../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { sbRequest } from '../../lib/supabase';

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Example Product',
    stock: 10,
    image: 'https://via.placeholder.com/80',
    description: 'Example description',
    categories: [],
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    price: 0,
    ean: '',
  },
  {
    id: 2,
    name: 'Demo Product',
    stock: 5,
    image: 'https://via.placeholder.com/80',
    description: 'Demo description',
    categories: [],
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    price: 0,
    ean: '',
  },
];

export type Product = {
  id: number;
  name: string;
  stock: number;
  image: string;
  description: string;
  categories: string[];
  weight: string;
  dimensions: { length: string; width: string; height: string };
  price: number;
  ean: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ products: Product[]; total: number } | { error: string }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { storeId } = req.query as { storeId?: string };
    if (!storeId) {
      return res.status(400).json({ error: 'Missing storeId' });
    }

    const rows = await sbRequest<any[]>(
      'GET',
      'woo_stores',
      undefined,
      `?id=eq.${storeId}&email=eq.${session.user.email}&limit=1`
    );
    const store = rows[0];
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const config: WooConfig = {
      baseUrl: store.base_url,
      consumerKey: store.key,
      consumerSecret: store.secret,
    };

    const { page = '1', perPage = '20', search = '', all } = req.query as {
      page?: string;
      perPage?: string;
      search?: string;
      all?: string;
    };

    let wooProducts: any[] = [];
    let total = 0;

    if (all === 'true') {
      wooProducts = await fetchProducts(config);
      total = wooProducts.length;
    } else {
      const result = await fetchWooProductsPage(
        Number(page),
        Number(perPage),
        search as string,
        config
      );
      wooProducts = result.items;
      total = result.total;
    }
    const products: Product[] = wooProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      stock: p.stock_quantity ?? 0,
      image: p.images?.[0]?.src || 'https://via.placeholder.com/80',
      description: p.description || '',
      categories: (p.categories || []).map((c: any) => c.name),
      weight: p.weight || '',
      dimensions: {
        length: p.dimensions?.length || '',
        width: p.dimensions?.width || '',
        height: p.dimensions?.height || '',
      },
      price: parseFloat(p.price) || 0,
      ean: p.sku || '',
    }));
    res.status(200).json({ products, total });
  } catch (error) {
    console.error('Failed to fetch products from WooCommerce:', error);
    if (
      error instanceof Error &&
      error.message.startsWith('Missing WooCommerce configuration')
    ) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(200).json({ products: fallbackProducts, total: fallbackProducts.length });
    }
  }
}
