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
    const roleSteps = steps.filter(s => s.appType === selectedAppType);
    if (roleSteps.length > 0) return roleSteps;
    
    // Fallback to Common steps if no role-specific steps exist
    return steps.filter(s => s.appType === 'Common' || !s.appType);
  }, [steps, selectedAppType]);

  const stepQuestions = useMemo(() => {
    const currentStepObj = activeSteps[currentStep - 1];
    if (!currentStepObj) return [];

    // Filter by step ID or legacy index, and strictly by role
    return questions.filter((q) => 
      (q.step === currentStepObj.id || q.step === currentStep) && 
      q.appType === selectedAppType
    );
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
      let detectedUsername = "";
      const prioritizedKeywords = ["roblox", "discord", "username", "name", "id", "tag"];
      const step1Qs = questions.filter(q => 
        (q.step === 1) && 
        (q.appType === selectedAppType || q.appType === 'Common' || !q.appType)
      );

      const bestQ = step1Qs.find(q => 
        prioritizedKeywords.some(k => q.label.toLowerCase().includes(k)) && 
        answers[q.id]?.trim()
      );
      
      if (bestQ) {
        detectedUsername = answers[bestQ.id];
      } else {
        const anyMatchQ = questions.find(q => 
          prioritizedKeywords.some(k => q.label.toLowerCase().includes(k)) && 
          answers[q.id]?.trim() &&
          (q.appType === selectedAppType || q.appType === 'Common' || !q.appType)
        );
        detectedUsername = anyMatchQ ? answers[anyMatchQ.id] : "";
      }

      if (!detectedUsername.trim()) {
        const firstValueId = Object.keys(answers).find(id => answers[id]?.trim().length > 0);
        if (firstValueId) detectedUsername = answers[firstValueId];
      }
      
      const username = detectedUsername.trim() || Object.values(answers)[0] || "Anonymous";
      
      const app = await store.addApplication({
        discordUsername: username,
        discordUserId: "Not Provided",
        applicationType: selectedAppType as ApplicationType,
        answers,
      });

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

  if (!selectedAppType) {
    return (
      <PageWrapper>
        <div className="container mx-auto px-4 sm:px-6 w-full max-w-5xl">
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
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="google-form-container px-4">
      <div className="mx-auto max-w-[770px]">
        {/* Header Image */}
        <div className="rounded-xl overflow-hidden mb-3 shadow-sm aspect-[16/5] bg-muted border border-white/5">
          <img 
            src={config.categorySettings?.[selectedAppType]?.image || config.statusImageUrl} 
            alt="Category Banner" 
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "https://raw.githubusercontent.com/idontknow901/Application/main/public/placeholder.svg")}
          />
        </div>

        {/* Category Info (Page 1) or Section Title (Page 2+) */}
        <div className="google-form-header-card p-6 sm:p-8">
          <h1 className="text-3xl font-normal text-foreground mb-4">
             {selectedAppType} Application
          </h1>
          
          {currentStep === 1 ? (
             <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                {config.categorySettings?.[selectedAppType]?.description}
             </div>
          ) : (
             <div className="space-y-4">
               <div className="inline-block bg-primary text-white px-4 py-1.5 rounded-sm font-bold text-base uppercase tracking-wider">
                 Section: {currentStep}
               </div>
               {activeSteps[currentStep - 1]?.name && (
                 <p className="text-lg font-bold text-foreground">{activeSteps[currentStep - 1].name}</p>
               )}
               {activeSteps[currentStep - 1]?.description && (
                 <p className="text-sm text-foreground font-medium">{activeSteps[currentStep - 1].description}</p>
               )}
             </div>
          )}
          
          <div className="border-t border-white/5 pt-4 mt-4">
            <p className="text-sm text-red-500 font-medium">* Indicates required question</p>
          </div>
        </div>

        {/* Dynamic Questions */}
        <div className="space-y-3">
          {stepQuestions.map((q) => (
            <div key={q.id} className="google-form-question-card">
              <label className="text-base font-medium text-foreground block mb-6">
                {q.label} {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              <div className="w-full">
                {q.type === "textarea" ? (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full border-b border-white/10 bg-transparent py-2 text-foreground focus:outline-none focus:border-primary transition-all resize-y min-h-[40px] text-sm"
                    placeholder="Your answer"
                  />
                ) : q.type === "select" ? (
                   <select
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full border-b border-white/10 bg-transparent py-2 text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer text-sm"
                    >
                      <option value="" disabled className="bg-card">Choose</option>
                      {q.options?.map((o) => (
                        <option key={o} value={o} className="bg-card text-foreground">{o}</option>
                      ))}
                    </select>
                ) : q.type === "boolean" ? (
                  <div className="space-y-3">
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${answers[q.id] === opt ? "border-primary shadow-[0_0_10px_hsla(var(--primary),0.5)]" : "border-white/10 group-hover:border-white/20 bg-background/40"}`}>
                          {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <input type="radio" checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="hidden" />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full border-b border-white/10 bg-transparent py-2 text-foreground focus:outline-none focus:border-primary transition-all text-sm"
                    placeholder="Your answer"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mt-8 mb-4 overflow-hidden py-2 px-4">
             {activeSteps.map((_, i) => (
               <div key={i} className="flex items-center shrink-0">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${currentStep === i + 1 ? "bg-primary text-white border-primary shadow-lg scale-110" : currentStep > i + 1 ? "bg-primary/20 text-primary border-primary/20" : "bg-background/40 text-muted-foreground border-white/5"}`}>
                   {i + 1}
                 </div>
                 {i < activeSteps.length - 1 && (
                   <div className={`w-6 sm:w-12 h-[2px] transition-all mx-1 ${currentStep > i + 1 ? "bg-primary/30" : "bg-white/5"}`} />
                 )}
               </div>
             ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            {currentStep < maxStep ? (
              <button
                onClick={() => {
                   setCurrentStep((s) => s + 1);
                }}
                disabled={!canGoNext}
                className="google-form-btn-next"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                   if(confirm("Are you sure you want to submit?")) {
                      handleSubmit();
                   }
                }}
                disabled={!canGoNext}
                className="google-form-btn-next"
              >
                Submit
              </button>
            )}
            
            {currentStep > 1 && (
              <button
                onClick={() => {
                  setCurrentStep((s) => s - 1);
                }}
                className="google-form-btn-back font-medium"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => {
                if(confirm("Change category? Current progress will be lost.")) {
                  setSelectedAppType(null);
                  setAnswers({});
                  setCurrentStep(1);
                }
              }}
              className="google-form-btn-clear"
            >
              Change category
            </button>

            <button 
              onClick={() => {
                if(confirm("Clear form? All progress will be lost.")) {
                  setAnswers({});
                }
              }}
              className="google-form-btn-clear"
            >
              Clear form
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
            <h2 className="text-2xl font-medium text-muted-foreground/60 transition-colors hover:text-muted-foreground select-none">EROI Forms</h2>
            <p className="text-[10px] text-muted-foreground/40 mt-4 uppercase tracking-[0.2em] font-medium">Never submit passwords through EROI Forms.</p>
        </div>
      </div>
    </div>
  );
};

export default Apply;
