import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PageWrapper from "@/components/PageWrapper";

const Index = () => {
  const { config } = useAppStore();
  const isOpen = config.recruitmentOpen;

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1115] via-[#161920] to-background z-[1]" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center max-w-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-primary drop-shadow-lg">
              Epic Rail of India
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 text-primary/80 px-2"
          >
            Join India's most immersive railway simulation community on Discord.
            Experience the thrill of the rails like never before.
          </motion.p>

          {/* Recruitment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-10 w-full"
          >
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-base sm:text-lg font-bold border transition-shadow ${isOpen
                ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,77,77,0.3)] hover:shadow-[0_0_40px_rgba(255,77,77,0.6)]"
                : "bg-red-500/20 border-red-500/50 text-red-500"
                }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-red-500"
                  }`}
              />
              Recruitment: {isOpen ? "OPEN" : "CLOSED"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="w-full flex justify-center"
          >
            {isOpen ? (
              <Link
                to="/apply"
                className="inline-flex w-[90%] sm:w-auto justify-center items-center gap-2 px-8 py-4 rounded-md bg-white border border-[#1e232b] text-background hover:bg-gray-200 transition-all font-bold text-lg uppercase shadow-xl"
              >
                Begin Application <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <p className="text-primary/70 text-base sm:text-lg bg-[#161920] border border-[#1e232b] rounded-md inline-block px-8 py-4">
                ⏸ Applications are currently paused. Check back soon!
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Scrolling Marquee */}
      <div className="overflow-hidden w-full bg-[#161920]">
        <ScrollingMarquee />
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 sm:py-20 overflow-hidden w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-4xl font-bold text-center mb-16"
        >
          Why Join <span className="text-primary">Epic Rail?</span>
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Users,
              title: "Active Community",
              desc: "Join hundreds of passionate railway enthusiasts in daily operations and events.",
            },
            {
              icon: Shield,
              title: "Professional Staff",
              desc: "Our trained team ensures a realistic and respectful experience for every member.",
            },
            {
              icon: Clock,
              title: "24/7 Operations",
              desc: "Trains run round the clock with scheduled services, special runs, and more.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-[#161920] border border-[#1e232b] rounded-md p-6 sm:p-8 text-center hover:border-primary transition-colors group"
            >
              <div className="w-14 h-14 rounded-md mx-auto mb-4 flex items-center justify-center bg-[#0F1115] border border-[#1e232b] group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
};

export default Index;
