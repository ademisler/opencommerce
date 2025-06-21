import type { NextApiRequest, NextApiResponse } from 'next';
import { WooConfig, fetchProduct } from '../../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { sbRequest } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const { id } = req.query as { id?: string };
  const { storeId } = req.query as { storeId?: string };
  if (!storeId || !id) {
    return res.status(400).json({ error: 'Missing parameters' });
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

  if (req.method === 'PUT') {
    const body = req.body || {};
    await fetch(`${config.baseUrl}/wp-json/wc/v3/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    try {
      const product = await fetchProduct(Number(id), config);
      return res.status(200).json(product);
    } catch (e) {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).end('Method Not Allowed');
}
