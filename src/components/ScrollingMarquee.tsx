import { useAppStore, type ApplicationType } from "@/lib/store";

const ScrollingMarquee = () => {
  const { config } = useAppStore();
  const openTypes = config.openApplicationTypes || [];

  if (!config.recruitmentOpen || openTypes.length === 0) return null;

  const text = openTypes.map((t: ApplicationType) => `🚂 ${t} Applications Open`).join("   •   ");

  if (openTypes.length === 1) {
    return (
      <div className="w-full py-3 border-y text-center" style={{ borderColor: "hsl(var(--gold) / 0.3)", background: "hsl(var(--navy) / 0.8)" }}>
        <span className="text-sm font-semibold tracking-wider" style={{ color: "hsl(var(--gold-light))" }}>
          {text}
        </span>
      </div>
    );
  }

  const repeated = `${text}   •   ${text}   •   ${text}   •   `;

  return (
    <div className="w-full overflow-hidden py-3 border-y" style={{ borderColor: "hsl(var(--gold) / 0.3)", background: "hsl(var(--navy) / 0.8)" }}>
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="text-sm font-semibold tracking-wider" style={{ color: "hsl(var(--gold-light))" }}>
          {repeated}
        </span>
      </div>
    </div>
  );
};

export default ScrollingMarquee;
