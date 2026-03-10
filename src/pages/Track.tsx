import { useState } from "react";
import { Search, Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { useAppStore } from "@/lib/store";
import PageWrapper from "@/components/PageWrapper";
import TrainLoader from "@/components/TrainLoader";
import { db } from "@/lib/firebase";
import { collection, query as fsQuery, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";

const statusConfig = {
  Pending: { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Application Received — Under Review" },
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

    try {
      const searchKey = query.trim();
      const appRef = collection(db, "applications");

      // 1. Try search by ID (Exact uppercase)
      const qById = fsQuery(appRef, where("id", "==", searchKey.toUpperCase()));
      const snapById = await getDocs(qById);

      if (!snapById.empty) {
        const app = snapById.docs[0].data();
        setResult({ status: app.status, id: app.id, username: app.discordUsername });
      } else {
        // 2. Try search by Username (This is exact match)
        const qByUsr = fsQuery(appRef, where("discordUsername", "==", searchKey));
        const snapByUsr = await getDocs(qByUsr);

        if (!snapByUsr.empty) {
          const app = snapByUsr.docs[0].data();
          setResult({ status: app.status, id: app.id, username: app.discordUsername });
        } else {
          setResult("not_found");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Database query failed");
      setResult("not_found");
    }
    setSearching(false);
  };

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 max-w-xl">
        <h1
          className="font-display text-3xl sm:text-4xl font-bold text-center mb-3 text-bg-primary"
        >
          Track Your Application
        </h1>
        <p className="text-center text-muted-foreground mb-6 sm:mb-10 text-sm sm:text-base">
          Enter your Application ID or Discord Username
        </p>

        <div
          className="glass-card p-5 sm:p-8 bg-card/40"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="APP-XXXXXX or username"
              className="flex-1 rounded-lg border border-border/30 bg-background/10 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm text-sm sm:text-base"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center sm:w-auto w-full"
            >
              <Search className="w-5 h-5 mr-2 sm:mr-0" />
              <span className="sm:hidden">Search</span>
            </button>
          </div>

          {searching && (
            <div className="mt-6">
              <TrainLoader text="Searching records..." />
            </div>
          )}

          {result && !searching && (
            <div
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
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Track;
