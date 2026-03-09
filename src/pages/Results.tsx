import { CheckCircle2, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";

const Results = () => {
  const { applications: apps, loading, config } = useAppStore(true);

  if (loading) return null;

  const accepted = apps.filter((a) => a.status === "Accepted");
  const rejected = apps.filter((a) => a.status === "Rejected");

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-4xl">
        <h1
          className="font-display text-4xl font-bold text-center mb-12 text-bg-primary"
        >
          Application Results
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Accepted */}
          <div
            className="glass-card p-6 border-border"
            style={{ background: "hsl(var(--card) / 0.4)" }}
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
                  <div
                    key={a.id}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected */}
          <div
            className="glass-card p-6 border-border"
            style={{ background: "hsl(var(--card) / 0.4)" }}
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
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-crimson/10 px-4 py-3"
                  >
                    <p className="font-semibold text-foreground">
                      {a.discordUsername}
                    </p>
                    <span className="text-xs font-mono text-crimson">{a.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Results;
