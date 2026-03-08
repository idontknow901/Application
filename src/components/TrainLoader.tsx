import { motion } from "framer-motion";
import { Train } from "lucide-react";

interface TrainLoaderProps {
  text?: string;
}

const TrainLoader = ({ text = "Loading..." }: TrainLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative w-64 h-16">
        <div className="absolute bottom-2 left-0 right-0 train-track" />
        <motion.div
          className="absolute bottom-4"
          animate={{ x: ["-20%", "110%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        >
          <Train className="w-10 h-10 text-primary" />
        </motion.div>
        {/* Steam puffs */}
        <motion.div
          className="absolute bottom-10 left-4"
          animate={{ x: ["-20%", "110%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-muted-foreground/30"
            animate={{ y: [0, -20], opacity: [0.6, 0], scale: [1, 2] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      </div>
      <motion.p
        className="text-muted-foreground font-medium text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
};

export default TrainLoader;
