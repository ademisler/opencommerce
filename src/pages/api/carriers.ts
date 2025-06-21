import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchShippingMethods, WooConfig } from '../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { sbRequest } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any[] | { error: string }>) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { storeId } = req.query as { storeId?: string };
    if (!storeId) {
      return res.status(400).json({ error: 'Missing storeId' });
    }

    const rows = await sbRequest<any[]>('GET', 'woo_stores', undefined, `?id=eq.${storeId}&email=eq.${session.user.email}&limit=1`);
    const store = rows[0];
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const config: WooConfig = {
      baseUrl: store.base_url,
      consumerKey: store.key,
      consumerSecret: store.secret,
    };

    const methods = await fetchShippingMethods(config);
    const carriers = methods.map((m: any) => m.method_title || m.title || m.id);
    res.status(200).json(carriers);
  } catch (error) {
    console.error('Failed to fetch carriers:', error);
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
}
