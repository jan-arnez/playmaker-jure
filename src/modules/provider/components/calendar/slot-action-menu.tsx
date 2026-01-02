"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Ban, Calendar, X } from "lucide-react";

interface SlotActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReservation: () => void;
  position?: { x: number; y: number };
}

export function SlotActionMenu({
  isOpen,
  onClose,
  onBlock,
  onReservation,
  position,
}: SlotActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          className="justify-start w-full"
          onClick={() => {
            onBlock();
            onClose();
          }}
        >
          <Ban className="mr-2 h-4 w-4" />
          Block Slot
        </Button>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              onReservation();
              onClose();
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Create Reservation
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full text-gray-500"
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

