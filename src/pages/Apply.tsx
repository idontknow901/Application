import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Send, Sparkles, AlertCircle, Briefcase, RotateCcw, Check, X } from "lucide-react";
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

  const openTypes = (config.openApplicationTypes && config.openApplicationTypes.length > 0)
    ? config.openApplicationTypes
    : APPLICATION_TYPES;

  const activeSteps = useMemo(() => {
    if (!selectedAppType) return [];
    return steps.filter(s => s.appType === selectedAppType);
  }, [steps, selectedAppType]);

  const stepQuestions = useMemo(() => {
    const currentStepObj = activeSteps[currentStep - 1];
    if (!currentStepObj) return [];

    let qs = questions.filter((q) => q.step === currentStepObj.id);

    // Filter strictly by role
    qs = qs.filter((q) => q.appType === selectedAppType);
    return qs;
  }, [questions, currentStep, selectedAppType, activeSteps]);

  const maxStep = activeSteps.length;

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
      const isConfiguredStep = activeSteps.some((s) => q.step === s.id);
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
    return stepQuestions.every((q) => !q.required || answers[q.id]?.trim());
  })();

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 sm:px-6 w-full max-w-4xl overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10 mt-4"
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

        {/* Step 0: Application Type Selector */}
        {!selectedAppType && (
          <div className="glass-card p-8 sm:p-12 text-center w-full max-w-2xl mx-auto overflow-hidden relative" style={{ background: "hsl(var(--card) / 0.7)" }}>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Select Your Department</h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">Please choose the department you wish to apply for to begin the process.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {openTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedAppType(type)}
                  className="px-6 py-5 rounded-2xl border border-border/30 bg-background/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all font-bold text-sm sm:text-base shadow-sm hover:shadow-primary/10 flex flex-col items-center gap-2 group"
                >
                  <Briefcase className="w-6 h-6 mb-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedAppType && (
          <>
            {/* Progress Steps - Single Row */}
            <div className="w-full pb-10 overflow-x-auto scrollbar-hide flex justify-center">
              <div className="flex flex-nowrap items-center justify-center px-4 gap-4 sm:gap-8 min-w-max">
                {activeSteps.map((stepData, i) => {
                  const step = i + 1;
                  const active = currentStep === step;
                  const done = currentStep > step;
                  return (
                    <div key={stepData.id} className="flex items-center gap-4 sm:gap-8 shrink-0">
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={active ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px hsla(352,82%,62%,0)", "0 0 20px hsla(352,82%,62%,0.4)", "0 0 0px hsla(352,82%,62%,0)"] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-500 border-2 ${active
                            ? "bg-primary text-primary-foreground border-primary shadow-lg"
                            : done
                              ? "bg-emerald/20 text-emerald border-emerald/50"
                              : "bg-background/40 border-border/30 text-muted-foreground"
                            }`}
                        >
                          {done ? "✓" : step}
                        </motion.div>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] text-center max-w-[80px] sm:max-w-[120px] shadow-sm leading-tight inline-block ${active ? "text-primary" : "text-muted-foreground"}`}>
                          {stepData.name}
                        </span>
                      </div>
                      {i < activeSteps.length - 1 && (
                        <div className={`w-8 sm:w-16 h-[2px] rounded-full transition-all duration-700 -mt-8 ${done ? "bg-emerald/50" : "bg-border/20"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Container */}
            <div className="glass-card p-6 sm:p-10 relative overflow-hidden w-full border border-border bg-card/40 shadow-2xl rounded-3xl">
              {/* Decorative Background Blob */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

              <div key={currentStep} className="space-y-6 sm:space-y-8 relative z-10 w-full">
                <div className="border-b border-border/50 pb-6 mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="font-display text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                      {activeSteps[currentStep - 1]?.name}
                    </h2>
                    {activeSteps[currentStep - 1]?.description && (
                      <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">{activeSteps[currentStep - 1].description}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm("Change department? Current progress will be lost.")) {
                        setSelectedAppType("");
                        setCurrentStep(1);
                        setAnswers({});
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary/60 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Dynamic Questions */}
                <div className="space-y-8">
                  {stepQuestions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        {q.label}
                        {q.required && <span className="text-primary text-xl -mt-1">*</span>}
                      </label>
                      {q.type === "textarea" ? (
                        <textarea
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full rounded-2xl border border-border/30 bg-background/50 px-6 py-5 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[160px] backdrop-blur-md transition-all text-sm sm:text-base leading-relaxed shadow-inner"
                          placeholder="Type your detailed answer here..."
                        />
                      ) : q.type === "select" ? (
                        <div className="relative">
                          <select
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="w-full rounded-2xl border border-border/30 bg-background/50 px-6 py-5 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md transition-all text-sm sm:text-base cursor-pointer shadow-inner"
                          >
                            <option value="" disabled className="bg-card text-muted-foreground">Select an option...</option>
                            {q.options?.map((o) => (
                              <option key={o} value={o} className="bg-card text-foreground">{o}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronRight className="w-5 h-5 rotate-90" />
                          </div>
                        </div>
                      ) : q.type === "boolean" ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className={`flex items-center justify-center gap-3 cursor-pointer py-5 rounded-2xl border-2 transition-all flex-1 backdrop-blur-md font-black tracking-widest text-sm sm:text-base ${answers[q.id] === "Yes" ? "bg-emerald/10 border-emerald/50 text-emerald shadow-[0_0_20px_hsla(152,69%,40%,0.1)] scale-[1.02]" : "bg-background/40 border-border/30 hover:border-emerald/30 text-muted-foreground opacity-60 hover:opacity-100"}`}>
                            <input type="radio" checked={answers[q.id] === "Yes"} onChange={() => setAnswers({ ...answers, [q.id]: "Yes" })} className="hidden" />
                            <Check className={`w-5 h-5 ${answers[q.id] === "Yes" ? "opacity-100" : "opacity-20"}`} /> YES
                          </label>
                          <label className={`flex items-center justify-center gap-3 cursor-pointer py-5 rounded-2xl border-2 transition-all flex-1 backdrop-blur-md font-black tracking-widest text-sm sm:text-base ${answers[q.id] === "No" ? "bg-crimson/10 border-crimson/50 text-crimson shadow-[0_0_20px_hsla(352,82%,62%,0.1)] scale-[1.02]" : "bg-background/40 border-border/30 hover:border-crimson/30 text-muted-foreground opacity-60 hover:opacity-100"}`}>
                            <input type="radio" checked={answers[q.id] === "No"} onChange={() => setAnswers({ ...answers, [q.id]: "No" })} className="hidden" />
                            <X className={`w-5 h-5 ${answers[q.id] === "No" ? "opacity-100" : "opacity-20"}`} /> NO
                          </label>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full rounded-2xl border border-border/30 bg-background/50 px-6 py-5 text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md transition-all text-sm sm:text-base shadow-inner"
                          placeholder="Type your answer here..."
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Nav buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-12 pt-8 border-t border-border/50 relative z-10 w-full">
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    disabled={currentStep === 1}
                    className="flex items-center justify-center sm:justify-start gap-2 px-8 py-4 rounded-2xl bg-background/50 border border-border/50 text-foreground font-bold hover:bg-background/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>

                  {currentStep < maxStep ? (
                    <button
                      onClick={() => setCurrentStep((s) => s + 1)}
                      disabled={!canGoNext}
                      className="flex items-center justify-center sm:justify-end gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-[0_8px_25px_-5px_hsla(352,82%,62%,0.4)] hover:shadow-[0_12px_30px_-5px_hsla(352,82%,62%,0.5)] hover:-translate-y-1 active:scale-95 w-full sm:w-auto uppercase tracking-wider"
                    >
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canGoNext}
                      className="flex items-center justify-center sm:justify-end gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-[0_8px_25px_-5px_hsla(352,82%,62%,0.5)] hover:shadow-[0_12px_30px_-5px_hsla(352,82%,62%,0.7)] hover:-translate-y-1 active:scale-95 w-full sm:w-auto uppercase tracking-wider"
                    >
                      Submit Application <Send className="w-5 h-5 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default Apply;
