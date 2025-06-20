import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../lib/theme';

// Recharts components depend on browser APIs, so load them dynamically and
// relax type checking since the package isn't installed in this environment.
const PieChart = dynamic<any>(() => import('recharts').then(m => ({ default: m.PieChart })), { ssr: false });
const Pie = dynamic<any>(() => import('recharts').then(m => ({ default: m.Pie })), { ssr: false });
const Cell = dynamic<any>(() => import('recharts').then(m => ({ default: m.Cell })), { ssr: false });
const ResponsiveContainer = dynamic<any>(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });
const LineChart = dynamic<any>(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic<any>(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const BarChart = dynamic<any>(() => import('recharts').then(m => ({ default: m.BarChart })), { ssr: false });
const Bar = dynamic<any>(() => import('recharts').then(m => ({ default: m.Bar })), { ssr: false });
const XAxis = dynamic<any>(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic<any>(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic<any>(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const CartesianGrid = dynamic<any>(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
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
  const { theme } = useTheme();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') return null;


  const ordersQuery = selected ? `/api/orders?storeId=${selected.id}` : null;
  const productsQuery = selected ? `/api/products?storeId=${selected.id}` : null;

  const { data: orders } = useSWR<any[]>(ordersQuery, fetcher);
  const { data: products } = useSWR<any[]>(productsQuery, fetcher);
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
  const productCount = products?.length ?? 0;
  const totalStock = products?.reduce((sum, p) => sum + (p.stock ?? 0), 0) ?? 0;

  const stockData = (products || []).map((p) => ({ name: p.name, value: p.stock }));
  const dailyData = Object.entries(
    filteredOrders.reduce((acc: Record<string, number>, o: any) => {
      const d = new Date(o.date_created).toISOString().slice(0, 10);
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, count]) => ({ date, count }));
  const monthlyData = Object.entries(
    filteredOrders.reduce((acc: Record<string, number>, o: any) => {
      const d = new Date(o.date_created).toISOString().slice(0, 7);
      acc[d] = (acc[d] || 0) + (o.total ?? 0);
      return acc;
    }, {})
  ).map(([month, total]) => ({ month, total }));

  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelected(stores[0]);
    }
  }, [stores]);

  return (
    <Layout title={t('dashboard')}>
      <h1 className="text-2xl font-bold mb-4">{t('dashboard')}</h1>
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
          className="border p-1"
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
              className="border p-1"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <input
              type="date"
              className="border p-1"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={stockData} dataKey="value" nameKey="name" outerRadius={80}>
                {stockData.map((_, i) => (
                  <Cell key={i} fill={theme === 'dark' ? `hsl(${i * 50},70%,60%)` : `hsl(${i * 50},70%,50%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={dailyData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="currentColor" />
              <YAxis stroke="currentColor" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="currentColor" />
              <YAxis stroke="currentColor" />
              <Tooltip />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p>{t('welcome')}</p>
    </Layout>
  );
}
