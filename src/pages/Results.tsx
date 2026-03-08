import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";

const Results = () => {
  const { applications: apps, loading } = useAppStore();

  if (loading) return null;

  const accepted = apps.filter((a) => a.status === "Accepted");
  const rejected = apps.filter((a) => a.status === "Rejected");

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-4xl font-bold text-center mb-12 text-gradient-gold"
        >
          Application Results
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Accepted */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border-emerald/30"
            style={{ background: "hsl(var(--emerald) / 0.08)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald" />
              <h2 className="font-display text-2xl font-bold text-emerald">
                Successful Candidates
              </h2>
            </div>
            {accepted.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No accepted candidates yet
              </p>
            ) : (
              <div className="space-y-3">
                {accepted.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between rounded-lg bg-emerald/10 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {a.discordUsername}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.answers["q5"] || "General"}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald">{a.id}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Rejected */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 border-crimson/30"
            style={{ background: "hsl(var(--crimson) / 0.06)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-7 h-7 text-crimson" />
              <h2 className="font-display text-2xl font-bold text-crimson">
                Recent Reviews
              </h2>
            </div>
            {rejected.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rejected applications
              </p>
            ) : (
              <div className="space-y-3">
                {rejected.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between rounded-lg bg-crimson/10 px-4 py-3"
                  >
                    <p className="font-semibold text-foreground">
                      {a.discordUsername}
                    </p>
                    <span className="text-xs font-mono text-crimson">{a.id}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Results;
