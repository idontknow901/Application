import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PageWrapper from "@/components/PageWrapper";

const Index = () => {
  const { config } = useAppStore();
  const isOpen = config.recruitmentOpen;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Empty effect matching requirements
  }, []);

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative h-[calc(100vh-8rem)] flex items-center justify-center overflow-hidden max-w-[100vw]">
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="font-sans text-5xl md:text-7xl lg:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/40 drop-shadow-lg tracking-tight">
              Epic Rail of India
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-8 font-medium text-muted-foreground"
          >
            Level up your experience. Join India's most immersive and technologically advanced railway community on Discord.
          </motion.p>

          {/* Recruitment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-10 flex justify-center"
          >
            {isOpen ? (
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold shadow-lg border backdrop-blur-md bg-primary/10 border-primary/30 text-primary">
                Recruitment: ONLINE
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold shadow-lg border backdrop-blur-md bg-destructive/10 border-destructive/30 text-destructive">
                Recruitment: OFFLINE
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {isOpen ? (
              <Link
                to="/apply"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg overflow-hidden shadow-[0_0_20px_hsla(262,83%,58%,0.4)] hover:shadow-[0_0_30px_hsla(262,83%,58%,0.6)] transition-all"
              >
                Launch Application
              </Link>
            ) : (
              <p className="text-muted-foreground text-lg bg-card/50 border backdrop-blur-md inline-block px-8 py-4 rounded-xl shadow-lg">
                Systems are offline. Check back later!
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* No bottom containers since this page is non-scrollable content only. */}
    </PageWrapper>
  );
};

export default Index;
