import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Clock, Train, Zap, Globe } from "lucide-react";
import { store } from "@/lib/store";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PageWrapper from "@/components/PageWrapper";

const Index = () => {
  const config = store.getConfig();
  const isOpen = config.recruitmentOpen;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particles following cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: 0, y: 0 };
    const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      // Spawn particles on move
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          size: Math.random() * 3 + 1,
        });
      }
    };
    window.addEventListener("mousemove", handleMouse);

    // Background floating dots
    const bgDots: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 60; i++) {
      bgDots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bg dots
      bgDots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        // Connect dots near cursor
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        if (dist < 200) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `hsla(38, 92%, 50%, ${0.15 * (1 - dist / 200)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 92%, 60%, ${0.3 + (dist < 200 ? 0.4 * (1 - dist / 200) : 0)})`;
        ctx.fill();
      });

      // Draw cursor particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 92%, 60%, ${p.life * 0.6})`;
        ctx.fill();
      }

      // Cursor glow
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
      gradient.addColorStop(0, "hsla(38, 92%, 50%, 0.08)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Canvas Background */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy/90 to-background z-[1]" />

        {/* Animated geometric shapes */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                borderColor: "hsl(var(--gold) / 0.1)",
                width: 100 + i * 80,
                height: 100 + i * 80,
                left: `${20 + i * 12}%`,
                top: `${10 + i * 15}%`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Train className="w-16 h-16 mx-auto mb-6" style={{ color: "hsl(var(--gold))" }} />
            </motion.div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-gradient-gold drop-shadow-lg">
              Epic Rail of India
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-8"
            style={{ color: "hsl(var(--gold-light) / 0.9)" }}
          >
            Join India's most immersive railway simulation community on Discord.
            Experience the thrill of the rails like never before.
          </motion.p>

          {/* Recruitment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-10"
          >
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold ${isOpen
                  ? "gradient-gold text-primary-foreground animate-pulse-glow"
                  : "bg-crimson/20 border border-crimson/50 text-crimson"
                }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${isOpen ? "bg-emerald animate-pulse" : "bg-crimson"
                  }`}
              />
              Recruitment: {isOpen ? "OPEN" : "CLOSED"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {isOpen ? (
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl gradient-gold font-bold text-lg hover:scale-105 transition-transform shadow-xl"
                style={{ color: "hsl(var(--navy))" }}
              >
                Begin Application <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <p className="text-gold-light/70 text-lg glass-card inline-block px-8 py-4">
                ⏸ Applications are currently paused. Check back soon!
              </p>
            )}
          </motion.div>
        </div>

        {/* Animated train track at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="train-track w-full" />
        </div>
      </section>

      {/* Scrolling Marquee */}
      <ScrollingMarquee />

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-4xl font-bold text-center mb-16"
        >
          Why Join <span className="text-gradient-gold">Epic Rail?</span>
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
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
              className="glass-card p-8 text-center hover:scale-[1.02] transition-transform group"
              style={{ background: "hsl(var(--navy) / 0.6)" }}
            >
              <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center gradient-gold group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7" style={{ color: "hsl(var(--navy))" }} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-gold-light">
                {feature.title}
              </h3>
              <p className="text-foreground/70">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
};

export default Index;
