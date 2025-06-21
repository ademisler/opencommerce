import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sbRequest } from '../../../../lib/supabase';
import { fetchOrder } from '../../../../lib/integrations/woocommerceService';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id, storeId } = req.query;
    if (!storeId || !id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Fetch store credentials from Supabase
    const rows = await sbRequest('GET', 'woo_stores', undefined,
      `?id=eq.${storeId}&email=eq.${session.user.email}&limit=1`);
    const store = rows[0];
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const config = {
      baseUrl: store.base_url,
      consumerKey: store.key,
      consumerSecret: store.secret,
    };

    // Retrieve the order from WooCommerce
    const order = await fetchOrder(Number(id), config);

    // Look for the AST plugin meta key
    const meta = order.meta_data?.find((m) => m.key === '_tracking_items');
    let items = [];
    if (meta && meta.value) {
      try {
        if (typeof meta.value === 'string') {
          items = JSON.parse(meta.value);
        } else if (Array.isArray(meta.value)) {
          items = meta.value;
        }
      } catch (err) {
        console.error('Failed to parse tracking data', err);
      }
    }

    const formatted = items.map((it) => ({
      id: String(it.tracking_id ?? it.tracking_number ?? ''),
      provider: it.tracking_provider || '',
      tracking_number: it.tracking_number || '',
      date_shipped: it.date_shipped || '',
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Tracking API error:', err);
    return res.status(500).json({ error: 'Tracking API error' });
  }
}
