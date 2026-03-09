import { motion } from "framer-motion";
import { ReactNode } from "react";

const PageWrapper = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen pt-20 pb-12">
    {children}
  </div>
);

export default PageWrapper;
