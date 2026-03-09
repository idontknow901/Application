import { Loader2 } from "lucide-react";

interface TrainLoaderProps {
  text?: string;
}

const TrainLoader = ({ text = "Loading..." }: TrainLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Glow behind */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
      </div>
      <p className="font-semibold text-primary/80 animate-pulse">{text}</p>
    </div>
  );
};

export default TrainLoader;
