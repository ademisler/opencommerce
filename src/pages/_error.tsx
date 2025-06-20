import { NextPageContext } from 'next';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

interface Props {
  statusCode?: number;
}

function ErrorPage({ statusCode }: Props) {
  const { t } = useI18n();
  return (
    <Layout title="Error">
      <h1 className="text-2xl font-bold mb-4">{t('errorOccurred')}</h1>
      {statusCode && <p>Status Code: {statusCode}</p>}
      <p>{t('tryAgainLater')}</p>
    </Layout>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode || err?.statusCode;
  return { statusCode };
};

export default ErrorPage;
