"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface ReservationResponse {
  success?: boolean;
  message?: string;
  error?: string;
  booking?: {
    id: string;
    facilityName: string;
    courtName: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}

export default function ReservePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReservationResponse | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({ error: "Invalid reservation token" });
      setLoading(false);
      return;
    }

    // Process reservation
    fetch(`/api/reserve/${token}`, {
      method: "GET",
    })
      .then(async (response) => {
        const data = await response.json();
        setResult(data);
      })
      .catch((error) => {
        console.error("Reservation error:", error);
        setResult({ error: "Failed to process reservation" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Processing your reservation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <CardTitle>Reservation Failed</CardTitle>
            </div>
            <CardDescription>
              {result.error === "Reservation link has expired"
                ? "This reservation link has expired. The slot has been offered to the next person in the waitlist."
                : result.error === "This reservation link has expired"
                  ? "This reservation link has expired."
                  : result.error === "This slot is no longer available"
                    ? "This slot is no longer available for booking."
                    : result.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result?.success && result.booking) {
    const startTime = new Date(result.booking.startTime);
    const endTime = new Date(result.booking.endTime);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>Booking Confirmed!</CardTitle>
            </div>
            <CardDescription>
              Your reservation has been successfully confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Facility:</span>
                <span className="text-sm font-medium">{result.booking.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Court:</span>
                <span className="text-sm font-medium">{result.booking.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">
                  {format(startTime, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm font-medium">
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium capitalize">{result.booking.status}</span>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                View My Bookings
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="w-full"
                variant="outline"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Unknown error occurred</p>
        </CardContent>
      </Card>
    </div>
  );
}

