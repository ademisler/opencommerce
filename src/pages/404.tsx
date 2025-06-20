import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Layout title="404">
      <h1 className="text-2xl font-bold mb-4">{t('pageNotFound')}</h1>
      <p>{t('pageNotFoundDesc')}</p>
    </Layout>
  );
}
