"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterAccordionProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function FilterAccordion({ 
  title, 
  children, 
  isOpen = false, 
  onToggle,
  className = "" 
}: FilterAccordionProps) {
  const [open, setOpen] = useState(isOpen);

  const handleToggle = () => {
    setOpen(!open);
    onToggle?.();
  };

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <Button
        variant="ghost"
        onClick={handleToggle}
        className="w-full justify-between p-4 h-auto hover:bg-gray-50"
        aria-expanded={open}
        aria-controls={`accordion-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="font-medium text-left">{title}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>
      
      <AnimatePresence>
        {open && (
          <motion.div
            id={`accordion-${title.toLowerCase().replace(/\s+/g, '-')}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FilterCheckbox({ 
  id, 
  label, 
  checked, 
  onCheckedChange, 
  icon,
  className = "" 
}: FilterCheckboxProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
      >
        {icon}
        {label}
      </label>
    </div>
  );
}
