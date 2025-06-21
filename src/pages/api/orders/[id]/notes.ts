import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchOrderNotes, WooConfig } from '../../../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sbRequest } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any[] | { error: string }>) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id, storeId } = req.query as { id?: string; storeId?: string };
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

    const notes = await fetchOrderNotes(Number(id), config);
    const formatted = notes.map((n: any) => ({
      id: n.id,
      note: n.note,
      date_created: n.date_created,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Failed to fetch order notes:', error);
    res.status(500).json({ error: 'Failed to fetch order notes' });
  }
}
