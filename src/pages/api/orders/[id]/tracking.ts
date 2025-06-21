import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchTrackingEntries,
  addTrackingEntry,
  deleteTrackingEntry,
  TrackingEntry,
  WooConfig,
} from '../../../../lib/integrations/woocommerceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sbRequest } from '../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackingEntry[] | { success: boolean } | { error: string }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { id, storeId, trackingId } = req.query as {
      id?: string;
      storeId?: string;
      trackingId?: string;
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

    if (req.method === 'POST') {
      const { provider, tracking_number, date_shipped, markCompleted } = req.body;
      const entry: TrackingEntry = {
        id: uuidv4(),
        provider,
        tracking_number,
        date_shipped,
      };
      await addTrackingEntry(Number(id), entry, !!markCompleted, config);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!trackingId) return res.status(400).json({ error: 'Missing trackingId' });
      await deleteTrackingEntry(Number(id), trackingId, config);
      return res.status(200).json({ success: true });
    }

    const entries = await fetchTrackingEntries(Number(id), config);
    res.status(200).json(entries);
  } catch (error) {
    console.error('Tracking API error:', error);
    res.status(500).json({ error: 'Tracking API error' });
  }
}
