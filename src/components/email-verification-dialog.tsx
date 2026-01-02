"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  userEmail?: string;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  userEmail,
}: EmailVerificationDialogProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (open && codeSent) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, codeSent]);

  const sendCode = async () => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
        throw new Error(data.error || "Failed to send verification code");
      }

      setCodeSent(true);
      setCooldown(60);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send code");
      toast.error(error instanceof Error ? error.message : "Failed to send code");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (fullCodeOverride?: string) => {
    const fullCode = fullCodeOverride || code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Email verified successfully!");
      onVerified();
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = useCallback((index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        // Small delay to show the last digit before submitting
        // Pass fullCode directly to avoid stale state issue
        setTimeout(() => verifyCode(fullCode), 100);
      }
    }
  }, [code]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split("").concat(Array(6 - pastedData.length).fill("")).slice(0, 6);
      setCode(newCode);
      const nextEmptyIndex = newCode.findIndex(c => !c);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const resetState = () => {
    setCode(["", "", "", "", "", ""]);
    setCodeSent(false);
    setError(null);
    setAttemptsRemaining(3);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            {codeSent 
              ? "Enter the 6-digit code we sent to your email"
              : "We need to verify your email before you can make bookings"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!codeSent ? (
            // Step 1: Send code
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                {userEmail && (
                  <p className="text-sm text-muted-foreground">
                    A verification code will be sent to:<br />
                    <span className="font-medium text-foreground">{userEmail}</span>
                  </p>
                )}
              </div>
              <Button 
                onClick={sendCode} 
                disabled={isSending || cooldown > 0}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Step 2: Enter code
            <div className="space-y-4">
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {inputRefs.current[index] = el;}}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={cn(
                      "w-12 h-14 text-center text-2xl font-bold",
                      error && "border-destructive"
                    )}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}

              <Button
                onClick={() => verifyCode()}
                disabled={isLoading || code.join("").length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Email
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendCode}
                  disabled={isSending || cooldown > 0}
                >
                  {cooldown > 0 
                    ? `Resend code in ${cooldown}s`
                    : "Didn't receive the code? Resend"
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
