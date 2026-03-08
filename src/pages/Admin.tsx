import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ToggleLeft, ToggleRight, Check, X, Trash2, Plus, LogOut,
  ClipboardList, Settings, Users, RotateCcw
} from "lucide-react";
import { store, useAppStore, APPLICATION_TYPES, notifyDiscord, notifyDiscordOpenStatus, type Application, type Question, type ApplicationType, type AppStep } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import { toast } from "sonner";

const ADMIN_PASSWORD = "epicrail2024";

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(store.isAdminAuthenticated());
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"dashboard" | "questions" | "review">("dashboard");

  const { config, applications, questions, steps, loading } = useAppStore();

  const [newStep, setNewStep] = useState({ name: "", description: "" });
  const [newQ, setNewQ] = useState<{ label: string; step: number; type: 'text' | 'textarea' | 'select' | 'boolean'; appType: string }>({
    label: "", step: 1, type: "text", appType: "General",
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      store.setAdminAuth(true);
      setAuthenticated(true);
      toast.success("Welcome back, Admin!");
    } else {
      toast.error("Invalid password");
    }
  };

  const toggleRecruitment = () => {
    const isOpening = !config.recruitmentOpen;
    const next = { ...config, recruitmentOpen: isOpening };
    store.setConfig(next);
    toast.success(`Recruitment ${next.recruitmentOpen ? "OPENED" : "CLOSED"}`);

    if (next.discordWebhookUrlOpen) {
      notifyDiscordOpenStatus(
        next.discordWebhookUrlOpen,
        next.discordWebhookMessageIdOpen,
        {
          embeds: [{
            title: `Live Recruitment Status`,
            description: `Application portal is currently **${isOpening ? "OPEN" : "CLOSED"}**.\n\n**Available Positions:**\n${next.openApplicationTypes.length > 0 ? next.openApplicationTypes.map(t => `• ${t}`).join('\n') : "None"}`,
            color: isOpening && next.openApplicationTypes.length > 0 ? 0x00ff00 : 0xff0000,
          }]
        },
        (newId) => {
          const cfgWithId = { ...next, discordWebhookMessageIdOpen: newId };
          store.setConfig(cfgWithId);
        }
      );
    }
  };

  const toggleAppType = (type: ApplicationType) => {
    const current = config.openApplicationTypes || [...APPLICATION_TYPES];
    const isOpening = !current.includes(type);
    const next = isOpening
      ? [...current, type]
      : current.filter((t) => t !== type);
    const updated = { ...config, openApplicationTypes: next };
    store.setConfig(updated);
    toast.success(`${type} applications ${isOpening ? "opened" : "closed"}`);

    if (updated.discordWebhookUrlOpen) {
      notifyDiscordOpenStatus(
        updated.discordWebhookUrlOpen,
        updated.discordWebhookMessageIdOpen,
        {
          embeds: [{
            title: `Live Recruitment Status`,
            description: `Application portal is currently **${updated.recruitmentOpen ? "OPEN" : "CLOSED"}**.\n\n**Available Positions:**\n${next.length > 0 ? next.map(t => `• ${t}`).join('\n') : "None"}`,
            color: updated.recruitmentOpen && next.length > 0 ? 0x00ff00 : 0xff0000,
          }]
        },
        (newId) => {
          const cfgWithId = { ...updated, discordWebhookMessageIdOpen: newId };
          store.setConfig(cfgWithId);
        }
      );
    }
  };

  const handleStatus = async (id: string, status: "Accepted" | "Rejected") => {
    await store.updateApplicationStatus(id, status, applications, config);
    toast.success(`Application ${status.toLowerCase()}`);
  };

  const handleDelete = async (id: string) => {
    await store.deleteApplication(id);
    toast.success("Application deleted");
  };

  const addQuestion = () => {
    if (!newQ.label.trim()) return;
    const q: Question = {
      id: "q-" + Date.now(),
      step: newQ.step,
      label: newQ.label,
      type: newQ.type,
      required: true,
      ...(newQ.appType ? { appType: newQ.appType as ApplicationType } : {}),
    };
    const updated = [...questions, q];
    store.setQuestions(updated);
    setNewQ({ label: "", step: steps[0]?.id || 1, type: "text", appType: "General" });
    toast.success("Question added");
  };

  const removeQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    store.setQuestions(updated);
    toast.success("Question removed");
  };

  const addStep = () => {
    if (!newStep.name.trim()) return;
    const s: AppStep = { id: Date.now(), name: newStep.name, description: newStep.description };
    const updated = [...steps, s];
    store.setSteps(updated);
    if (!newQ.step) setNewQ({ ...newQ, step: s.id });
    setNewStep({ name: "", description: "" });
    toast.success("Step added");
  };

  const removeStep = (id: number) => {
    const updated = steps.filter(s => s.id !== id);
    store.setSteps(updated);
    toast.success("Step removed");
  };

  if (!authenticated) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 max-w-md flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 w-full text-center"
            style={{ background: "hsl(var(--navy) / 0.8)" }}
          >
            <Lock className="w-14 h-14 mx-auto mb-4 text-gold" />
            <h2 className="font-display text-2xl font-bold text-gold-light mb-6">Admin Access</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter password"
              className="w-full rounded-lg border border-border/30 bg-background/10 px-4 py-3 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 mb-4 backdrop-blur-sm"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-lg gradient-gold text-primary-foreground font-bold hover:scale-105 transition-transform"
            >
              Login
            </button>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold font-bold">Loading secure portal...</div>;

  const pending = applications.filter((a) => a.status === "Pending");

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-gradient-gold">Admin Panel</h1>
          <button
            onClick={() => { store.setAdminAuth(false); setAuthenticated(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-crimson/20 text-crimson hover:bg-crimson/30 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "dashboard" as const, icon: Settings, label: "Dashboard" },
            { id: "questions" as const, icon: ClipboardList, label: "Questions" },
            { id: "review" as const, icon: Users, label: `Review (${pending.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id
                ? "gradient-gold text-primary-foreground"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Recruitment Toggle */}
              <div className="glass-card p-8" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h2 className="font-display text-xl font-bold text-gold-light mb-6">Recruitment Status</h2>
                <div className="flex items-center gap-4">
                  <button onClick={toggleRecruitment} className="flex items-center gap-3">
                    {config.recruitmentOpen ? (
                      <ToggleRight className="w-12 h-12 text-emerald" />
                    ) : (
                      <ToggleLeft className="w-12 h-12 text-crimson" />
                    )}
                  </button>
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      {config.recruitmentOpen ? "OPEN" : "CLOSED"}
                    </p>
                    <p className="text-sm text-muted-foreground">Click to toggle recruitment status</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[
                    { label: "Total", val: applications.length, color: "text-gold" },
                    { label: "Pending", val: pending.length, color: "text-gold-light" },
                    { label: "Accepted", val: applications.filter((a) => a.status === "Accepted").length, color: "text-emerald" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-background/10 p-4 text-center">
                      <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Application Type Controls */}
              <div className="glass-card p-8" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h2 className="font-display text-xl font-bold text-gold-light mb-6">Open Application Types</h2>
                <p className="text-sm text-muted-foreground mb-4">Toggle which positions are currently accepting applications</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {APPLICATION_TYPES.map((type) => {
                    const isOpen = (config.openApplicationTypes || []).includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleAppType(type)}
                        className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${isOpen
                          ? "border-gold/50 bg-gold/15 text-white shadow-md shadow-gold/10"
                          : "border-border/30 bg-background/10 text-white/50"
                          }`}
                      >
                        {type}
                        {isOpen ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Results */}
              <div className="glass-card p-8" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h2 className="font-display text-xl font-bold text-gold-light mb-4">Clear Results</h2>
                <p className="text-sm text-muted-foreground mb-4">Remove all accepted and rejected applications from the results page</p>
                <button
                  onClick={async () => {
                    await store.clearResults(applications);
                    toast.success("Results cleared — only pending applications remain");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson/20 border border-crimson/40 text-crimson font-semibold hover:bg-crimson/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Results
                </button>
              </div>

              {/* Webhook Configuration */}
              <div className="glass-card p-6 border border-gold/30 shadow-lg" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h2 className="font-display text-3xl font-black text-gold-light mb-6 text-center">Discord Webhooks</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-lg font-bold text-emerald mb-1 block">Recruitment Status Webhook</label>
                    <p className="text-sm text-foreground/80 mb-2">Triggers when an application is opened/closed.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.discordWebhookUrlOpen || ""}
                        onChange={(e) => {
                          const updated = { ...config, discordWebhookUrlOpen: e.target.value, discordWebhookMessageIdOpen: "" };
                          store.setConfig(updated);
                        }}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full rounded-xl border border-border/30 bg-background/10 px-4 py-2.5 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-emerald/50"
                      />
                      <button
                        onClick={() => {
                          const u = { ...config, discordWebhookMessageIdOpen: "" };
                          store.setConfig(u);
                          toast.success("Webhook Link Reset", { description: "The next Status toggle will post a new embedded message." });
                        }}
                        className="px-4 py-2.5 rounded-xl bg-background/20 border border-border/30 text-white hover:bg-white/10 transition-colors"
                        title="Reset linked message ID"
                      >
                        <RotateCcw className="w-5 h-5 text-emerald" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-lg font-bold text-gold mb-1 block">Results Webhook</label>
                    <p className="text-sm text-foreground/80 mb-2">Triggers when you Accept or Reject an applicant.</p>
                    <input
                      type="text"
                      value={config.discordWebhookUrlResults || ""}
                      onChange={(e) => {
                        const updated = { ...config, discordWebhookUrlResults: e.target.value };
                        store.setConfig(updated);
                      }}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full rounded-xl border border-border/30 bg-background/10 px-4 py-2.5 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Manage Steps */}
              <div className="glass-card p-6" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h3 className="font-display text-lg font-bold text-gold-light mb-4">Form Steps (Pages)</h3>
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex gap-3">
                    <input
                      value={newStep.name}
                      onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                      placeholder="Step Name (e.g. Scenario)"
                      className="w-1/3 rounded-lg border border-border/30 bg-background/10 px-4 py-2.5 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    <input
                      value={newStep.description}
                      onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                      placeholder="Step Description..."
                      className="flex-1 rounded-lg border border-border/30 bg-background/10 px-4 py-2.5 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    <button
                      onClick={addStep}
                      className="px-4 py-2.5 rounded-lg gradient-gold text-black font-semibold hover:scale-105 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {steps.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-background/5 border border-border/10 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">Step {idx + 1}: {s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </div>
                      <button onClick={() => removeStep(s.id)} className="text-crimson hover:bg-crimson/20 p-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Question */}
              <div className="glass-card p-6" style={{ background: "hsl(var(--navy) / 0.6)" }}>
                <h3 className="font-display text-lg font-bold text-gold-light mb-4">Add New Question</h3>
                <div className="flex flex-col gap-3">
                  <input
                    value={newQ.label}
                    onChange={(e) => setNewQ({ ...newQ, label: e.target.value })}
                    placeholder="Question text"
                    className="w-full rounded-lg border border-border/30 bg-background/10 px-4 py-2.5 text-foreground placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={newQ.step}
                      onChange={(e) => setNewQ({ ...newQ, step: Number(e.target.value) })}
                      className="rounded-lg border border-border/30 bg-navy px-3 py-2.5 text-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      {steps.map(s => <option key={s.id} value={s.id} className="bg-navy text-gold-light">{s.name}</option>)}
                    </select>
                    <select
                      value={newQ.type}
                      onChange={(e) => setNewQ({ ...newQ, type: e.target.value as any })}
                      className="rounded-lg border border-border/30 bg-navy px-3 py-2.5 text-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="text" className="bg-navy text-gold-light">Short Text</option>
                      <option value="textarea" className="bg-navy text-gold-light">Long Text</option>
                      <option value="boolean" className="bg-navy text-gold-light">True / False</option>
                    </select>
                    <select
                      value={newQ.appType}
                      onChange={(e) => setNewQ({ ...newQ, appType: e.target.value })}
                      className="rounded-lg border border-border/30 bg-navy px-3 py-2.5 text-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="General" className="bg-navy text-gold-light">General (All Roles)</option>
                      {APPLICATION_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-navy text-gold-light">{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={addQuestion}
                      className="px-4 py-2.5 rounded-lg gradient-gold text-black font-semibold hover:scale-105 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Display Questions by Step */}
              {steps.map((step, idx) => {
                const stepQs = questions.filter((q) => q.step === step.id || q.step === idx + 1); // fallback for original seed
                return (
                  <div key={step.id} className="glass-card p-6" style={{ background: "hsl(var(--navy) / 0.5)" }}>
                    <h3 className="font-display text-md font-bold text-gold-light mb-3">Questions in "{step.name}"</h3>
                    <div className="space-y-2">
                      {stepQs.length === 0 ? <p className="text-sm text-muted-foreground italic">No questions added yet.</p> : null}
                      {stepQs.map((q) => (
                        <div key={q.id} className="flex items-center justify-between rounded-lg bg-background/5 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{q.label}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-navy/50 px-2 py-0.5 rounded text-gold-light border border-gold/20">{q.type}</span>
                              <span className="text-xs bg-navy/50 px-2 py-0.5 rounded text-emerald border border-emerald/20">{q.appType || "General"}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="text-crimson hover:bg-crimson/20 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {pending.length === 0 ? (
                <div className="glass-card p-12 text-center" style={{ background: "hsl(var(--navy) / 0.5)" }}>
                  <p className="text-muted-foreground text-lg">No pending applications 🎉</p>
                </div>
              ) : (
                pending.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    questions={questions}
                    onAccept={() => handleStatus(app.id, "Accepted")}
                    onReject={() => handleStatus(app.id, "Rejected")}
                    onDelete={() => handleDelete(app.id)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

function ApplicationCard({
  app, questions, onAccept, onReject, onDelete,
}: {
  app: Application; questions: Question[];
  onAccept: () => void; onReject: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout className="glass-card p-8 min-h-[160px] border border-gold/40 shadow-xl" style={{ background: "hsl(var(--navy) / 0.9)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-lg text-gold-light">{app.discordUsername}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {app.id} • {app.applicationType} • {new Date(app.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAccept} className="p-2 rounded-lg bg-emerald/20 text-emerald hover:bg-emerald/30 transition-colors" title="Accept">
            <Check className="w-5 h-5" />
          </button>
          <button onClick={onReject} className="p-2 rounded-lg bg-crimson/20 text-crimson hover:bg-crimson/30 transition-colors" title="Reject">
            <X className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg bg-muted/20 text-muted-foreground hover:bg-muted/40 transition-colors" title="Delete">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-gold/70 mt-3 hover:text-gold transition-colors">
        {expanded ? "Hide answers ▲" : "View answers ▼"}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 space-y-3"
          >
            {Object.entries(app.answers).map(([qId, answer]) => {
              const q = questions.find((q) => q.id === qId);
              return (
                <div key={qId} className="rounded-lg bg-background/5 p-3">
                  <p className="text-xs font-medium text-gold-light/70 mb-1">{q?.label || qId}</p>
                  <p className="text-sm text-white font-medium">{answer}</p>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Admin;
