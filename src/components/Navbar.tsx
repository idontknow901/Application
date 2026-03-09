import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Train } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/apply", label: "Apply" },
  { to: "/results", label: "Results" },
  { to: "/track", label: "Track" },
  { to: "/admin", label: "Admin" },
];

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl"
      style={{ background: "hsl(var(--card))" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Train className="w-8 h-8 text-primary" />
          <span className="font-display text-lg font-bold text-primary hidden sm:inline">
            Epic Rail of India
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.to
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:text-primary hover:bg-primary/10"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
