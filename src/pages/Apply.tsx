import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Send, Sparkles, AlertCircle } from "lucide-react";
import { store, useAppStore, APPLICATION_TYPES, type ApplicationType } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import TrainLoader from "@/components/TrainLoader";
import { toast } from "sonner";

const Apply = () => {
  const navigate = useNavigate();
  const { config, questions, steps, loading } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType | "">("");
  const [submitting, setSubmitting] = useState(false);

  const openTypes = config.openApplicationTypes || APPLICATION_TYPES;

  const stepQuestions = useMemo(() => {
    const currentStepObj = steps[currentStep - 1];
    if (!currentStepObj) return [];

    let qs = questions.filter((q) => q.step === currentStepObj.id || q.step === currentStep);

    // filter by application type
    if (selectedAppType) {
      qs = qs.filter((q) => q.appType === selectedAppType);
    }
    return qs;
  }, [questions, currentStep, selectedAppType, steps]);

  const maxStep = steps.length;

  if (!config.recruitmentOpen) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 sm:p-12 text-center w-full max-w-lg overflow-hidden relative" style={{ background: "hsl(var(--card) / 0.7)" }}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-primary mb-4">
              Applications Closed
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Recruitment is currently paused. Please check back later or monitor our Discord server for updates!
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (submitting) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <TrainLoader text="Transmitting your data..." />
        </div>
      </PageWrapper>
    );
  }

  const handleSubmit = async () => {
    const allQs = questions.filter((q) => {
      const isConfiguredStep = steps.some((s, idx) => q.step === s.id || q.step === idx + 1);
      const isRoleMatch = q.appType === selectedAppType;
      return isConfiguredStep && isRoleMatch;
    });
    const missing = allQs.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      toast.error("Please fill in all required fields before submitting.");
      return;
    }
    if (!selectedAppType) {
      toast.error("Please select an application type.");
      setSubmitting(false);
      return;
    }

    try {
      const app = await store.addApplication({
        discordUsername: answers["q1"] || "",
        discordUserId: answers["q2"] || "",
        applicationType: selectedAppType as ApplicationType,
        answers,
      });

      // Save username for passed banner
      if (answers["q1"]) {
        localStorage.setItem("epic-rail-user-discord", answers["q1"]);
      }

      toast.success(`Application submitted! Your ID: ${app.id}`);
      navigate("/track");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = (() => {
    if (currentStep === 1) {
      const step1Valid = stepQuestions.every((q) => !q.required || answers[q.id]?.trim());
      return step1Valid && !!selectedAppType;
    }
    return stepQuestions.every((q) => !q.required || answers[q.id]?.trim());
  })();

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 sm:px-6 w-full max-w-3xl overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 mt-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mb-6 shadow-inner"
          >
            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsla(352,82%,62%,0.8)]" />
          </motion.div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-primary tracking-tight mb-4">
            Staff Application
          </h1>
        </motion.div>

        {/* Progress Steps */}
        <div className="w-full pb-8">
          <div className="flex flex-wrap items-center justify-center gap-y-6 gap-x-3 sm:gap-x-6 px-2">
            {steps.map((stepData, i) => {
              const step = i + 1;
              const active = currentStep === step;
              const done = currentStep > step;
              return (
                <div key={stepData.id} className="flex items-center gap-3 sm:gap-6 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={active ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold min-w-[2.5rem] sm:min-w-[3rem] transition-colors ${active
                        ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsla(352,82%,62%,0.4)] border border-primary/20"
                        : done
                          ? "bg-emerald/20 text-emerald border border-emerald/30 shadow-inner"
                          : "bg-background/50 border border-border/50 text-muted-foreground"
                        }`}
                    >
                      {done ? "✓" : step}
                    </motion.div>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground"}`}>
                      {stepData.name}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-6 sm:w-10 h-0.5 sm:h-1 -mt-5 rounded-full transition-colors hidden md:block ${done ? "bg-emerald/50" : "bg-border/30"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div
          className="glass-card p-6 sm:p-10 relative overflow-hidden w-full border border-border bg-card/40 shadow-xl"
        >
          {/* Decorative Background Blob */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

          <div
            key={currentStep}
            className="space-y-6 sm:space-y-8 relative z-10 w-full"
          >
            <div className="border-b border-border/50 pb-4 mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                {steps[currentStep - 1]?.name}
              </h2>
              {steps[currentStep - 1]?.description && (
                <p className="text-sm sm:text-base text-muted-foreground mt-2">{steps[currentStep - 1].description}</p>
              )}
            </div>

            {/* Step 1: Application Type Selector */}
            {currentStep === 1 && (
              <div className="space-y-4 bg-background/30 p-5 rounded-2xl border border-border/20">
                <label className="text-sm font-bold text-primary uppercase tracking-wide">
                  Select Position <span className="text-crimson">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedAppType(type)}
                      className={`px-4 py-4 rounded-xl text-sm font-bold transition-all text-left ${selectedAppType === type
                        ? "bg-primary/20 text-primary border-2 border-primary shadow-lg shadow-primary/20 relative overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                        : "border border-border/30 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border-primary/50"
                        }`}
                    >
                      {selectedAppType === type && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Questions */}
            {stepQuestions.map((q) => (
              <div key={q.id} className="space-y-3">
                <label className="text-sm font-bold text-foreground block">
                  {q.label}
                  {q.required && <span className="text-primary ml-1.5">*</span>}
                </label>
                {q.type === "textarea" ? (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full rounded-xl border border-border/30 bg-background/50 px-5 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[120px] backdrop-blur-sm transition-all text-sm sm:text-base leading-relaxed overflow-y-auto"
                    placeholder="Type your detailed answer here..."
                  />
                ) : q.type === "select" ? (
                  <div className="relative">
                    <select
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full rounded-xl border border-border/30 bg-background/50 px-5 py-4 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm transition-all text-sm sm:text-base cursor-pointer"
                    >
                      <option value="" disabled className="bg-card text-muted-foreground">Select an option...</option>
                      {q.options?.map((o) => (
                        <option key={o} value={o} className="bg-card text-foreground">{o}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      ▼
                    </div>
                  </div>
                ) : q.type === "boolean" ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className={`flex items-center justify-center gap-2 cursor-pointer py-4 rounded-xl border transition-all flex-1 backdrop-blur-sm ${answers[q.id] === "Yes" ? "bg-emerald/10 border-emerald/50 text-emerald shadow-[0_0_10px_hsla(152,69%,40%,0.1)] relative overflow-hidden" : "bg-background/50 border-border/30 hover:bg-background/80 hover:border-emerald/30 text-muted-foreground"}`}>
                      {answers[q.id] === "Yes" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald" />}
                      <input type="radio" checked={answers[q.id] === "Yes"} onChange={() => setAnswers({ ...answers, [q.id]: "Yes" })} className="hidden" />
                      <span className="font-bold text-sm sm:text-base tracking-wide">YES</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 cursor-pointer py-4 rounded-xl border transition-all flex-1 backdrop-blur-sm ${answers[q.id] === "No" ? "bg-crimson/10 border-crimson/50 text-crimson shadow-[0_0_10px_hsla(352,82%,62%,0.1)] relative overflow-hidden" : "bg-background/50 border-border/30 hover:bg-background/80 hover:border-crimson/30 text-muted-foreground"}`}>
                      {answers[q.id] === "No" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-crimson" />}
                      <input type="radio" checked={answers[q.id] === "No"} onChange={() => setAnswers({ ...answers, [q.id]: "No" })} className="hidden" />
                      <span className="font-bold text-sm sm:text-base tracking-wide">NO</span>
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full rounded-xl border border-border/30 bg-background/50 px-5 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm transition-all text-sm sm:text-base"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/50 relative z-10 w-full">
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="flex items-center justify-center sm:justify-start gap-2 px-6 py-3.5 rounded-xl bg-background/50 border border-border/50 text-foreground font-semibold hover:bg-background/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>

            {currentStep < maxStep ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canGoNext}
                className="flex items-center justify-center sm:justify-end gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_0_hsla(352,82%,62%,0.2)] hover:shadow-[0_6px_20px_hsla(352,82%,62%,0.3)] hover:-translate-y-0.5 max-w-full sm:w-auto w-full"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext}
                className="flex items-center justify-center sm:justify-end gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_0_hsla(352,82%,62%,0.3)] hover:shadow-[0_6px_20px_hsla(352,82%,62%,0.5)] hover:-translate-y-0.5 max-w-full sm:w-auto w-full"
              >
                Submit Application <Send className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
        {/* Spacer for mobile */}
        <div className="h-12 w-full" />
      </div>
    </PageWrapper>
  );
};

export default Apply;
