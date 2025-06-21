import { useState } from 'react';
import Layout from '../../components/Layout';
import { PlusIcon } from '../../components/Icons';
import useAutomations, { Automation } from '../../lib/hooks/useAutomations';
import { useI18n } from '../../lib/i18n';

interface Suggestion {
  name: string;
  trigger: string;
  value: string;
  action: string;
}

const suggestions: Suggestion[] = [
  {
    name: 'notifyStockBelow10',
    trigger: 'lowStock',
    value: '10',
    action: 'sendEmail',
  },
  {
    name: 'autoTagOrdersOver100',
    trigger: 'orderCreated',
    value: '100',
    action: 'addTag',
  },
  {
    name: 'dailySalesSummary',
    trigger: 'dailySummary',
    value: '',
    action: 'sendEmail',
  },
  {
    name: 'orderShippedNotification',
    trigger: 'orderShipped',
    value: '',
    action: 'sendEmail',
  },
  {
    name: 'orderDeliveredNotification',
    trigger: 'orderDelivered',
    value: '',
    action: 'sendSms',
  },
];

export default function Automations() {
  const { t } = useI18n();
  const { automations, addAutomation, removeAutomation } = useAutomations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Automation, 'id'>>({
    name: '',
    trigger: 'lowStock',
    value: '',
    action: 'sendEmail',
  });

  const openModal = (preset?: Suggestion) => {
    if (preset) {
      setForm({
        name: t(preset.name),
        trigger: preset.trigger,
        value: preset.value,
        action: preset.action,
      });
    } else {
      setForm({ name: '', trigger: 'lowStock', value: '', action: 'sendEmail' });
    }
    setOpen(true);
  };

  const save = () => {
    addAutomation(form);
    setOpen(false);
  };

  return (
    <Layout title={t('automations')}>
      <h1 className="text-2xl font-bold mb-4">{t('automations')}</h1>
      <p className="mb-4">{t('automationsIntro')}</p>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => openModal(s)}
            className="border border-gray-300 dark:border-gray-600 rounded p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t(s.name)}
          </button>
        ))}
      </div>
      <button
        className="flex items-center px-3 py-2 rounded mb-4 text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
        onClick={() => openModal()}
      >
        <PlusIcon className="w-4 h-4 mr-1" /> {t('addAutomation')}
      </button>
      <ul className="space-y-2">
        {automations.map((a) => (
          <li
            key={a.id}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800"
          >
            <p className="font-medium flex justify-between items-center">
              <span>{a.name}</span>
              <button
                className="text-red-600 hover:underline"
                onClick={() => removeAutomation(a.id)}
              >
                {t('remove')}
              </button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('trigger')}: {t(a.trigger)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('action')}: {t(a.action)} {a.value && `(${a.value})`}
            </p>
          </li>
        ))}
      </ul>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-80 space-y-2">
            <h2 className="text-lg font-semibold mb-2">{t('addAutomation')}</h2>
            <div>
              <label className="block mb-1 text-sm">{t('trigger')}</label>
              <select
                className="border p-1 w-full bg-white dark:bg-gray-700"
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              >
                <option value="lowStock">{t('lowStock')}</option>
                <option value="orderCreated">{t('orderCreated')}</option>
                <option value="orderShipped">{t('orderShipped')}</option>
                <option value="orderDelivered">{t('orderDelivered')}</option>
                <option value="dailySummary">{t('dailySummary')}</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">{t('value')}</label>
              <input
                className="border p-1 w-full bg-white dark:bg-gray-700"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">{t('action')}</label>
              <select
                className="border p-1 w-full bg-white dark:bg-gray-700"
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
              >
                <option value="sendEmail">{t('sendEmail')}</option>
                <option value="addTag">{t('addTag')}</option>
                <option value="syncExternalApi">{t('syncExternalApi')}</option>
                <option value="sendSms">{t('sendSms')}</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button className="px-3 py-1 rounded" onClick={() => setOpen(false)}>
                {t('cancel')}
              </button>
              <button
                className="px-3 py-1 rounded text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400"
                onClick={save}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
