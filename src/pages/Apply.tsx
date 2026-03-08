import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Send, Train, Sparkles } from "lucide-react";
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
      qs = qs.filter((q) => !q.appType || q.appType === "General" || q.appType === selectedAppType);
    }
    return qs;
  }, [questions, currentStep, selectedAppType, steps]);

  const maxStep = steps.length;

  if (loading) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <TrainLoader text="Loading form..." />
        </div>
      </PageWrapper>
    );
  }

  if (!config.recruitmentOpen) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-12 text-center max-w-lg" style={{ background: "hsl(var(--navy) / 0.7)" }}>
            <h2 className="font-display text-3xl font-bold text-gold-light mb-4">
              Applications Closed
            </h2>
            <p className="text-muted-foreground">
              Recruitment is currently paused. Please check back later!
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
          <TrainLoader text="Submitting your application..." />
        </div>
      </PageWrapper>
    );
  }

  const handleSubmit = async () => {
    const allQs = questions.filter((q) => {
      const isConfiguredStep = steps.some((s, idx) => q.step === s.id || q.step === idx + 1);
      const isRoleMatch = !q.appType || q.appType === "General" || q.appType === selectedAppType;
      return isConfiguredStep && isRoleMatch;
    });
    const missing = allQs.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      toast.error("Please fill in all required fields before submitting.");
      return;
    }
    if (!selectedAppType) {
      toast.error("Please select an application type.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2500));

    const app = await store.addApplication({
      discordUsername: answers["q1"] || "",
      discordUserId: answers["q2"] || "",
      applicationType: selectedAppType,
      answers,
    });

    // Save username for passed banner
    localStorage.setItem("epic-rail-user-discord", answers["q1"] || "");

    setSubmitting(false);
    toast.success(`Application submitted! Your ID: ${app.id}`);
    navigate("/track");
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
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header with sparkle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--gold))" }} />
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-gradient-gold">
            Staff Application
          </h1>
        </motion.div>
        <p className="text-center text-muted-foreground mb-8">
          Complete all steps to submit your application
        </p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-4">
          {steps.map((stepData, i) => {
            const step = i + 1;
            const active = currentStep === step;
            const done = currentStep > step;
            return (
              <div key={stepData.id} className="flex items-center gap-2 whitespace-nowrap">
                <motion.div
                  animate={active ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold min-w-[2.5rem] transition-colors ${active
                    ? "gradient-gold text-primary-foreground shadow-lg"
                    : done
                      ? "bg-emerald text-emerald-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  {done ? "✓" : step}
                </motion.div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${active ? "text-gold" : "text-muted-foreground"
                    }`}
                >
                  {stepData.name}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 transition-colors ${done ? "bg-emerald" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form */}
        <motion.div
          className="glass-card p-8 md:p-10 relative overflow-hidden"
          style={{ background: "hsl(var(--navy) / 0.7)" }}
        >
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
            <Train className="w-full h-full" style={{ color: "hsl(var(--gold))" }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <h2 className="font-display text-xl font-bold text-gold-light">
                Step {currentStep}: {steps[currentStep - 1]?.name}
              </h2>
              {steps[currentStep - 1]?.description && (
                <p className="text-sm text-foreground/70 mb-4">{steps[currentStep - 1].description}</p>
              )}

              {/* Step 1: Application Type Selector */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gold-light/80">
                    Which position are you applying for? <span className="text-crimson">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {openTypes.map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedAppType(type)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${selectedAppType === type
                          ? "gradient-gold text-primary-foreground border-transparent shadow-lg"
                          : "border-border/30 bg-background/10 text-foreground hover:border-gold/50"
                          }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {stepQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-medium text-gold-light/80">
                    {q.label}
                    {q.required && <span className="text-crimson ml-1">*</span>}
                  </label>
                  {q.type === "textarea" ? (
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full rounded-xl border border-border/30 bg-background/10 px-4 py-3 text-white font-medium placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none min-h-[100px] backdrop-blur-sm transition-shadow focus:shadow-lg focus:shadow-gold/10"
                      placeholder="Type your answer..."
                    />
                  ) : q.type === "select" ? (
                    <select
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full rounded-xl border border-border/30 bg-navy px-4 py-3 text-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50 backdrop-blur-sm"
                    >
                      <option value="" className="bg-navy text-gold-light">Select...</option>
                      {q.options?.map((o) => (
                        <option key={o} value={o} className="bg-navy text-gold-light">{o}</option>
                      ))}
                    </select>
                  ) : q.type === "boolean" ? (
                    <div className="flex gap-4 mt-2">
                      <label className={`flex items-center gap-2 cursor-pointer p-4 rounded-xl border transition-all flex-1 backdrop-blur-sm ${answers[q.id] === "Yes" ? "bg-emerald/20 border-emerald shadow-lg shadow-emerald/10" : "bg-background/10 border-border/30 hover:border-emerald/50"}`}>
                        <input type="radio" checked={answers[q.id] === "Yes"} onChange={() => setAnswers({ ...answers, [q.id]: "Yes" })} className="hidden" />
                        <span className="text-white font-medium mx-auto">Yes</span>
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer p-4 rounded-xl border transition-all flex-1 backdrop-blur-sm ${answers[q.id] === "No" ? "bg-crimson/20 border-crimson shadow-lg shadow-crimson/10" : "bg-background/10 border-border/30 hover:border-crimson/50"}`}>
                        <input type="radio" checked={answers[q.id] === "No"} onChange={() => setAnswers({ ...answers, [q.id]: "No" })} className="hidden" />
                        <span className="text-white font-medium mx-auto">No</span>
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full rounded-xl border border-border/30 bg-background/10 px-4 py-3 text-white font-medium placeholder:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 backdrop-blur-sm transition-shadow focus:shadow-lg focus:shadow-gold/10"
                      placeholder="Type your answer..."
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {currentStep < maxStep ? (
              <motion.button
                whileHover={{ scale: canGoNext ? 1.05 : 1 }}
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canGoNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-black font-bold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: canGoNext ? 1.05 : 1 }}
                onClick={handleSubmit}
                disabled={!canGoNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-gold text-black font-bold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" /> Submit
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Apply;
