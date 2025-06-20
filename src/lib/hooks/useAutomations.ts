import { useEffect, useState } from 'react';

export interface Automation {
  id: number;
  name: string;
  trigger: string;
  value?: string;
  action: string;
}

export default function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('automations');
    if (stored) {
      try {
        setAutomations(JSON.parse(stored));
      } catch {
        setAutomations([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('automations', JSON.stringify(automations));
  }, [automations]);

  const addAutomation = (a: Omit<Automation, 'id'>) => {
    setAutomations([...automations, { ...a, id: Date.now() }]);
  };

  const removeAutomation = (id: number) => {
    setAutomations(automations.filter((a) => a.id !== id));
  };

  return { automations, addAutomation, removeAutomation };
}
