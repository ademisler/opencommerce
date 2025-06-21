import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import useSWR from 'swr';
import { fetcher } from '../../../lib/fetcher';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useI18n } from '../../../lib/i18n';
import useStores from '../../../lib/hooks/useStores';
import { PlusIcon, TrashIcon } from '../../../components/Icons';

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
  payment_status?: string;
  shipping_status?: string;
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
  const { data } = useSWR<OrderData>(query, fetcher);

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
  const [taskUser, setTaskUser] = useState('');

  useEffect(() => {
    if (data) {
      setOrderStatus(data.status);
    }
  }, [data]);

  const productsQuery = store ? `/api/products?storeId=${store.id}&page=1&perPage=50` : null;
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

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }
  if (!store) return <div>{t('noStore')}</div>;
  if (!data) return <div>{t('loading')}</div>;

  return (
    <Layout title={`${t('order')} #${id} - ${t('edit')}`}> 
      <div className="lg:flex lg:gap-4">
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

          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Shipping</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">Carrier</label>
                <select className="w-full" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  <option value="">Select</option>
                  <option value="ups">UPS</option>
                  <option value="fedex">FedEx</option>
                  <option value="dhl">DHL</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm">Tracking Number</label>
                <input className="w-full" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <button type="button" className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Print Label</button>
                <span className="text-sm">{shippingStatus} - {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Invoice</h2>
            <div className="space-x-2">
              <button type="button" className="px-3 py-1 bg-rose-500 text-white rounded">Create Invoice</button>
              <button type="button" className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Download PDF</button>
              <button type="button" className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Return Invoice</button>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Notes & Labels</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Internal Note</label>
                <textarea className="w-full" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Customer Note</label>
                <textarea className="w-full" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Labels</label>
                <input className="w-full" placeholder="e.g. VIP, delayed" value={labels} onChange={(e) => setLabels(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:w-80 space-y-6 mt-6 lg:mt-0">
          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Task</h2>
            <select className="w-full" value={taskUser} onChange={(e) => setTaskUser(e.target.value)}>
              <option value="">Assign user</option>
              <option value="user1">User 1</option>
              <option value="user2">User 2</option>
            </select>
          </section>
          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Order History</h2>
            <ul className="text-sm space-y-1">
              <li>Order created</li>
              <li>Status updated</li>
            </ul>
          </section>
          <section className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Automation</h2>
            <ul className="text-sm space-y-1">
              <li>Email sent</li>
              <li>Stock synced</li>
            </ul>
          </section>
        </aside>
      </div>
    </Layout>
  );
}
