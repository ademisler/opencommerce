import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import useSWR from 'swr';
import { fetcher } from '../../../lib/fetcher';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useI18n } from '../../../lib/i18n';
import useStores from '../../../lib/hooks/useStores';
import { PlusIcon, TrashIcon } from '../../../components/Icons';
import Loader from '../../../components/Loader';

interface Store {
  id: number;
  name: string;
  baseUrl: string;
  key: string;
  secret: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
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
}

export default function EditOrder() {
  const { status } = useSession();
  const router = useRouter();
  const { id, storeId } = router.query as { id?: string; storeId?: string };
  const { data: stores = [] } = useStores();
  const [store, setStore] = useState<Store | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (stores && stores.length > 0) {
      const selected = storeId ? stores.find((s) => s.id === Number(storeId)) : stores[0];
      setStore(selected || null);
    }
  }, [stores, storeId]);

  const query = id && store ? `/api/orders/${id}?storeId=${store.id}` : null;
  const { data, mutate } = useSWR<OrderData>(query, fetcher);

  const carriersQuery = store ? `/api/carriers?storeId=${store.id}` : null;
  const { data: carriers = [] } = useSWR<string[]>(carriersQuery, fetcher);

  const trackingQuery =
    id && store ? `/api/orders/${id}/tracking?storeId=${store.id}` : null;
  const {
    data: trackingItems = [],
    mutate: mutateTracking,
  } = useSWR<{
    id: string;
    provider: string;
    tracking_number: string;
    date_shipped: string;
  }[]>(trackingQuery, fetcher);

  const notesQuery = id && store ? `/api/orders/${id}/notes?storeId=${store.id}` : null;
  const { data: notes = [] } = useSWR<{ id: number; note: string; date_created: string }[]>(notesQuery, fetcher);

  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [shippingStatus, setShippingStatus] = useState('pending');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    billing: '',
    delivery: '',
  });
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [labels, setLabels] = useState('');
  const [showAddTracking, setShowAddTracking] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newTrackingProvider, setNewTrackingProvider] = useState('');
  const [newDateShipped, setNewDateShipped] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [markComplete, setMarkComplete] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState('');

  useEffect(() => {
    if (data) {
      setOrderStatus(data.status);
      setPaymentStatus(data.payment_status || 'paid');
      setShippingStatus(data.shipping_status || 'pending');
      setCarrier(data.shipping_company || '');
      setTracking(data.tracking_number || '');
      setItems(
        (data.items || []).map((it) => ({
          productId: it.product_id,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        }))
      );
      setCustomer({
        name: data.customer_name || '',
        email: data.customer_email || '',
        phone: data.customer_phone || '',
        billing: data.billing || '',
        delivery: data.delivery || '',
      });
    }
  }, [data]);

  const productsQuery = store ? `/api/products?storeId=${store.id}&all=true` : null;
  const { data: prodData } = useSWR<{ products: Product[]; total: number }>(productsQuery, fetcher);
  const products = prodData?.products || [];
  const [newProductId, setNewProductId] = useState<number | ''>('');

  const addProduct = () => {
    const prod = products.find((p) => p.id === Number(newProductId));
    if (prod) {
      setItems([...items, { productId: prod.id, name: prod.name, quantity: 1, price: prod.price }]);
      setNewProductId('');
    }
  };

  const updateQty = (index: number, qty: number) => {
    setItems(items.map((it, i) => (i === index ? { ...it, quantity: qty } : it)));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateOrderHandler = async () => {
    if (!store || !id) return;
    await fetch(`/api/orders/${id}?storeId=${store.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: orderStatus,
        shipping_company: carrier,
        tracking_number: tracking,
        items: items.map((it) => ({ product_id: it.productId, quantity: it.quantity })),
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          billing: customer.billing,
          delivery: customer.delivery,
        },
      }),
    });
    mutate();
  };

  const addTrackingHandler = async () => {
    if (!store || !id) return;
    await fetch(`/api/orders/${id}/tracking?storeId=${store.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: newTrackingProvider,
        tracking_number: newTrackingNumber,
        date_shipped: newDateShipped,
        markCompleted: markComplete,
      }),
    });
    setShowAddTracking(false);
    setNewTrackingNumber('');
    setNewTrackingProvider('');
    mutate();
    mutateTracking();
  };

  const deleteTrackingHandler = async (tid: string) => {
    if (!store || !id) return;
    await fetch(
      `/api/orders/${id}/tracking?storeId=${store.id}&trackingId=${tid}`,
      { method: 'DELETE' }
    );
    mutateTracking();
  };

  const sendEmailHandler = async () => {
    if (!store || !id || !emailTemplate) return;
    await updateOrderHandler();
    await fetch(`/api/orders/${id}/send-email?storeId=${store.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: emailTemplate }),
    });
    setEmailTemplate('');
  };

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }
  if (!store) return <div>{t('noStore')}</div>;
  if (!data)
    return (
      <Layout title={`${t('order')} #${id} - ${t('edit')}`}> 
        <Loader className="py-8" />
      </Layout>
    );

  return (
    <Layout title={`${t('order')} #${id} - ${t('edit')}`}> 
      <div className="lg:flex lg:gap-4 space-y-6 lg:space-y-0">
        <div className="flex-1 space-y-6">
          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order #{data.id}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(data.date_created).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block mb-1 text-sm">Status</label>
                <select className="w-full" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Payment</label>
                <span className="inline-block px-2 py-1 rounded bg-green-600 text-white text-xs">{paymentStatus}</span>
              </div>
              <div>
                <label className="block mb-1 text-sm">Shipping</label>
                <span className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs">{shippingStatus}</span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-sm mb-2">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1">Product</th>
                  <th className="py-1">Qty</th>
                  <th className="py-1">Price</th>
                  <th className="py-1">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 w-20">
                      <input
                        type="number"
                        min={1}
                        className="w-full"
                        value={item.quantity}
                        onChange={(e) => updateQty(idx, Number(e.target.value))}
                      />
                    </td>
                    <td className="py-1">{item.price.toFixed(2)}</td>
                    <td className="py-1">{(item.price * item.quantity).toFixed(2)}</td>
                    <td className="py-1 text-right">
                      <button onClick={() => removeItem(idx)} aria-label="remove" className="text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <select className="flex-1" value={newProductId} onChange={(e) => setNewProductId(Number(e.target.value))}>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addProduct} className="px-2 py-1 bg-rose-500 text-white rounded">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">Name</label>
                <input className="w-full" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Email</label>
                <input className="w-full" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Phone</label>
                <input className="w-full" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Billing Address</label>
                <textarea className="w-full" value={customer.billing} onChange={(e) => setCustomer({ ...customer, billing: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Delivery Address</label>
                <textarea className="w-full" value={customer.delivery} onChange={(e) => setCustomer({ ...customer, delivery: e.target.value })} />
              </div>
            </div>
          </section>

          <div className="text-right">
            <button
              type="button"
              onClick={updateOrderHandler}
              className="mt-2 px-4 py-2 rounded text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
            >
              Update
            </button>
          </div>
        </div>

        <aside className="lg:w-80 w-full space-y-6 mt-6 lg:mt-0">
          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Order History</h2>
            <ul className="text-sm space-y-1">
              {notes.map((n) => (
                <li key={n.id}>{n.note}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
