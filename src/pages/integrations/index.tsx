import Layout from '../../components/Layout';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useI18n } from '../../lib/i18n';
import useStores, { Store } from '../../lib/hooks/useStores';
import useProducts from '../../lib/hooks/useProducts';
import useOrders from '../../lib/hooks/useOrders';
import { useState } from 'react';

function StoreCard({ store }: { store: Store }) {
  const { t } = useI18n();
  const { data: productData } = useProducts(store.id);
  const { data: orders } = useOrders(store.id);
  const [status, setStatus] = useState<'connected' | 'disconnected' | null>(null);
  const [testing, setTesting] = useState(false);


  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/products?storeId=${store.id}`);
      setStatus(res.ok ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
    setTesting(false);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 p-4 rounded bg-white dark:bg-gray-800 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-semibold">{store.name}</h3>
        </div>
        {status && (
          <span className="text-sm">
            {status === 'connected' ? `✅ ${t('connected')}` : `❌ ${t('disconnected')}`}
          </span>
        )}
      </div>
      <p className="text-sm">{t('lastSync')}: N/A</p>
      <p className="text-sm">{t('productsLabel')}: {productData ? productData.total : '-'}</p>
      <p className="text-sm">{t('orders')}: {orders ? orders.length : '-'}</p>
      <div className="flex justify-between items-center pt-2">
        <button
          className="text-blue-600 underline text-sm"
          onClick={testConnection}
          disabled={testing}
        >
          {t('testConnection')}
        </button>
        <Link href="/integrations/woocommerce" className="text-sm underline">
          {t('manage')}
        </Link>
      </div>
    </div>
  );
}

export default function Integrations() {
  const { status } = useSession();
  const router = useRouter();
  const { data: stores = [] } = useStores();
  const { t } = useI18n();
  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }
  return (
    <Layout title={t('integrations')}>
      <h1 className="text-2xl font-bold mb-4">{t('integrations')}</h1>
      <p className="mb-4">{t('manageIntegrations')}</p>
      <div className="grid md:grid-cols-2 gap-4">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>
      {stores.length === 0 && <p className="mt-4">{t('noStore')}</p>}
      <Link href="/integrations/woocommerce" className="inline-block mt-4 underline">
        {t('addStore')}
      </Link>
    </Layout>
  );
}
