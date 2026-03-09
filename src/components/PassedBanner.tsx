import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

const PassedBanner = () => {
  const { applications } = useAppStore();
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Check if user has a stored discord username and was accepted
    const saved = localStorage.getItem("epic-rail-user-discord");
    if (saved) {
      const lowerQ = saved.trim().toLowerCase();
      const app = applications.find(a => a.id.toLowerCase() === lowerQ || a.discordUsername.toLowerCase() === lowerQ);
      if (app && app.status === "Accepted") {
        setUsername(app.discordUsername);
        setShow(true);
      }
    }
  }, [applications]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-500 to-primary shadow-lg shadow-primary/20"
        >
          <PartyPopper className="w-5 h-5 mr-2 text-white" />
          <span className="font-bold text-white text-sm">
            🎉 Congratulations {username}! Your application has been ACCEPTED! Welcome aboard!
          </span>
          <button onClick={() => setShow(false)} className="ml-4 text-primary-foreground/70 hover:text-primary-foreground">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PassedBanner;
