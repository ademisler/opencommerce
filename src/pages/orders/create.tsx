import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import { useI18n } from '../../lib/i18n';
import useStores from '../../lib/hooks/useStores';
import { europeanCountries } from '../../utils/europeanCountries';
import Select from 'react-select';
import { PlusIcon, TrashIcon } from '../../components/Icons';
import Loader from '../../components/Loader';

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
  stock: number;
  image: string;
  price: number;
}

interface OrderItem {
  product_id: number;
  quantity: number;
}


export default function CreateOrder() {
  const { status } = useSession();
  const router = useRouter();
  const { data: stores = [] } = useStores();
  const [selected, setSelected] = useState<Store | null>(null);
  const [items, setItems] = useState<Record<number, number>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productMap, setProductMap] = useState<Record<number, Product>>({});
  const { t } = useI18n();
  const countryOptions = europeanCountries.map((c) => ({ value: c.code, label: c.name }));
  const [customer, setCustomer] = useState({
    first_name: '',
    last_name: '',
    company: '',
    country: '',
    address_1: '',
    address_2: '',
    postcode: '',
    city: '',
    phone: '',
    email: '',
  });
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);

  const validateCustomer = () =>
    customer.first_name &&
    customer.last_name &&
    customer.address_1 &&
    customer.city &&
    customer.country &&
    customer.email;

  useEffect(() => {
    if (stores && stores.length > 0) setSelected(stores[0]);
  }, [stores]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearch, selected]);

  const productPageSize = 20;
  const query = selected
    ? `/api/products?storeId=${selected.id}&page=${productPage}&perPage=${productPageSize}&search=${encodeURIComponent(productSearch)}`
    : null;
  const { data } = useSWR<{ products: Product[]; total: number }>(query, fetcher);
  const totalProductPages = useMemo(
    () => Math.ceil((data?.total || 0) / productPageSize) || 1,
    [data?.total]
  );
  const products = data?.products || [];

  useEffect(() => {
    if (products.length) {
      setProductMap((m) => {
        const updated = { ...m };
        products.forEach((p) => {
          updated[p.id] = p;
        });
        return updated;
      });
    }
  }, [products]);

  const create = async () => {
    if (!selected) return;
    const lineItems: OrderItem[] = (Object.entries(items) as [string, number][]) 
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product_id: Number(id), quantity: qty }));
    if (lineItems.length === 0) return;
    await fetch(`/api/orders/create?storeId=${selected.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lineItems, customer, note }),
      }
    );
    router.push('/orders');
  };

  return (
    <Layout title={t('createOrder')}>
      <h1 className="text-2xl font-bold mb-4">{t('createOrder')}</h1>
      <div className="mb-4">
        <select
          className="border p-2 bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
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

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('firstName')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.first_name}
              onChange={(e) => setCustomer({ ...customer, first_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('lastName')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.last_name}
              onChange={(e) => setCustomer({ ...customer, last_name: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('company')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.company}
              onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('country')}
            </label>
            <Select
              className="text-black"
              options={countryOptions}
              value={countryOptions.find((o) => o.value === customer.country) || null}
              onChange={(val: any) =>
                setCustomer({ ...customer, country: val ? val.value : '' })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('houseNumber')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.address_1}
              onChange={(e) => setCustomer({ ...customer, address_1: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('apartment')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.address_2}
              onChange={(e) => setCustomer({ ...customer, address_2: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('postcode')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.postcode}
              onChange={(e) => setCustomer({ ...customer, postcode: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('city')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.city}
              onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('phone')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('emailAddress')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('notes')}
            </label>
            <textarea
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="mb-4">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">
              {t('searchProducts')}
            </label>
            <input
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          {!data ? (
            <Loader className="py-8" />
          ) : (
            <div className="space-y-2 pb-64">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center space-x-4 border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800"
                >
                  <img src={p.image} alt={p.name} className="w-16 h-16 object-cover" />
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-600">Stock: {p.stock}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-20 text-gray-700 dark:text-gray-200"
                      value={items[p.id] ?? 0}
                      onChange={(e) => setItems({ ...items, [p.id]: Number(e.target.value) })}
                    />
                    <button
                      className="bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded-md flex items-center dark:border dark:border-gray-600"
                      onClick={() => {
                        setItems({ ...items, [p.id]: (items[p.id] ?? 0) + 1 });
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              {totalProductPages > 1 && (
                <div className="flex justify-center space-x-2 mt-2">
                  <button
                    className="px-2 py-1 rounded border dark:border-gray-600"
                    disabled={productPage === 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  >
                    {t('back')}
                  </button>
                  <span className="px-2 py-1">
                    {productPage} / {totalProductPages}
                  </span>
                  <button
                    className="px-2 py-1 rounded border dark:border-gray-600"
                    disabled={productPage === totalProductPages}
                    onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  >
                    {t('next')}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded">
          <h2 className="font-semibold mb-2">{t('cart')}</h2>
          <ul className="space-y-1">
            {Object.entries(items)
              .filter(([, qty]) => qty > 0)
              .map(([id, qty]) => {
                const prod = productMap[Number(id)];
                return (
                  <li key={id} className="flex justify-between items-center">
                    <span>
                      {prod?.name || id} x {qty}
                    </span>
                    <button
                      type="button"
                      className="text-red-600 p-1"
                      onClick={() => {
                        const newItems = { ...items } as Record<number, number>;
                        delete newItems[Number(id)];
                        setItems(newItems);
                      }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
          </ul>
          <p className="font-semibold mt-2">
            Total:
            {(
              Object.entries(items).reduce((sum, [id, qty]) => {
                const prod = productMap[Number(id)];
                return sum + (prod?.price || 0) * qty;
              }, 0)
            ).toFixed(2)}
          </p>
        </div>
      )}

      <div className="flex justify-between mt-4">
        {step > 1 && (
          <button
            className="px-4 py-2 rounded border dark:border-gray-600"
            onClick={() => setStep(step - 1)}
          >
            {t('back')}
          </button>
        )}
        {step < 3 && (
          <button
            className="ml-auto px-4 py-2 rounded-md text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
            onClick={() => {
              if (step === 1 && !validateCustomer()) return;
              setStep(step + 1);
            }}
          >
            {t('next')}
          </button>
        )}
        {step === 3 && (
          <button
            onClick={create}
            className="ml-auto px-4 py-2 rounded-md text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
          >
            {t('createOrder')}
          </button>
        )}
      </div>
    </Layout>
  );
}

