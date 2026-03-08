import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import TrainLoader from "@/components/TrainLoader";

const statusConfig = {
  Pending: { icon: Clock, color: "text-gold", bg: "bg-gold/10", label: "Application Received — Under Review" },
  Accepted: { icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald/10", label: "Congratulations! You've been Accepted 🎉" },
  Rejected: { icon: XCircle, color: "text-crimson", bg: "bg-crimson/10", label: "Thank you for applying. Unfortunately, your application was not successful." },
};

const Track = () => {
  const { applications, loading } = useAppStore();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<null | "not_found" | { status: string; id: string; username: string }>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    const lowerQ = query.trim().toLowerCase();
    const app = applications.find(a => a.id.toLowerCase() === lowerQ || a.discordUsername.toLowerCase() === lowerQ);
    if (app) {
      setResult({ status: app.status, id: app.id, username: app.discordUsername });
    } else {
      setResult("not_found");
    }
    setSearching(false);
  };

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-xl">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-4xl font-bold text-center mb-3 text-gradient-gold"
        >
          Track Your Application
        </motion.h1>
        <p className="text-center text-muted-foreground mb-10">
          Enter your Application ID or Discord Username
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8"
          style={{ background: "hsl(var(--navy) / 0.7)" }}
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="APP-XXXXXX or username"
              className="flex-1 rounded-lg border border-border/30 bg-background/10 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 backdrop-blur-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 rounded-lg gradient-gold text-primary-foreground font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {searching && (
            <div className="mt-6">
              <TrainLoader text="Searching records..." />
            </div>
          )}

          {result && !searching && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8"
            >
              {result === "not_found" ? (
                <div className="text-center py-6">
                  <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No application found. Please check your ID or username.
                  </p>
                </div>
              ) : (
                <div className={`rounded-xl p-6 ${statusConfig[result.status as keyof typeof statusConfig].bg}`}>
                  {(() => {
                    const cfg = statusConfig[result.status as keyof typeof statusConfig];
                    const Icon = cfg.icon;
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <Icon className={`w-8 h-8 ${cfg.color}`} />
                          <div>
                            <p className="font-bold text-foreground">{result.username}</p>
                            <p className="text-xs text-muted-foreground font-mono">{result.id}</p>
                          </div>
                        </div>
                        <p className={`font-medium ${cfg.color}`}>{cfg.label}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Track;
