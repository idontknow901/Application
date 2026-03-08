export type ApplicationType =
  | 'Railway Police Force [Mod]'
  | 'Railway Promotion Board [Public Relation Department]'
  | 'Safety Department [Testing]';

export const APPLICATION_TYPES: ApplicationType[] = [
  'Railway Police Force [Mod]',
  'Railway Promotion Board [Public Relation Department]',
  'Safety Department [Testing]'
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
  appType?: ApplicationType | 'General'; // if set, only shown for this app type (step 2 questions), 'General' for all
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

const DEFAULT_STEPS: AppStep[] = [
  { id: 1, name: "Discord Info & Role", description: "Basic details about you" },
  { id: 2, name: "Questions", description: "Role-specific and general questions" },
];
const DEFAULT_QUESTIONS: Question[] = [
  // General
  { id: 'q1', step: 1, label: 'What is your Discord Username?', type: 'text', required: true, appType: 'General' },
  { id: 'q2', step: 1, label: 'What is your Discord User ID?', type: 'text', required: true, appType: 'General' },
  { id: 'q-reason', step: 2, label: 'Why do you want to join this department?', type: 'textarea', required: true, appType: 'General' },
];

const STORAGE_KEYS = {
  config: 'epic-rail-config',
  applications: 'epic-rail-applications',
  questions: 'epic-rail-questions',
  steps: 'epic-rail-steps',
  adminAuth: 'epic-rail-admin-auth',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_CONFIG: AppConfig = {
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

export const store = {
  getConfig: (): AppConfig => {
    const cfg = getItem(STORAGE_KEYS.config, DEFAULT_CONFIG);
    // Migration: ensure openApplicationTypes exists
    if (!cfg.openApplicationTypes) {
      cfg.openApplicationTypes = [...APPLICATION_TYPES];
    } else {
      cfg.openApplicationTypes = cfg.openApplicationTypes.filter(t => APPLICATION_TYPES.includes(t as any));
    }
    if (typeof cfg.discordWebhookUrlResults !== "string") {
      cfg.discordWebhookUrlResults = "";
    }
    if (typeof cfg.discordWebhookUrlOpen !== "string") {
      cfg.discordWebhookUrlOpen = "";
    }
    if (typeof cfg.discordWebhookMessageIdOpen !== "string") {
      cfg.discordWebhookMessageIdOpen = "";
    }
    return cfg;
  },
  setConfig: (config: AppConfig) => setItem(STORAGE_KEYS.config, config),

  getSteps: (): AppStep[] => getItem(STORAGE_KEYS.steps, DEFAULT_STEPS),
  setSteps: (s: AppStep[]) => setItem(STORAGE_KEYS.steps, s),

  getQuestions: (): Question[] => getItem(STORAGE_KEYS.questions, DEFAULT_QUESTIONS),
  setQuestions: (q: Question[]) => setItem(STORAGE_KEYS.questions, q),

  getApplications: (): Application[] => getItem(STORAGE_KEYS.applications, []),

  addApplication: (app: Omit<Application, 'id' | 'status' | 'submittedAt'>): Application => {
    const apps = store.getApplications();
    const newApp: Application = {
      ...app,
      id: 'APP-' + Date.now().toString(36).toUpperCase(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    apps.push(newApp);
    setItem(STORAGE_KEYS.applications, apps);
    return newApp;
  },

  updateApplicationStatus: (id: string, status: 'Accepted' | 'Rejected') => {
    const apps = store.getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx].status = status;
      setItem(STORAGE_KEYS.applications, apps);

      const cfg = store.getConfig();
      if (cfg.discordWebhookUrlResults) {
        const accepted = apps.filter(a => a.status === 'Accepted').length;
        const rejected = apps.filter(a => a.status === 'Rejected').length;
        const pending = apps.filter(a => a.status === 'Pending').length;

        notifyDiscord(cfg.discordWebhookUrlResults, {
          embeds: [{
            title: `Application ${status}`,
            description: `**${apps[idx].discordUsername}** has been **${status.toLowerCase()}** for the **${apps[idx].applicationType}** role.\n\n**Current Stats:**\n✅ Accepted: ${accepted}\n❌ Rejected: ${rejected}\n⏳ Pending: ${pending}`,
            color: status === 'Accepted' ? 0x00ff00 : 0xff0000,
          }]
        });
      }
    }
  },

  deleteApplication: (id: string) => {
    const apps = store.getApplications().filter(a => a.id !== id);
    setItem(STORAGE_KEYS.applications, apps);
  },

  clearResults: () => {
    const apps = store.getApplications().filter(a => a.status === 'Pending');
    setItem(STORAGE_KEYS.applications, apps);
  },

  findApplication: (query: string): Application | undefined => {
    const apps = store.getApplications();
    return apps.find(a => a.id === query || a.discordUsername.toLowerCase() === query.toLowerCase());
  },

  isAdminAuthenticated: (): boolean => {
    return sessionStorage.getItem(STORAGE_KEYS.adminAuth) === 'true';
  },
  setAdminAuth: (val: boolean) => {
    if (val) sessionStorage.setItem(STORAGE_KEYS.adminAuth, 'true');
    else sessionStorage.removeItem(STORAGE_KEYS.adminAuth);
  },
};
