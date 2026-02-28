"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";

type AnimationVariant = "fade-up" | "fade-in" | "slide-left" | "slide-right";

interface AnimatedSectionProps {
  children: React.ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
  id?: string;
}

const variants: Record<AnimationVariant, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
};

export default function AnimatedSection({
  children,
  variant = "fade-up",
  delay = 0,
  className,
  id,
}: AnimatedSectionProps) {
  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants[variant]}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
