import useSWR from 'swr';
import { fetcher } from '../fetcher';
import { Product } from '../types';

export default function useProducts(storeId?: number) {
  const query = storeId !== undefined ? `/api/products?storeId=${storeId}` : null;
  return useSWR<{ products: Product[]; total: number }>(query, fetcher);
}
