import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useI18n, Lang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { SunIcon, MoonIcon, MenuIcon, XIcon } from './Icons';

interface Props {
  children: React.ReactNode;
  title?: string;
}
const Layout: React.FC<Props> = ({ children, title }) => {
  const { data: session } = useSession();
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; image: string }>({ name: '', image: '' });

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    };
    load();
  }, [session]);

  const imageSrc = profile.image || session?.user?.image || 'https://via.placeholder.com/32';

  return (
    <>
      <Head>
        <title>{title ? `${title} - OpenCommerce` : 'OpenCommerce'}</title>
      </Head>
      <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      {session && (
      <header className="text-white bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-700 dark:to-orange-600">
        <nav className="flex justify-between items-center container mx-auto p-4 relative">
          <button
            className="mr-4 block md:hidden"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Menu"
          >
            {navOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
          <div className="hidden md:flex space-x-4 flex-1">
            <Link href="/dashboard" className="hover:underline">{t('dashboard')}</Link>
            <Link href="/products" className="hover:underline">{t('products')}</Link>
            <Link href="/orders" className="hover:underline">{t('orders')}</Link>
            <Link href="/integrations" className="hover:underline">{t('integrations')}</Link>
          </div>
          <div className="flex items-center ml-auto pr-4 gap-2">
            <select
              className="text-black p-1 rounded"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">EN</option>
              <option value="tr">TR</option>
              <option value="fr">FR</option>
            </select>
            <button onClick={toggleTheme} aria-label={t('theme')}>
              {theme === 'dark' ? (
                <SunIcon className="w-6 h-6" />
              ) : (
                <MoonIcon className="w-6 h-6" />
              )}
            </button>
            {session ? (
              <div className="relative">
                <img
                  src={imageSrc}
                  alt="profile"
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={() => setMenuOpen(!menuOpen)}
                />
                {menuOpen && (
                  <div className="absolute right-0 mt-2 bg-white text-black rounded shadow-md w-40 z-10">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                    >
                      {t('signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hover:underline">{t('login')}</Link>
            )}
          </div>
        </nav>
        {navOpen && (
          <div className="md:hidden flex flex-col space-y-2 px-4 pb-4 text-white bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-700 dark:to-orange-600">
            <Link href="/dashboard" className="hover:underline" onClick={() => setNavOpen(false)}>{t('dashboard')}</Link>
            <Link href="/products" className="hover:underline" onClick={() => setNavOpen(false)}>{t('products')}</Link>
            <Link href="/orders" className="hover:underline" onClick={() => setNavOpen(false)}>{t('orders')}</Link>
            <Link href="/integrations" className="hover:underline" onClick={() => setNavOpen(false)}>{t('integrations')}</Link>
          </div>
        )}
      </header>
      )}
      <main className="flex-1 p-4 container mx-auto">{children}</main>
      <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} OpenCommerce
      </footer>
      </div>
    </>
  );
};

export default Layout;
