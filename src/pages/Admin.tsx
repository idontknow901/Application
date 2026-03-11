import { useState, useMemo, useEffect, useRef } from "react";

import {
  Lock, ToggleLeft, ToggleRight, Check, X, Trash2, Plus, LogOut,
  ClipboardList, Settings, Users, RotateCcw, ArrowLeft, ChevronRight,
  Briefcase
} from "lucide-react";
import { store, useAppStore, APPLICATION_TYPES, type Application, type Question, type ApplicationType, type AppStep, notifyDiscord, logAdminAction } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import { toast } from "sonner";

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(store.isAdminAuthenticated());
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"dashboard" | "questions" | "review">("dashboard");
  const [selectedAppType, setSelectedAppType] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<string>("All");
  const [adminName, setAdminName] = useState(() => sessionStorage.getItem("epic-rail-admin-name") || "");

  const { config, applications, questions, steps, loading } = useAppStore(true);

  const [newStep, setNewStep] = useState<{ name: string; description: string; appType: ApplicationType }>({ name: "", description: "", appType: APPLICATION_TYPES[0] });
  const [newQ, setNewQ] = useState<{ label: string; step: number; type: 'text' | 'textarea' | 'select' | 'boolean' }>({
    label: "", step: 1, type: "text"
  });

  const [logSessionId, setLogSessionId] = useState(() => sessionStorage.getItem("epic-rail-log-session-id") || "");
  const [logHistory, setLogHistory] = useState<string[]>(() => {
    const saved = sessionStorage.getItem("epic-rail-log-history");
    return saved ? JSON.parse(saved) : [];
  });

  const statusMessageIdRef = useRef<string>("");

  useEffect(() => {
    if (config.discordWebhookMessageIdOpen) {
      statusMessageIdRef.current = config.discordWebhookMessageIdOpen;
    }
  }, [config.discordWebhookMessageIdOpen]);

  const triggerLog = async (action: string, details: string) => {
    const time = new Date().toLocaleTimeString();
    const entry = `• [${time}] **${action}**: ${details}`;
    const newHistory = [...logHistory, entry];
    setLogHistory(newHistory);
    sessionStorage.setItem("epic-rail-log-history", JSON.stringify(newHistory));

    await logAdminAction(
      "Activity",
      newHistory.join('\n'),
      adminName || "Administrator",
      logSessionId,
      (id) => {
        setLogSessionId(id);
        sessionStorage.setItem("epic-rail-log-session-id", id);
      }
    );
  };

  useEffect(() => {
    if (authenticated && !logSessionId && adminName) {
      triggerLog("Admin Joined", "Panel accessed and session started.");
    }
  }, [authenticated]);

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        // Reset log session on fresh login
        sessionStorage.removeItem("epic-rail-log-session-id");
        sessionStorage.removeItem("epic-rail-log-history");
        setLogSessionId("");
        setLogHistory([]);

        store.setAdminAuth(true);
        setAuthenticated(true);
        toast.success("Welcome back, Admin!");
        // triggerLog will be handled by useEffect
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      toast.error("Login service unavailable");
    }
  };
  const isSyncingRef = useRef(false);
  const syncDiscordStatus = async (updatedConfig: typeof config) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    
    const isGlobalOpen = updatedConfig.recruitmentOpen;
    const openTypes = updatedConfig.openApplicationTypes || [];
    const messageId = statusMessageIdRef.current || updatedConfig.discordWebhookMessageIdOpen;

    const statusText = APPLICATION_TYPES.map(type => {
      const isOpen = isGlobalOpen && openTypes.includes(type);
      const circle = isOpen ? "🟢" : "🔴";
      const status = isOpen ? "**OPEN**" : "**CLOSED**";
      
      const firstStep = steps.find(s => s.appType === type);
      const stepText = firstStep ? `\n      •  Starting Step: **${firstStep.name}**` : "";
      
      return `•  ${circle} **${type}**\n      •  Status: ${status}${stepText}`;
    }).join('\n\n');

    const payload = {
      embeds: [{
        title: "📢 Official Recruitment Status: EROI",
        description: `**Epic Rails of India | Recruitment Hub**\n\n**📋 Current Vacancies**\n\n${statusText}`,
        color: isGlobalOpen ? 0x00ff00 : 0xff0000,
        image: {
          url: updatedConfig.statusImageUrl || "https://raw.githubusercontent.com/idontknow901/Application/main/public/placeholder.svg"
        },
        timestamp: new Date().toISOString(),
        footer: { text: "EROI Recruitment Management System" }
      }]
    };

    try {
      console.log("🔄 Syncing Discord status. ID:", messageId);
      await notifyDiscord('open', payload, messageId, async (id) => {
        if (id && id !== statusMessageIdRef.current) {
          console.log("📝 Captured New Status ID:", id);
          statusMessageIdRef.current = id;
          await store.setConfig({ ...updatedConfig, discordWebhookMessageIdOpen: id });
        }
      });
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const toggleRecruitment = async () => {
    const isOpening = !config.recruitmentOpen;
    const next = { ...config, recruitmentOpen: isOpening };
    await store.setConfig(next);
    toast.success(`Recruitment ${next.recruitmentOpen ? "OPENED" : "CLOSED"}`);
    syncDiscordStatus(next);
    triggerLog("Toggle Recruitment", `Global recruitment status changed to **${next.recruitmentOpen ? "OPEN" : "CLOSED"}**`);
  };

  const toggleAppType = async (type: ApplicationType) => {
    const currentList = config.openApplicationTypes || [...APPLICATION_TYPES];
    const isOpening = !currentList.includes(type);
    const nextList = isOpening
      ? [...currentList, type]
      : currentList.filter((t) => t !== type);

    const updated = { ...config, openApplicationTypes: nextList };
    await store.setConfig(updated);
    toast.success(`${type} applications ${isOpening ? "opened" : "closed"}`);
    syncDiscordStatus(updated);
    triggerLog("Toggle Role Recruitment", `Recruitment for **${type}** was **${isOpening ? "OPENED" : "CLOSED"}**`);
  };

  const updateStatusImage = async (url: string) => {
    const updated = { ...config, statusImageUrl: url };
    await store.setConfig(updated);
    toast.success("Status embed image updated");
    syncDiscordStatus(updated);
    triggerLog("Update Status Image", `Admin updated the recruitment status image URL to: ${url}`);
  };

  const handleStatus = async (app: Application, status: "Accepted" | "Rejected") => {
    await store.updateApplicationStatus(app.id, status, applications);
    toast.success(`Application ${status.toLowerCase()}`);
    triggerLog(`Application ${status}`, `Admin ${status.toLowerCase()}ed application **${app.id}** (${app.discordUsername})`);
  };

  const handleDelete = async (id: string) => {
    await store.deleteApplication(id);
    toast.success("Application deleted");
  };

  const addQuestion = () => {
    if (!newQ.label.trim() || !selectedAppType) return;
    const q: Question = {
      id: "q-" + Date.now(),
      step: newQ.step,
      label: newQ.label,
      type: newQ.type,
      required: true,
      appType: selectedAppType as ApplicationType,
    };
    const updated = [...questions, q];
    store.setQuestions(updated);
    setNewQ({ label: "", step: steps[0]?.id || 1, type: "text" });
    toast.success("Question added");
    triggerLog("Question Added", `Added new question to **${selectedAppType}**: "${q.label}"`);
  };

  const removeQuestion = (id: string) => {
    const q = questions.find(q => q.id === id);
    const updated = questions.filter((q) => q.id !== id);
    store.setQuestions(updated);
    toast.success("Question removed");
    if (q) triggerLog("Question Removed", `Removed question from **${q.appType}**: "${q.label}"`);
  };

  const addStep = () => {
    if (!newStep.name.trim() || !selectedAppType) return;
    const s: AppStep = { 
      id: Date.now(), 
      name: newStep.name, 
      description: newStep.description,
      appType: selectedAppType as ApplicationType 
    };
    const updated = [...steps, s];
    store.setSteps(updated);
    
    // Auto-select the newly created step for adding questions
    setNewQ(prev => ({ ...prev, step: s.id }));
    
    setNewStep({ name: "", description: "", appType: selectedAppType as ApplicationType });
    toast.success("Step added");
    triggerLog("Step Added", `Added new step: **${s.name}** to **${selectedAppType}**`);
  };

  const removeStep = (id: number) => {
    const s = steps.find(s => s.id === id);
    const updated = steps.filter(s => s.id !== id);
    store.setSteps(updated);
    
    // If the removed step was selected in newQ, reset it
    if (newQ.step === id) {
      const nextStep = updated.find(st => st.appType === selectedAppType);
      setNewQ(prev => ({ ...prev, step: nextStep?.id || 1 }));
    }
    
    toast.success("Step removed");
    if (s) triggerLog("Step Removed", `Removed step: **${s.name}**`);
  };

  // Update newQ and newStep when selectedAppType changes
  useEffect(() => {
    if (selectedAppType) {
      const firstStep = steps.find(s => s.appType === selectedAppType);
      setNewQ(prev => ({ ...prev, step: firstStep?.id || 1 }));
      setNewStep(prev => ({ ...prev, appType: selectedAppType as ApplicationType }));
    }
  }, [selectedAppType, steps]);

  const pending = applications.filter((a) => a.status === "Pending");
  const filteredPending = reviewFilter === "All" ? pending : pending.filter(a => a.applicationType === reviewFilter);

  if (!authenticated) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 max-w-full sm:max-w-md flex items-center justify-center min-h-[60vh] py-10">
          <div
            className="glass-card p-6 sm:p-10 w-full text-center max-w-full overflow-hidden"
            style={{ background: "hsl(var(--card) / 0.8)" }}
          >
            <Lock className="w-14 h-14 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl font-bold text-primary mb-6">Admin Access</h2>
            <input
              type="text"
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value);
                sessionStorage.setItem("epic-rail-admin-name", e.target.value);
              }}
              placeholder="Your Name (for logs)"
              className="w-full rounded-lg border border-border/30 bg-background/50 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 backdrop-blur-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter password"
              className="w-full rounded-lg border border-border/30 bg-background/50 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 backdrop-blur-sm"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform truncate"
            >
              Login
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-full sm:max-w-5xl py-6 min-h-[100vh] [overflow-y:overlay] z-10 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="font-display text-3xl font-bold text-primary drop-shadow-sm text-center sm:text-left w-full sm:w-auto">Admin Panel</h1>
          <button
            onClick={() => { 
              store.setAdminAuth(false); 
              setAuthenticated(false);
              sessionStorage.removeItem("epic-rail-log-session-id");
              sessionStorage.removeItem("epic-rail-log-history");
              setLogSessionId("");
              setLogHistory([]);
            }}
            className="flex items-center gap-2 px-4 py-2 botghost-btn !text-red-400 !border-red-500/30 w-full sm:w-auto justify-center"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide mb-8">
          <div className="flex gap-2 min-w-max">
            {[
              { id: "dashboard" as const, icon: Settings, label: "Dashboard" },
              { id: "questions" as const, icon: ClipboardList, label: "Questions" },
              { id: "review" as const, icon: Users, label: `Review (${pending.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelectedAppType(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-[8px] text-[11px] font-bold uppercase transition-all border ${tab === t.id
                  ? "bg-[#161920] text-primary border-[#1e232b]"
                  : "bg-transparent text-muted-foreground hover:bg-[#161920] border-transparent hover:border-[#1e232b]"
                  }`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full">
          {tab === "dashboard" && (
            <div
              key="dashboard"
              className="space-y-6 w-full"
            >
              <div className="glass-card p-6 sm:p-8" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h2 className="font-display text-xl font-bold text-primary mb-6">Recruitment Status</h2>
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={toggleRecruitment} className="flex items-center gap-3">
                    {config.recruitmentOpen ? (
                      <ToggleRight className="w-12 h-12 text-emerald" />
                    ) : (
                      <ToggleLeft className="w-12 h-12 text-muted-foreground" />
                    )}
                  </button>
                  <div className="overflow-hidden">
                    <p className={`font-bold text-lg ${config.recruitmentOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                      {config.recruitmentOpen ? "LIVE" : "OFFLINE"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">Click to toggle recruitment</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {[
                    { label: "Total", val: applications.length, color: "text-primary border-primary/30" },
                    { label: "Pending", val: pending.length, color: "text-blue border-blue/30" },
                    { label: "Accepted", val: applications.filter((a) => a.status === "Accepted").length, color: "text-emerald border-emerald/30" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl bg-background/50 border p-4 sm:p-6 text-center shadow-inner ${s.color}`}>
                      <p className={`text-3xl md:text-4xl font-black ${s.color.split(' ')[0]}`}>{s.val}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 sm:p-8" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h2 className="font-display text-xl font-bold text-primary mb-6">Open Application Types</h2>
                <p className="text-sm text-muted-foreground mb-4">Toggle which positions are currently accepting applications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {APPLICATION_TYPES.map((type) => {
                    const isOpen = (config.openApplicationTypes || []).includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleAppType(type)}
                        className={`flex items-center justify-between gap-2 px-4 py-4 rounded-xl text-sm font-semibold transition-all border ${isOpen
                          ? "border-primary/50 bg-primary/10 text-primary shadow-md shadow-primary/10"
                          : "border-border/30 bg-background/30 text-muted-foreground"
                          }`}
                      >
                        <span className="truncate">{type}</span>
                        {isOpen ? (
                          <ToggleRight className="w-6 h-6 shrink-0" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6 sm:p-8" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h2 className="font-display text-xl font-bold text-primary mb-4">Database Maintenance</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">Clear all accepted and rejected applications from the results page.</p>
                    <button
                      onClick={async () => {
                        await store.clearResults(applications);
                        toast.success("Results cleared — only pending applications remain");
                        triggerLog("Clear Results", "Admin cleared all accepted/rejected applications from the results page.");
                      }}
                      className="flex items-center gap-2 px-5 py-3 botghost-btn !text-red-400 !border-red-500/30 w-full sm:w-auto justify-center"
                    >
                      <Trash2 className="w-5 h-5 shrink-0" /> Clear All Results
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">Push default configuration, steps, and questions to the database.</p>
                    <button
                      onClick={async () => {
                        await store.syncSettings();
                        toast.success("Settings synchronized with database");
                        triggerLog("Sync Database", "Admin re-synchronized the database with default settings.");
                      }}
                      className="flex items-center gap-2 px-5 py-3 botghost-btn !text-emerald-400 !border-emerald-500/30 w-full sm:w-auto justify-center"
                    >
                      <RotateCcw className="w-5 h-5 shrink-0" /> Sync Database
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration - Secure Mode */}
              <div className="glass-card p-6 border border-emerald/30 shadow-lg" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h2 className="font-display text-2xl font-black text-emerald mb-4 text-center">Managed Security</h2>
                <p className="text-sm text-center text-muted-foreground mb-6">
                  Discord webhooks and API keys are now managed securely via **environment variables**.
                  They are hidden from the public and cannot be intercepted.
                </p>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                    <label className="text-base font-bold text-primary block mb-2">Status Embed Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={config.statusImageUrl}
                        onBlur={(e) => updateStatusImage(e.target.value)}
                        placeholder="Paste image URL (Discord, Imgur, etc.)"
                        className="flex-1 rounded-lg border border-border/30 bg-background/50 px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Changes are applied immediately to the persistent Discord message.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-base font-bold text-emerald block">Status Webhook</label>
                        <p className="text-xs text-foreground/70">Managed in server settings</p>
                      </div>
                      <button
                        onClick={() => {
                          store.setConfig({ ...config, discordWebhookMessageIdOpen: "" });
                          toast.success("Status Link Reset", { description: "The next toggle will post a new embed." });
                        }}
                        className="p-2.5 botghost-btn"
                        title="Reset linked message ID"
                      >
                        <RotateCcw className="w-5 h-5 text-emerald" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                    <label className="text-base font-bold text-primary block">Results Webhook</label>
                    <p className="text-xs text-foreground/70">Managed in server settings</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "questions" && !selectedAppType && (
            <div
              key="questions-list"
              className="space-y-6 w-full"
            >
              <div className="glass-card p-6" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h3 className="font-display text-xl font-bold text-primary mb-6">Question Categories</h3>
                <p className="text-sm text-muted-foreground mb-6">Select a category to view, add, or edit its questions.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {APPLICATION_TYPES.map((type) => {
                    const qCount = questions.filter(q => q.appType === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedAppType(type)}
                        className="group flex flex-col p-6 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all text-left relative overflow-hidden h-full"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5 text-blue" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            {qCount} {qCount === 1 ? 'Ques' : 'Qns'}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-foreground text-lg mb-1 relative z-10">{type}</h4>
                        <p className="text-sm text-muted-foreground mt-auto relative z-10">Manage questions for {type.toLowerCase()}</p>
                        <div className="absolute right-4 bottom-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {tab === "questions" && selectedAppType && (
            <div
              key="questions-detail"
              className="space-y-6 w-full"
            >
              <button
                onClick={() => setSelectedAppType(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium w-full max-w-max"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Categories
              </button>

              <div className="glass-card p-5" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h3 className="font-display text-lg font-bold text-primary mb-2">Form Steps (Pages)</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Manage pages for {selectedAppType}.</p>
                <div className="flex flex-col gap-3 mb-4 relative z-10 font-bold">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      value={newStep.name}
                      onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                      placeholder="Step Name"
                      className="w-full md:w-1/3 rounded-lg border border-border/30 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      value={newStep.description}
                      onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                      placeholder="Description..."
                      className="w-full md:flex-1 rounded-lg border border-border/30 bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={addStep}
                      className="px-4 py-2 shrink-0 botghost-btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  {steps.filter(s => s.appType === selectedAppType).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                      </div>
                      <button onClick={() => removeStep(s.id)} className="shrink-0 text-red-400 hover:bg-red-500/20 p-1.5 rounded transition-colors bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5" style={{ background: "hsl(var(--card) / 0.8)" }}>
                <h3 className="font-display text-lg font-bold text-primary mb-2">Add New Question</h3>
                <p className="text-[11px] text-muted-foreground mb-4">Create questions for {selectedAppType}. Each question must belong to a step above.</p>
                <div className="flex flex-col gap-3">
                  <input
                    value={newQ.label}
                    onChange={(e) => setNewQ({ ...newQ, label: e.target.value })}
                    placeholder="Question text"
                    className="w-full rounded-lg border border-border/30 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={newQ.step}
                      onChange={(e) => setNewQ({ ...newQ, step: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border/30 bg-background/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="1" disabled={steps.some(s => s.id === 1)}>Select a step...</option>
                      {steps.filter(s => s.appType === selectedAppType).map(s => <option key={s.id} value={s.id} className="bg-card">{s.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <select
                        value={newQ.type}
                        onChange={(e) => setNewQ({ ...newQ, type: e.target.value as any })}
                        className="w-full rounded-lg border border-border/30 bg-background/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                      >
                        <option value="text" className="bg-card">Short Text</option>
                        <option value="textarea" className="bg-card">Long Text</option>
                        <option value="boolean" className="bg-card">True / False</option>
                      </select>
                      <button
                        onClick={addQuestion}
                        className="px-5 py-2.5 shrink-0 botghost-btn-primary shadow-none text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions mapping for specific selected role */}
              {steps.map((step, idx) => {
                const stepQs = questions.filter((q) => (q.step === step.id || q.step === idx + 1) && q.appType === selectedAppType);
                if (stepQs.length === 0) return null;

                return (
                  <div key={step.id} className="glass-card p-6" style={{ background: "hsl(var(--card) / 0.5)" }}>
                    <h3 className="font-display text-lg font-bold text-primary mb-4">Step: {step.name}</h3>
                    <div className="space-y-3">
                      {stepQs.map((q) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-background/40 border border-border/20 px-5 py-4">
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{q.label}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary border border-primary/20">{q.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="self-end sm:self-auto shrink-0 text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors bg-red-500/10"
                            title="Delete specific question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "review" && (
            <div
              key="review"
              className="space-y-6 w-full"
            >
              {/* Review Filter Bar */}
              <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                  {["All", ...APPLICATION_TYPES].map(type => {
                    const count = type === "All" ? pending.length : pending.filter(a => a.applicationType === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => setReviewFilter(type)}
                        className={`px-4 py-2 rounded-[8px] text-xs font-bold uppercase transition-all border ${reviewFilter === type
                          ? "bg-[#161920] border-[#1e232b] text-primary"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-[#161920] hover:border-[#1e232b]"
                          }`}
                      >
                        {type} <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  {filteredPending.length === 0 ? (
                    <div
                      className="glass-card p-12 text-center" style={{ background: "hsl(var(--card) / 0.5)" }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <Check className="w-8 h-8" />
                      </div>
                      <p className="text-muted-foreground font-medium text-lg">No pending applications for {reviewFilter} 🎉</p>
                    </div>
                  ) : (
                    filteredPending.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        questions={questions}
                        onAccept={() => handleStatus(app, "Accepted")}
                        onReject={() => handleStatus(app, "Rejected")}
                        onDelete={() => handleDelete(app.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
    <div
      className="glass-card p-6 sm:p-8 min-h-[160px] border border-primary/20 shadow-xl overflow-hidden relative"
      style={{ background: "hsl(var(--card) / 0.9)" }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10 w-full overflow-hidden">
        <div className="overflow-hidden min-w-0">
          <p className="font-sans text-xl font-bold text-foreground mb-1 truncate">{app.discordUsername}</p>
          <div className="flex flex-wrap gap-2 text-xs font-mono mb-2">
            <span className="px-2 py-0.5 rounded bg-background/50 text-muted-foreground border border-border/50 truncate">ID: {app.id.substring(0, 8)}</span>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{app.applicationType}</span>
            <span className="px-2 py-0.5 rounded bg-background/50 text-muted-foreground border border-border/50">{new Date(app.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0 w-full sm:w-auto overflow-hidden">
          <button onClick={onAccept} className="flex-1 sm:flex-none p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-emerald hover:bg-emerald/20 transition-all flex justify-center items-center" title="Accept">
            <Check className="w-5 h-5" />
          </button>
          <button onClick={onReject} className="flex-1 sm:flex-none p-3 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson hover:bg-crimson/20 transition-all flex justify-center items-center" title="Reject">
            <X className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-3 rounded-xl bg-background/50 border border-border/50 text-muted-foreground hover:bg-background/80 transition-all flex justify-center items-center" title="Delete">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 py-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors border border-border/20 z-10 relative"
      >
        {expanded ? "Collapse Responses" : "Expand Responses"}
      </button>
      <div className="relative w-full">
        {expanded && (
          <div
            className="overflow-hidden space-y-3 relative z-10"
          >
            <div className="pt-4 space-y-3">
              {Object.entries(app.answers).map(([qId, answer]) => {
                const q = questions.find((q) => q.id === qId);
                return (
                  <div key={qId} className="rounded-xl bg-background/30 border border-border/20 p-4">
                    <p className="text-xs font-semibold text-primary/70 mb-2 uppercase tracking-wide">{q?.label || qId}</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{answer}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
