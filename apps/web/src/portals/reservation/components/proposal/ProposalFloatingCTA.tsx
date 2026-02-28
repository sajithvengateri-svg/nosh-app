"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ProposalFloatingCTAProps {
  visible: boolean;
}

export default function ProposalFloatingCTA({
  visible,
}: ProposalFloatingCTAProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("proposal-hero");
    const acceptSection = document.getElementById("accept");

    if (!hero) return;

    let pastHero = false;
    let acceptVisible = false;

    const heroObs = new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry.isIntersecting;
        setShow(pastHero && !acceptVisible && visible);
      },
      { threshold: 0.1 },
    );

    const acceptObs = acceptSection
      ? new IntersectionObserver(
          ([entry]) => {
            acceptVisible = entry.isIntersecting;
            setShow(pastHero && !acceptVisible && visible);
          },
          { threshold: 0.1 },
        )
      : null;

    heroObs.observe(hero);
    if (acceptSection && acceptObs) acceptObs.observe(acceptSection);

    return () => {
      heroObs.disconnect();
      acceptObs?.disconnect();
    };
  }, [visible]);

  const handleClick = () => {
    document.getElementById("accept")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            onClick={handleClick}
            size="lg"
            className="bg-vf-gold hover:bg-vf-gold/90 text-white shadow-lg shadow-vf-gold/25 rounded-full px-6 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Accept Proposal
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
