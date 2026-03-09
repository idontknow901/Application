import { useState, useMemo } from "react";
import {
  Lock, Check, X, Trash2, Plus, LogOut,
  ClipboardList, Settings, Users, RotateCcw, ChevronLeft
} from "lucide-react";
import { store, useAppStore, APPLICATION_TYPES, notifyDiscordOpenStatus, type Application, type Question, type ApplicationType, type AppStep } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import { toast } from "sonner";

// Client-side portable hash to avoid HTTPS crypto.subtle requirement on mobile/local dev
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

const verifyPassword = async (input: string) => {
  // Hash for "epicrail2024"
  return simpleHash(input) === "-1133285993";
};

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(store.isAdminAuthenticated());
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"dashboard" | "questions" | "review">("dashboard");

  const { config, applications, questions, steps, loading } = useAppStore();

  const [newStep, setNewStep] = useState({ name: "", description: "" });
  const [newQ, setNewQ] = useState<{ label: string; step: number; type: 'text' | 'textarea' | 'select' | 'boolean' }>({
    label: "", step: 1, type: "text",
  });

  // Dedicated question page state
  const [selectedRoleForQs, setSelectedRoleForQs] = useState<ApplicationType | null>(null);

  // Review filter state
  const [reviewFilter, setReviewFilter] = useState<"All" | ApplicationType>("All");

  const handleLogin = async () => {
    const isValid = await verifyPassword(password);
    if (isValid) {
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
    if (!newQ.label.trim() || !selectedRoleForQs) return;
    const q: Question = {
      id: "q-" + Date.now(),
      step: newQ.step || (steps[0] ? steps[0].id : 1),
      label: newQ.label,
      type: newQ.type,
      required: true,
      appType: selectedRoleForQs,
    };
    const updated = [...questions, q];
    store.setQuestions(updated);
    setNewQ({ label: "", step: steps[0]?.id || 1, type: "text" });
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
          <div className="glass-card p-10 w-full text-center bg-card/80">
            <Lock className="w-14 h-14 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl font-bold text-primary mb-6">Admin Access</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter password"
              className="w-full rounded-md border border-[#1e232b] bg-[#161920] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-md bg-primary hover:brightness-110 active:scale-[0.98] outline-primary text-white font-semibold uppercase transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary font-bold">Loading secure portal...</div>;

  const pending = applications.filter((a) => a.status === "Pending");

  const filteredApps = useMemo(() => {
    if (reviewFilter === "All") return pending;
    return pending.filter(a => a.applicationType === reviewFilter);
  }, [pending, reviewFilter]);

  const allTypes: ("All" | ApplicationType)[] = ["All", ...APPLICATION_TYPES];

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-5xl flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">Admin Panel</h1>
          <button
            onClick={() => { store.setAdminAuth(false); setAuthenticated(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-sm font-semibold uppercase"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Flat high-contrast Tabs without animation */}
        <div className="flex gap-2 mb-8 p-1 bg-[#161920] rounded-md border border-[#1e232b]">
          {[
            { id: "dashboard" as const, icon: Settings, label: "Dashboard" },
            { id: "questions" as const, icon: ClipboardList, label: "Questions" },
            { id: "review" as const, icon: Users, label: `Review (${pending.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedRoleForQs(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold uppercase transition-none ${tab === t.id
                ? "bg-primary text-white"
                : "bg-transparent text-muted-foreground hover:text-white"
                }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* Recruitment Toggle */}
              <div className="glass-card p-8 bg-[#161920] border-[#1e232b]">
                <h2 className="font-display text-xl font-bold text-primary mb-6">Recruitment Status</h2>
                <div className="flex items-center gap-4">
                  <button onClick={toggleRecruitment} className="flex items-center gap-3">
                    <div className={`w-14 h-8 rounded-full border border-[#1e232b] flex items-center transition-colors px-1 ${config.recruitmentOpen ? 'bg-primary' : 'bg-[#0f1115]'}`}>
                      <div className={`w-6 h-6 rounded-full bg-white transition-transform ${config.recruitmentOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
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
                    { label: "Total", val: applications.length, color: "text-primary" },
                    { label: "Pending", val: pending.length, color: "text-white" },
                    { label: "Accepted", val: applications.filter((a) => a.status === "Accepted").length, color: "text-green-500" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md bg-[#0f1115] border border-[#1e232b] p-4 text-center">
                      <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Application Type Controls */}
              <div className="glass-card p-8 bg-[#161920] border-[#1e232b]">
                <h2 className="font-display text-xl font-bold text-primary mb-6">Open Application Types</h2>
                <p className="text-sm text-muted-foreground mb-4">Toggle which positions are currently accepting applications</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {APPLICATION_TYPES.map((type) => {
                    const isOpen = (config.openApplicationTypes || []).includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleAppType(type)}
                        className={`flex items-center justify-between gap-2 px-4 py-3 rounded-md text-sm font-semibold transition-none border ${isOpen
                          ? "border-primary bg-primary/20 text-white"
                          : "border-[#1e232b] bg-[#0f1115] text-muted-foreground"
                          }`}
                      >
                        {type}
                        <div className={`w-8 h-4 rounded-full flex items-center px-0.5 ${isOpen ? 'bg-primary' : 'bg-[#1e232b]'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isOpen ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Results */}
              <div className="glass-card p-8 bg-[#161920] border-[#1e232b]">
                <h2 className="font-display text-xl font-bold text-primary mb-4">Clear Results</h2>
                <p className="text-sm text-muted-foreground mb-4">Remove all accepted and rejected applications from the results page</p>
                <button
                  onClick={async () => {
                    await store.clearResults(applications);
                    toast.success("Results cleared — only pending applications remain");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#161920] border border-[#1e232b] text-red-500 font-semibold uppercase hover:brightness-110 outline-primary active:scale-[0.98] transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Results
                </button>
              </div>
            </div>
          )}

          {tab === "questions" && (
            <div className="space-y-6">
              {!selectedRoleForQs ? (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {allTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => { }}
                        className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap border border-[#1e232b] bg-[#161920] text-muted-foreground cursor-default`}
                      >
                        {t}
                        <span className="ml-2 bg-[#0f1115] px-2 py-0.5 rounded text-xs">{t === 'All' ? questions.length : questions.filter(q => q.appType === t).length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {APPLICATION_TYPES.map((type) => {
                      const count = questions.filter(q => q.appType === type).length;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedRoleForQs(type)}
                          className="glass-card p-6 bg-[#161920] border-[#1e232b] text-left hover:border-primary transition-colors flex flex-col rounded-md"
                        >
                          <h3 className="font-display text-lg font-bold text-white mb-2">{type}</h3>
                          <p className="text-sm text-muted-foreground">{count} Questions</p>
                          <div className="mt-4 text-xs font-semibold text-primary uppercase">Manage →</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <button onClick={() => setSelectedRoleForQs(null)} className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 text-sm font-semibold uppercase">
                    <ChevronLeft className="w-4 h-4" /> Back to roles
                  </button>
                  <h2 className="font-display text-2xl font-bold text-primary mb-6">Questions for {selectedRoleForQs}</h2>

                  {/* Add Question */}
                  <div className="glass-card p-6 bg-[#161920] border-[#1e232b] rounded-md">
                    <h3 className="font-display text-lg font-bold text-white mb-4">Add New Question</h3>
                    <div className="flex flex-col gap-3">
                      <input
                        value={newQ.label}
                        onChange={(e) => setNewQ({ ...newQ, label: e.target.value })}
                        placeholder="Question text"
                        className="w-full rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={newQ.step}
                          onChange={(e) => setNewQ({ ...newQ, step: Number(e.target.value) })}
                          className="rounded-md border border-[#1e232b] bg-[#0f1115] px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                          value={newQ.type}
                          onChange={(e) => setNewQ({ ...newQ, type: e.target.value as any })}
                          className="rounded-md border border-[#1e232b] bg-[#0f1115] px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="boolean">True / False</option>
                        </select>
                        <button
                          onClick={addQuestion}
                          className="px-6 py-2.5 rounded-md bg-primary text-white font-semibold uppercase hover:brightness-110 transition-all active:scale-[0.98]"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Display Questions */}
                  <div className="glass-card p-6 bg-[#161920] border-[#1e232b] rounded-md">
                    <h3 className="font-display text-md font-bold text-white mb-3">Existing Questions</h3>
                    <div className="space-y-2">
                      {questions.filter(q => q.appType === selectedRoleForQs).length === 0 ? <p className="text-sm text-muted-foreground italic">No questions added yet.</p> : null}
                      {questions.filter(q => q.appType === selectedRoleForQs).map((q) => (
                        <div key={q.id} className="flex items-center justify-between rounded-md bg-[#0f1115] border border-[#1e232b] px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{q.label}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-[#161920] px-2 py-0.5 rounded text-primary border border-[#1e232b]">{q.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provide Step Managing within questions too for general ease */}
                  <div className="glass-card p-6 bg-[#161920] border-[#1e232b] rounded-md mt-6">
                    <h3 className="font-display text-lg font-bold text-white mb-4">Manage Form Steps (Pages)</h3>
                    <div className="flex flex-col gap-3 mb-6">
                      <div className="flex gap-3">
                        <input
                          value={newStep.name}
                          onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                          placeholder="Step Name (e.g. Scenario)"
                          className="w-1/3 rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          value={newStep.description}
                          onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                          placeholder="Step Description..."
                          className="flex-1 rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={addStep}
                          className="px-4 py-2.5 rounded-md bg-[#161920] border border-[#1e232b] text-primary font-semibold hover:brightness-110 uppercase active:scale-[0.98]"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center justify-between rounded-md bg-[#0f1115] border border-[#1e232b] px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-white">Step {idx + 1}: {s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                          </div>
                          <button onClick={() => removeStep(s.id)} className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "review" && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {allTypes.map(t => {
                  const count = t === 'All' ? pending.length : pending.filter(a => a.applicationType === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setReviewFilter(t)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-none border ${reviewFilter === t ? 'bg-primary text-white border-primary' : 'border-[#1e232b] bg-[#161920] text-muted-foreground hover:text-white'}`}
                    >
                      {t}
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${reviewFilter === t ? 'bg-black/20 text-white' : 'bg-[#0f1115] text-muted-foreground'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {filteredApps.length === 0 ? (
                <div className="glass-card p-12 text-center bg-[#161920] border-[#1e232b] rounded-md">
                  <p className="text-muted-foreground text-lg">No pending applications for this filter 🎉</p>
                </div>
              ) : (
                filteredApps.map((app) => (
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
    <div className="glass-card p-8 min-h-[160px] bg-[#161920] border-[#1e232b] shadow-xl rounded-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-lg text-primary">{app.discordUsername}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {app.id} • {app.applicationType} • {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Legacy'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAccept} className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors uppercase font-semibold text-xs border border-green-500/30" title="Accept">
            <Check className="w-4 h-4 sm:mr-1 inline-block" /> <span className="hidden sm:inline">Accept</span>
          </button>
          <button onClick={onReject} className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors uppercase font-semibold text-xs border border-red-500/30" title="Reject">
            <X className="w-4 h-4 sm:mr-1 inline-block" /> <span className="hidden sm:inline">Reject</span>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md bg-[#0f1115] text-muted-foreground hover:bg-[#1e232b] transition-colors border border-[#1e232b]" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary/80 mt-3 hover:text-primary transition-colors uppercase font-semibold">
        {expanded ? "Hide answers ▲" : "View answers ▼"}
      </button>
      {expanded && (
        <div className="mt-4 space-y-3 pt-4 border-t border-[#1e232b]">
          {Object.entries(app.answers || {}).map(([qId, answer]) => {
            const q = questions.find((q) => q.id === qId);
            return (
              <div key={qId} className="rounded-md bg-[#0f1115] border border-[#1e232b] p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">{q?.label || qId}</p>
                <p className="text-sm text-white font-medium">{answer}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Admin;
