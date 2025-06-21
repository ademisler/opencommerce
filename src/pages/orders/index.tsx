import Layout from '../../components/Layout';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useI18n } from '../../lib/i18n';
import useStores from '../../lib/hooks/useStores';
import Loader from '../../components/Loader';

interface Store {
  id: number;
  name: string;
  baseUrl: string;
  key: string;
  secret: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  customer?: string;
}


export default function Orders() {
  const { status } = useSession();
  const router = useRouter();
  const { data: stores = [] } = useStores();
  const [selected, setSelected] = useState<Store | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (stores && stores.length > 0) setSelected(stores[0]);
  }, [stores]);

  if (status === 'loading' || status === 'unauthenticated') return null;

  const query = selected ? `/api/orders?storeId=${selected.id}` : null;

  const { data, error } = useSWR<Order[]>(query, fetcher);

  if (error) return <div className="dark:text-gray-100">{t('errorLoadingOrders')}</div>;
  if (!selected) return (
    <Layout title={t('orders')}>
      <p className="dark:text-gray-100">{t('noStore')}</p>
    </Layout>
  );
  if (!data)
    return (
      <Layout title={t('orders')}>
        <Loader className="py-8" />
      </Layout>
    );

  return (
    <Layout title={t('orders')}>
      <div className="bg-white dark:bg-gray-900 p-4 rounded">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">{t('orders')}</h1>
      <Link
        href="/orders/create"
        className="inline-block mb-4 px-4 py-2 rounded text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
      >
        {t('createOrder')}
      </Link>
      <div className="mb-4">
        <select
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2"
          value={selected?.id ?? ''}
          onChange={(e) => {
            const store = stores.find((s) => s.id === Number(e.target.value));
            setSelected(store || null);
          }}
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>
      {data.length === 0 ? (
        <p className="dark:text-gray-100">{t('noOrders')}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((order) => (
            <li
              key={order.id}
              className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800"
            >
              <Link
                href={`/orders/${order.id}/edit?storeId=${selected?.id}`}
                className="dark:text-gray-100"
              >
                {t('order')} #{order.id} - {order.customer}
              </Link>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Layout>
  );
}
