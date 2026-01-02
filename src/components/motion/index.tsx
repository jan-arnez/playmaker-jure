"use client";

import { motion, HTMLMotionProps, Variants, AnimatePresence } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// ANIMATION PRESETS - Consistent timing and easing across the app
// ============================================================================

// Premium easing curve - smooth deceleration, feels luxurious
export const premiumEase = [0.22, 1, 0.36, 1] as const;

// Spring config for hover interactions - snappy but not jarring
export const hoverSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

// Default durations
export const durations = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.6,
};

// ============================================================================
// SHARED VARIANTS
// ============================================================================

export const fadeInUpVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 16 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: durations.normal,
      ease: premiumEase,
    }
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: premiumEase,
    }
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 12 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: premiumEase,
    },
  },
};

export const scaleInVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: premiumEase,
    },
  },
};

// ============================================================================
// FADE IN SECTION - Viewport-based reveal with subtle upward slide
// ============================================================================

interface FadeInSectionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  once?: boolean;
  threshold?: number;
}

export const FadeInSection = forwardRef<HTMLDivElement, FadeInSectionProps>(
  ({ 
    children, 
    className, 
    delay = 0, 
    direction = "up",
    distance = 16,
    once = true,
    threshold = 0.1,
    ...props 
  }, ref) => {
    const getInitialPosition = () => {
      switch (direction) {
        case "up": return { y: distance };
        case "down": return { y: -distance };
        case "left": return { x: distance };
        case "right": return { x: -distance };
        case "none": return {};
        default: return { y: distance };
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...getInitialPosition() }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once, amount: threshold }}
        transition={{
          duration: durations.normal,
          delay,
          ease: premiumEase,
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeInSection.displayName = "FadeInSection";

// ============================================================================
// STAGGER CONTAINER - For staggered list reveals
// ============================================================================

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  once?: boolean;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ 
    children, 
    className, 
    staggerDelay = 0.07,
    initialDelay = 0.1,
    once = true,
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.1 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: initialDelay,
            },
          },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerContainer.displayName = "StaggerContainer";

// ============================================================================
// STAGGER ITEM - Child of StaggerContainer
// ============================================================================

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerItemVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = "StaggerItem";

// ============================================================================
// MOTION CARD - Card with subtle hover effects
// ============================================================================

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
  enableHover?: boolean;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ 
    children, 
    className, 
    hoverScale = 1.02,
    hoverY = -4,
    enableHover = true,
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={enableHover ? { 
          scale: hoverScale, 
          y: hoverY,
        } : undefined}
        transition={hoverSpring}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionCard.displayName = "MotionCard";

// ============================================================================
// MOTION BUTTON - Button with micro-interaction on hover
// ============================================================================

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
  variant?: "scale" | "lift" | "both";
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, variant = "scale", ...props }, ref) => {
    const getHoverState = () => {
      switch (variant) {
        case "scale": return { scale: 1.03 };
        case "lift": return { y: -2 };
        case "both": return { scale: 1.02, y: -2 };
        default: return { scale: 1.03 };
      }
    };

    return (
      <motion.button
        ref={ref}
        whileHover={getHoverState()}
        whileTap={{ scale: 0.98 }}
        transition={hoverSpring}
        className={className}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";

// ============================================================================
// ANIMATE PRESENCE WRAPPER - For smooth enter/exit transitions
// ============================================================================

interface AnimatedPresenceProps {
  children: ReactNode;
  mode?: "wait" | "sync" | "popLayout";
  initial?: boolean;
}

export function AnimatedPresence({ 
  children, 
  mode = "wait",
  initial = false 
}: AnimatedPresenceProps) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}

// ============================================================================
// FADE TRANSITION - For content that fades in/out
// ============================================================================

interface FadeTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  show?: boolean;
}

export const FadeTransition = forwardRef<HTMLDivElement, FadeTransitionProps>(
  ({ children, className, show = true, ...props }, ref) => {
    return (
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast, ease: "easeOut" }}
            className={className}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

FadeTransition.displayName = "FadeTransition";

// ============================================================================
// SLIDE TRANSITION - For tab/panel content switches
// ============================================================================

interface SlideTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
}

export const SlideTransition = forwardRef<HTMLDivElement, SlideTransitionProps>(
  ({ children, className, direction = "up", ...props }, ref) => {
    const getSlideOffset = () => {
      switch (direction) {
        case "left": return { x: 20, y: 0 };
        case "right": return { x: -20, y: 0 };
        case "up": return { x: 0, y: 12 };
        case "down": return { x: 0, y: -12 };
        default: return { x: 0, y: 12 };
      }
    };

    const offset = getSlideOffset();

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...offset }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, ...offset }}
        transition={{ duration: durations.fast, ease: premiumEase }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

SlideTransition.displayName = "SlideTransition";

// ============================================================================
// SCALE IN - For elements that scale in from slightly smaller
// ============================================================================

interface ScaleInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, className, delay = 0, once = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once, amount: 0.1 }}
        transition={{
          duration: durations.normal,
          delay,
          ease: premiumEase,
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

ScaleIn.displayName = "ScaleIn";

// ============================================================================
// HOVER SCALE WRAPPER - Simple scale on hover for any element
// ============================================================================

interface HoverScaleProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, className, scale = 1.03, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: 0.98 }}
        transition={hoverSpring}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

HoverScale.displayName = "HoverScale";

// ============================================================================
// PAGE TRANSITION WRAPPER - For page-level transitions
// ============================================================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durations.fast, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// CHIP ANIMATION - For animated filter chips with AnimatePresence
// ============================================================================

interface AnimatedChipProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  layoutId?: string;
}

export const AnimatedChip = forwardRef<HTMLDivElement, AnimatedChipProps>(
  ({ children, className, layoutId, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        layout
        layoutId={layoutId}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { type: "spring", stiffness: 500, damping: 30 },
          layout: { type: "spring", stiffness: 500, damping: 30 },
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedChip.displayName = "AnimatedChip";


