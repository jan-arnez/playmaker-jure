"use client";

import { useState } from "react";
import { AlertTriangle, Mail, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";

interface VerificationBannerProps {
  userEmail?: string;
  className?: string;
  onVerified?: () => void;
}

export function VerificationBanner({ 
  userEmail, 
  className,
  onVerified,
}: VerificationBannerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerified = () => {
    setIsVerified(true);
    onVerified?.();
  };

  if (isVerified) {
    return (
      <Alert className={className} variant="default">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertTitle>Email Verified!</AlertTitle>
        <AlertDescription>
          Your email has been verified. You can now make bookings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Alert className={className} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Email Verification Required</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span>Please verify your email to make reservations.</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowDialog(true)}
            className="w-fit"
          >
            <Mail className="mr-2 h-4 w-4" />
            Verify Now
          </Button>
        </AlertDescription>
      </Alert>

      <EmailVerificationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onVerified={handleVerified}
        userEmail={userEmail}
      />
    </>
  );
}
