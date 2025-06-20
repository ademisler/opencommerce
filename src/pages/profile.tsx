import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

interface ProfileInfo {
  name: string;
  image: string;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileInfo>({ name: '', image: '' });
  const { t } = useI18n();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const load = async () => {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (session?.user) {
        setProfile({ name: session.user.name || '', image: session.user.image || '' });
      }
    };
    load();
  }, [status, session]);

  const saveProfile = async () => {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  };


  if (status !== 'authenticated') {
    return null;
  }

  return (
    <Layout title={t('profile')}>
      <h1 className="text-2xl font-bold mb-4">{t('profile')}</h1>
      <div className="space-y-4 max-w-sm">
        <div>
          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">{t('name')}</label>
          <input
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-700 dark:text-gray-200">{t('profileImage')}</label>
          <input
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 w-full"
            value={profile.image}
            onChange={(e) => setProfile({ ...profile, image: e.target.value })}
          />
        </div>
        <button className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 dark:border dark:border-gray-600" onClick={saveProfile}>
          {t('saveProfile')}
        </button>
        <button className="bg-red-500 dark:bg-red-700 text-white px-4 py-2 mt-4 rounded-md dark:border dark:border-gray-600" onClick={() => signOut()}>
          {t('signOut')}
        </button>
      </div>
    </Layout>
  );
}
