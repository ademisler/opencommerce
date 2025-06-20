import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchOrders as fetchWooOrders,
  WooConfig,
} from '../../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { sbRequest } from '../../../lib/supabase';

export type Order = {
  id: number;
  status: string;
  total: number;
  date_created: string;
  shipping_company?: string;
  tracking_number?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Order | { error: string } | { success: boolean }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id, storeId } = req.query as {
      id?: string;
      storeId?: string;
    };
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

    if (req.method === 'DELETE') {
      // Placeholder delete
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { status, shipping_company, tracking_number } = req.body || {};
      return res
        .status(200)
        .json({
          id: Number(id),
          status: status || 'updated',
          total: 0,
          date_created: new Date().toISOString(),
          shipping_company: shipping_company || '',
          tracking_number: tracking_number || '',
        });
    }

    const wooOrders = await fetchWooOrders(config);
    const order = wooOrders.find((o: any) => o.id === Number(id));
    if (order) {
      const result: Order = {
        id: order.id,
        status: order.status,
        total: parseFloat(order.total),
        date_created: order.date_created,
        shipping_company: order.shipping_lines?.[0]?.method_title || '',
        tracking_number:
          order.meta_data?.find((m: any) => m.key === 'tracking_number')?.value || '',
      };
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Failed to fetch order from WooCommerce:', error);
    if (
      error instanceof Error &&
      error.message.startsWith('Missing WooCommerce configuration')
    ) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
}
