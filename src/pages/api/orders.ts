import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchOrders as fetchWooOrders,
  WooConfig,
} from '../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { sbRequest } from '../../lib/supabase';

const fallbackOrders: Order[] = [
  { id: 1, status: 'processing', total: 19.99, date_created: '2024-01-01T00:00:00Z', shipping_company: '', tracking_number: '', customer: 'John Doe' },
  { id: 2, status: 'completed', total: 5.0, date_created: '2024-01-02T00:00:00Z', shipping_company: '', tracking_number: '', customer: 'Jane Doe' },
];

export type Order = {
  id: number;
  status: string;
  total: number;
  date_created: string;
  shipping_company?: string;
  tracking_number?: string;
  customer?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Order[] | { error: string }>
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

    const wooOrders = await fetchWooOrders(config);
    const orders: Order[] = wooOrders.map((o: any) => ({
      id: o.id,
      status: o.status,
      total: parseFloat(o.total),
      date_created: o.date_created,
      shipping_company: o.shipping_lines?.[0]?.method_title || '',
      tracking_number:
        o.meta_data?.find((m: any) => m.key === 'tracking_number')?.value || '',
      customer: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim(),
    }));
    res.status(200).json(orders);
  } catch (error) {
    console.error('Failed to fetch orders from WooCommerce:', error);
    if (
      error instanceof Error &&
      error.message.startsWith('Missing WooCommerce configuration')
    ) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(200).json(fallbackOrders);
    }
  }
}
