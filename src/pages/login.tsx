import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    if (theme !== 'dark') toggleTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading' || session) return null;

  const handleContinue = () => {
    if (email) {
      setStep(2);
      setTimeout(() => {
        const el = document.getElementById('password');
        el?.focus();
      }, 50);
    }
  };

  const handleBack = () => {
    setStep(1);
    setTimeout(() => {
      const el = document.getElementById('email');
      el?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (res?.error) {
      setError(res.error);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <>
      <Head>
        <title>{`${t('login')} - OpenCommerce`}</title>
      </Head>
      <div className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="bg-gray-950/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-wider text-white">OpenCommerce</h1>
            </div>
            {error && <p className="mb-4 text-red-400 text-center text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="relative min-h-[160px] flex items-center">
              <div className={`form-step w-full space-y-6${step === 1 ? '' : ' hidden'}`}> 
                <p className="text-center text-gray-300 text-sm sm:text-base">{t('continueAccess')}</p>
                <div>
                  <label htmlFor="email" className="sr-only">{t('email')}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('email')}
                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400 text-white placeholder-gray-400 transition-all duration-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg shadow-rose-500/30 hover:shadow-rose-400/40 transition-all duration-300 transform hover:scale-102"
                >
                  {t('continue')}
                </button>
              </div>
              <div className={`form-step w-full space-y-6${step === 2 ? '' : ' hidden'}`}> 
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <p className="text-gray-200 text-sm truncate pr-4">{email}</p>
                  <button type="button" onClick={handleBack} className="text-sm text-rose-300 hover:text-white font-semibold flex-shrink-0">{t('change')}</button>
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">{t('password')}</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t('password')}
                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400 text-white placeholder-gray-400 transition-all duration-300"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg shadow-rose-500/30 hover:shadow-rose-400/40 transition-all duration-300 transform hover:scale-102"
                >
                  {t('signIn')}
                </button>
              </div>
            </form>
          </div>
        </div>
        <style jsx>{`
          .form-step {
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
            will-change: transform, opacity;
          }
          .form-step.hidden {
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
            position: absolute;
            width: 100%;
          }
        `}</style>
        <style jsx global>{`
          body::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 50vw;
            height: 50vh;
            background: radial-gradient(circle, rgba(244, 124, 108, 0.15), transparent 70%);
            filter: blur(100px);
            z-index: 0;
            pointer-events: none;
          }
        `}</style>
      </div>
    </>
  );
}
