"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, image, className, size = "md" }: UserAvatarProps) {
  // Generate initials from name
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {image && (
        <AvatarImage src={image} alt={name || "User avatar"} />
      )}
      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
