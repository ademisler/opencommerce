import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';
import { useI18n } from '../lib/i18n';
import useStores, { Store } from '../lib/hooks/useStores';

export default function Dashboard() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const { data: stores = [] } = useStores();
  const [selected, setSelected] = useState<Store | null>(null);
  const [range, setRange] = useState<'7' | '30' | 'custom'>('7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') return null;


  const ordersQuery = selected ? `/api/orders?storeId=${selected.id}` : null;
  const productsQuery = selected ? `/api/products?storeId=${selected.id}` : null;

  const { data: orders } = useSWR<any[]>(ordersQuery, fetcher);
  const { data: productData } = useSWR<{ products: any[]; total: number }>(productsQuery, fetcher);
  const products = productData?.products;
  const rangeStart = (() => {
    if (range === '7') return new Date(Date.now() - 7 * 86400000);
    if (range === '30') return new Date(Date.now() - 30 * 86400000);
    if (customStart) return new Date(customStart);
    return new Date(0);
  })();
  const rangeEnd = range === 'custom' && customEnd ? new Date(customEnd) : new Date();
  const filteredOrders = (orders || []).filter((o) => {
    const d = new Date(o.date_created);
    return d >= rangeStart && d <= rangeEnd;
  });

  const orderCount = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const productCount = productData?.total ?? (products?.length ?? 0);
  const totalStock = products?.reduce((sum, p) => sum + (p.stock ?? 0), 0) ?? 0;


  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelected(stores[0]);
    }
  }, [stores]);

  return (
    <Layout title={t('dashboard')}>
      <h1 className="text-2xl font-bold mb-4">{t('dashboard')}</h1>
      {stores.length > 1 && (
        <div className="mb-4">
          <select
            className="border p-1 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
            value={selected?.id ?? ''}
            onChange={(e) => {
              const store = stores.find((s) => s.id === Number(e.target.value));
              setSelected(store || null);
            }}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {stores.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('connectedStores')}</h2>
          <ul className="list-disc ml-5 space-y-1">
            {stores.map((s) => (
              <li key={s.id}>
                {s.name} - {s.baseUrl}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border rounded p-4 text-center">
          <p className="text-sm text-gray-600">{t('productsLabel')}</p>
          <p className="text-xl font-semibold">{productCount}</p>
        </div>
        <div className="border rounded p-4 text-center">
          <p className="text-sm text-gray-600">{t('totalStock')}</p>
          <p className="text-xl font-semibold">{totalStock}</p>
        </div>
        <div className="border rounded p-4 text-center">
          <p className="text-sm text-gray-600">{t('orders')}</p>
          <p className="text-xl font-semibold">{orderCount}</p>
        </div>
        <div className="border rounded p-4 text-center">
          <p className="text-sm text-gray-600">{t('revenue')}</p>
          <p className="text-xl font-semibold">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>
      <div className="mb-4 space-x-2">
        <select
          className="border p-1 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          value={range}
          onChange={(e) => setRange(e.target.value as '7' | '30' | 'custom')}
        >
          <option value="7">{t('last7Days')}</option>
          <option value="30">{t('last30Days')}</option>
          <option value="custom">{t('custom')}</option>
        </select>
        {range === 'custom' && (
          <>
            <input
              type="date"
              className="border p-1 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <input
              type="date"
              className="border p-1 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Charts were removed */}
      <p>{t('welcome')}</p>
    </Layout>
  );
}
