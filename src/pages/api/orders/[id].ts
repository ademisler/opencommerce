import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchOrder as fetchWooOrder,
  updateOrder,
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
  customer?: string;
  payment_status?: string;
  shipping_status?: string;
  items?: {
    product_id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing?: string;
  delivery?: string;
};

const fallbackOrder: Order = {
  id: 1,
  status: 'processing',
  total: 19.99,
  date_created: '2024-01-01T00:00:00Z',
  shipping_company: '',
  tracking_number: '',
  customer: 'John Doe',
  payment_status: 'paid',
  shipping_status: 'pending',
  items: [
    {
      product_id: 1,
      name: 'Example Product',
      quantity: 1,
      price: 19.99,
    },
  ],
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '555-1234',
  billing: '123 Main St, City',
  delivery: '123 Main St, City',
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
      const {
        status: newStatus,
        shipping_company,
        tracking_number,
        items,
        customer,
      } = req.body || {};

      const updated = await updateOrder(
        Number(id),
        {
          status: newStatus,
          line_items: items,
          meta_data: tracking_number
            ? [{ key: 'tracking_number', value: tracking_number }]
            : undefined,
          shipping_lines: shipping_company
            ? [
                {
                  method_title: shipping_company,
                  method_id: shipping_company,
                  total: '0',
                },
              ]
            : undefined,
          ...(customer ? customer : {}),
        },
        config
      );
      return res.status(200).json(updated);
    }

    const order = await fetchWooOrder(Number(id), config);
    if (order) {
      const result: Order = {
        id: order.id,
        status: order.status,
        total: parseFloat(order.total),
        date_created: order.date_created,
        shipping_company: order.shipping_lines?.[0]?.method_title || '',
        tracking_number:
          order.meta_data?.find((m: any) => m.key === 'tracking_number')?.value || '',
        customer: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        payment_status: order.status === 'completed' ? 'paid' : 'unpaid',
        shipping_status: order.status,
        items: (order.line_items || []).map((it: any) => ({
          product_id: it.product_id,
          name: it.name,
          quantity: it.quantity,
          price: parseFloat(it.price || it.subtotal || 0),
        })),
        customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        customer_email: order.billing?.email || '',
        customer_phone: order.billing?.phone || '',
        billing: [
          order.billing?.address_1,
          order.billing?.address_2,
          order.billing?.city,
          order.billing?.postcode,
        ]
          .filter(Boolean)
          .join(', '),
        delivery: [
          order.shipping?.address_1,
          order.shipping?.address_2,
          order.shipping?.city,
          order.shipping?.postcode,
        ]
          .filter(Boolean)
          .join(', '),
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
      res.status(200).json(fallbackOrder);
    }
  }
}
