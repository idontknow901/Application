import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Send, Sparkles } from "lucide-react";
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

  // BotGhost styling uses deep charcoal backgrounds with standard forms. No extreme shadow transitions on inputs.

  // Use config's open types if available, otherwise just use array
  const openTypes = config.openApplicationTypes || APPLICATION_TYPES;

  // We enforce the 6-step look by letting `steps` dictate it,
  // but if the db only has 2 steps, we just use what it has.
  // We'll pad it visually or let the store rule what the steps are.
  const appSteps = steps;
  const maxStep = appSteps.length;

  const stepQuestions = useMemo(() => {
    const currentStepObj = appSteps[currentStep - 1];
    if (!currentStepObj) return [];

    let qs = questions.filter((q) => q.step === currentStepObj.id || q.step === currentStep);

    // Filter by Application Type selected in step 1 
    // "General" questions are excluded per prompt unless they exist from old db
    if (selectedAppType) {
      qs = qs.filter((q) => !q.appType || q.appType === selectedAppType);
    }
    return qs;
  }, [questions, currentStep, selectedAppType, appSteps]);

  // Removed scroll to top per user request to not scroll unless necessary

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
          <div className="bg-[#161920] border border-[#1e232b] p-12 text-center max-w-lg rounded-md w-full">
            <h2 className="font-display text-3xl font-bold text-primary mb-4">
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
      const isConfiguredStep = appSteps.some((s, idx) => q.step === s.id || q.step === idx + 1);
      const isRoleMatch = !q.appType || q.appType === selectedAppType;
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
    await new Promise((r) => setTimeout(r, 2000));

    const app = await store.addApplication({
      discordUsername: answers["q1"] || answers["discord_username"] || "Unknown",
      discordUserId: answers["q2"] || answers["discord_id"] || "Unknown",
      applicationType: selectedAppType,
      answers,
    });

    localStorage.setItem("epic-rail-user-discord", answers["q1"] || answers["discord_username"] || "");

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
      <div className="container mx-auto px-2 sm:px-4 max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary">
            Staff Application
          </h1>
          <p className="text-center text-muted-foreground mt-2 text-sm sm:text-base">
            Complete all steps to submit your application
          </p>
        </motion.div>

        {/* Updated Progress Steps */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-8 overflow-x-auto pb-4 px-2 scrollbar-none">
          {appSteps.map((stepData, i) => {
            const step = i + 1;
            const active = currentStep === step;
            const done = currentStep > step;
            return (
              <div key={stepData.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-shrink-0 relative">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors border ${active
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : done
                        ? "bg-accent border-accent text-white"
                        : "bg-transparent border-[#1e232b] text-muted-foreground"
                      }`}
                  >
                    {done ? "✓" : step}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold uppercase mt-2 absolute top-full ${active ? "text-primary whitespace-nowrap" : "text-muted-foreground hidden sm:block whitespace-nowrap"
                      }`}
                  >
                    {stepData.name}
                  </span>
                </div>
                {i < appSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${done ? "bg-accent" : "bg-[#1e232b]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Adds padding to compensate for absolute positioned step titles */}
        <div className="h-6 sm:h-2" />

        {/* Form area */}
        <div className="bg-[#161920] border border-[#1e232b] rounded-md p-4 sm:p-8 relative overflow-hidden w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {appSteps[currentStep - 1]?.name}
                </h2>
                {appSteps[currentStep - 1]?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{appSteps[currentStep - 1].description}</p>
                )}
              </div>

              {currentStep === 1 && (
                <div className="space-y-4 pt-2">
                  <label className="text-sm font-semibold text-white uppercase tracking-wide">
                    Select Position <span className="text-primary">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {openTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedAppType(type)}
                        className={`px-4 py-4 rounded-md text-sm font-bold text-left transition-all border ${selectedAppType === type
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.01]"
                          : "bg-[#0f1115] text-muted-foreground border-[#1e232b] hover:border-primary/50"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6 pt-4">
                {stepQuestions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-semibold text-white uppercase tracking-wide">
                      {q.label}
                      {q.required && <span className="text-primary ml-1">*</span>}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-3 text-white text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[120px]"
                        placeholder="Type your answer here..."
                      />
                    ) : q.type === "select" ? (
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      >
                        <option value="">Select an option</option>
                        {q.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : q.type === "boolean" ? (
                      <div className="flex gap-4">
                        <label className={`flex items-center gap-2 cursor-pointer p-4 rounded-md border transition-all flex-1 justify-center ${answers[q.id] === "Yes" ? "bg-accent/20 border-accent" : "bg-[#0f1115] border-[#1e232b] hover:border-accent/50"}`}>
                          <input type="radio" checked={answers[q.id] === "Yes"} onChange={() => setAnswers({ ...answers, [q.id]: "Yes" })} className="hidden" />
                          <span className={`${answers[q.id] === 'Yes' ? 'text-accent' : 'text-white'} font-bold`}>Yes</span>
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer p-4 rounded-md border transition-all flex-1 justify-center ${answers[q.id] === "No" ? "bg-red-500/20 border-red-500" : "bg-[#0f1115] border-[#1e232b] hover:border-red-500/50"}`}>
                          <input type="radio" checked={answers[q.id] === "No"} onChange={() => setAnswers({ ...answers, [q.id]: "No" })} className="hidden" />
                          <span className={`${answers[q.id] === 'No' ? 'text-red-500' : 'text-white'} font-bold`}>No</span>
                        </label>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full rounded-md border border-[#1e232b] bg-[#0f1115] px-4 py-3 text-white text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Type your answer here..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col-reverse sm:flex-row justify-between mt-10 gap-4 border-t border-[#1e232b] pt-6">
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="flex justify-center items-center gap-2 px-6 py-3 rounded-md bg-transparent border border-[#1e232b] text-white font-semibold uppercase hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>

            {currentStep < maxStep ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canGoNext}
                className="flex justify-center items-center gap-2 px-8 py-3 rounded-md bg-primary text-white font-bold uppercase hover:brightness-110 active:scale-[0.98] outline-primary disabled:opacity-50 disabled:grayscale transition-all w-full sm:w-auto shadow-[0_0_15px_rgba(255,77,77,0.3)]"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext}
                className="flex justify-center items-center gap-2 px-8 py-3 rounded-md bg-primary text-white font-bold uppercase hover:brightness-110 active:scale-[0.98] outline-primary disabled:opacity-50 disabled:grayscale transition-all w-full sm:w-auto shadow-[0_0_15px_rgba(255,77,77,0.3)]"
              >
                <Send className="w-5 h-5" /> Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Apply;
