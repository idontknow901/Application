import { Link, useLocation } from "react-router-dom";


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
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
          <span className="font-sans text-base sm:text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors truncate max-w-[120px] sm:max-w-none">
            Epic Rail of India
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar ml-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${pathname === link.to
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsla(262,83%,58%,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
