import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <I18nProvider>
          <Component {...pageProps} />
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
