import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CursorGlow = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed z-50 w-[400px] h-[400px] rounded-full"
      style={{
        background: "radial-gradient(circle, hsl(38 92% 50% / 0.12) 0%, transparent 70%)",
        left: pos.x - 200,
        top: pos.y - 200,
      }}
      animate={{ left: pos.x - 200, top: pos.y - 200 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
    />
  );
};

export default CursorGlow;
