"use client";

import { useState } from "react";
import { 
  Bell, 
  Globe, 
  Lock, 
  Moon, 
  Sun, 
  Trash2, 
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { authClient } from "@/modules/auth/lib/auth-client";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    bookingReminders: true,
    promotions: false,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const isEmailVerified = session?.user?.emailVerified;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Settings"
        description="Manage your account preferences"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-3xl">
        {/* Email Verification Section - Show only if not verified */}
        {!isEmailVerified && (
          <section className="rounded-xl border-2 border-amber-500/50 overflow-hidden bg-amber-500/5">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Verify Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify your email to make reservations and unlock all features
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowVerificationDialog(true)}
                className="bg-amber-500 hover:bg-amber-600 shrink-0"
              >
                Verify Now
              </Button>
            </div>
          </section>
        )}

        {/* Show verified badge if already verified */}
        {isEmailVerified && (
          <section className="rounded-xl border border-green-500/30 overflow-hidden bg-green-500/5">
            <div className="px-6 py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700">Email Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Your email is verified. You can make reservations.
                </p>
              </div>
            </div>
          </section>
        )}
        {/* Notifications Section */}
        <section className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="divide-y divide-border/50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                id="email-notif"
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, email: checked }))
                }
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notif" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
              </div>
              <Switch
                id="push-notif"
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, push: checked }))
                }
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-reminders" className="font-medium">Booking Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded before your sessions</p>
              </div>
              <Switch
                id="booking-reminders"
                checked={notifications.bookingReminders}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, bookingReminders: checked }))
                }
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotions" className="font-medium">Promotional Emails</Label>
                <p className="text-sm text-muted-foreground">Receive offers and promotions</p>
              </div>
              <Switch
                id="promotions"
                checked={notifications.promotions}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, promotions: checked }))
                }
              />
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
            <Sun className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Appearance</h3>
          </div>
          <div className="divide-y divide-border/50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred theme</p>
              </div>
              <Select defaultValue="system">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </span>
                  </SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Language</Label>
                <p className="text-sm text-muted-foreground">Choose display language</p>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sl">Slovenščina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <div className="divide-y divide-border/50">
            <Dialog>
              <DialogTrigger asChild>
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left">
                  <div className="space-y-0.5">
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your password</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.current}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, current: e.target.value }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.new}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, new: e.target.value }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Update Password</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-red-500/30 overflow-hidden">
          <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/30 flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-500">Danger Zone</h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive">Yes, delete my account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </main>

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onVerified={() => {
          setShowVerificationDialog(false);
          router.refresh();
        }}
        userEmail={session?.user?.email}
      />
    </div>
  );
}
