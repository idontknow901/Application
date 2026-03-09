import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, collection, onSnapshot, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

export type ApplicationType =
  | 'Driver'
  | 'Guard'
  | 'Dispatcher'
  | 'Station Master'
  | 'Signaller';

export const APPLICATION_TYPES: ApplicationType[] = [
  'Driver',
  'Guard',
  'Dispatcher',
  'Station Master',
  'Signaller'
];

export interface AppStep {
  id: number;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  step: number;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  appType?: ApplicationType | 'General';
}

export interface Application {
  id: string;
  discordUsername: string;
  discordUserId: string;
  applicationType: ApplicationType;
  answers: Record<string, string>;
  status: 'Pending' | 'Accepted' | 'Rejected';
  submittedAt: string;
}

export interface AppConfig {
  recruitmentOpen: boolean;
  openApplicationTypes: ApplicationType[];
  discordWebhookUrlResults?: string;
  discordWebhookUrlOpen?: string;
  discordWebhookMessageIdOpen?: string;
}

export const DEFAULT_STEPS: AppStep[] = [
  { id: 1, name: "Discord Info & Role", description: "Basic details about you" },
  { id: 2, name: "Questions", description: "Role-specific and general questions" },
];
export const DEFAULT_QUESTIONS: Question[] = [];

export const DEFAULT_CONFIG: AppConfig = {
  recruitmentOpen: true,
  openApplicationTypes: [...APPLICATION_TYPES],
  discordWebhookUrlResults: "",
  discordWebhookUrlOpen: "",
  discordWebhookMessageIdOpen: "",
};

export const notifyDiscord = async (url: string, payload: any) => {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to trigger webhook", error);
  }
};

export const notifyDiscordOpenStatus = async (
  url: string,
  messageId: string | undefined,
  payload: any,
  onNewMessageId?: (id: string) => void
) => {
  if (!url) return;
  try {
    if (messageId) {
      await fetch(`${url}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      const res = await fetch(`${url}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && onNewMessageId) {
        const data = await res.json();
        if (data.id) onNewMessageId(data.id);
      }
    }
  } catch (error) {
    console.error("Failed to trigger webhook status", error);
  }
};

export function useAppStore() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [steps, setSteps] = useState<AppStep[]>(DEFAULT_STEPS);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let componentsLoaded = 0;
    const checkDone = () => {
      componentsLoaded++;
      if (componentsLoaded >= 4) {
        setLoading(false);
      }
    };

    const unsubConfig = onSnapshot(doc(db, "settings", "config"), (docSn) => {
      if (docSn.exists()) {
        const data = docSn.data() as AppConfig;
        if (!data.openApplicationTypes) data.openApplicationTypes = [...APPLICATION_TYPES];
        setConfig(data);
      } else {
        setDoc(doc(db, "settings", "config"), DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
      }
      checkDone();
    });

    const unsubSteps = onSnapshot(doc(db, "settings", "steps"), (docSn) => {
      if (docSn.exists()) setSteps(docSn.data()?.items || DEFAULT_STEPS);
      else { setDoc(doc(db, "settings", "steps"), { items: DEFAULT_STEPS }); setSteps(DEFAULT_STEPS); }
      checkDone();
    });

    const unsubQ = onSnapshot(doc(db, "settings", "questions"), (docSn) => {
      if (docSn.exists()) setQuestions(docSn.data()?.items || DEFAULT_QUESTIONS);
      else { setDoc(doc(db, "settings", "questions"), { items: DEFAULT_QUESTIONS }); setQuestions(DEFAULT_QUESTIONS); }
      checkDone();
    });

    const unsubApps = onSnapshot(collection(db, "applications"), (snap) => {
      const apps: Application[] = [];
      snap.forEach(d => apps.push(d.data() as Application));
      setApplications(apps);
      checkDone();
    });

    return () => { unsubConfig(); unsubSteps(); unsubQ(); unsubApps(); };
  }, []);

  return { config, steps, questions, applications, loading };
}

export const store = {
  isAdminAuthenticated: (): boolean => {
    return sessionStorage.getItem('epic-rail-admin-auth') === 'true';
  },
  setAdminAuth: (val: boolean) => {
    if (val) sessionStorage.setItem('epic-rail-admin-auth', 'true');
    else sessionStorage.removeItem('epic-rail-admin-auth');
  },
  setConfig: async (config: AppConfig) => {
    await setDoc(doc(db, "settings", "config"), config);
  },
  setSteps: async (items: AppStep[]) => {
    await setDoc(doc(db, "settings", "steps"), { items });
  },
  setQuestions: async (items: Question[]) => {
    await setDoc(doc(db, "settings", "questions"), { items });
  },
  addApplication: async (app: Omit<Application, 'id' | 'status' | 'submittedAt'>): Promise<Application> => {
    const id = 'APP-' + Date.now().toString(36).toUpperCase();
    const newApp: Application = {
      ...app,
      id,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "applications", id), newApp);
    return newApp;
  },
  updateApplicationStatus: async (id: string, status: 'Accepted' | 'Rejected', apps: Application[], config: AppConfig) => {
    await updateDoc(doc(db, "applications", id), { status });
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1 && config.discordWebhookUrlResults) {
      const accepted = apps.filter(a => a.status === 'Accepted').length + (status === 'Accepted' ? 1 : 0) - (apps[idx].status === 'Accepted' ? 1 : 0);
      const rejected = apps.filter(a => a.status === 'Rejected').length + (status === 'Rejected' ? 1 : 0) - (apps[idx].status === 'Rejected' ? 1 : 0);
      const pending = apps.filter(a => a.status === 'Pending').length - (apps[idx].status === 'Pending' ? 1 : 0);

      notifyDiscord(config.discordWebhookUrlResults, {
        embeds: [{
          title: `Application ${status}`,
          description: `**${apps[idx].discordUsername}** has been **${status.toLowerCase()}** for the **${apps[idx].applicationType}** role.\n\n**Current Stats:**\n✅ Accepted: ${accepted}\n❌ Rejected: ${rejected}\n⏳ Pending: ${pending}`,
          color: status === 'Accepted' ? 0x00ff00 : 0xff0000,
        }]
      });
    }
  },
  deleteApplication: async (id: string) => {
    await deleteDoc(doc(db, "applications", id));
  },
  clearResults: async (apps: Application[]) => {
    const toDelete = apps.filter(a => a.status !== 'Pending');
    for (const app of toDelete) {
      await deleteDoc(doc(db, "applications", app.id));
    }
  }
};
