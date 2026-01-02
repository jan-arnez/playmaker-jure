"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings, Globe, Mail, Shield, Search } from "lucide-react";
import { toast } from "sonner";

interface SettingsFormProps {
  initialSettings: Record<string, unknown>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async (category: string, keys: string[]) => {
    setSaving(true);
    try {
      const settingsToSave = keys.map((key) => ({
        key,
        value: settings[key],
        category,
      }));

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="trust" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Trust System
        </TabsTrigger>
        <TabsTrigger value="homepage" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Homepage
        </TabsTrigger>
        <TabsTrigger value="seo" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          SEO
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic platform settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={(settings["general.platformName"] as string) || "Playmaker"}
                  onChange={(e) => updateSetting("general.platformName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={(settings["general.supportEmail"] as string) || ""}
                  onChange={(e) => updateSetting("general.supportEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input
                  id="currency"
                  value={(settings["general.defaultCurrency"] as string) || "EUR"}
                  onChange={(e) => updateSetting("general.defaultCurrency", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Platform Fee (%)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={(settings["general.platformFeePercent"] as number) || 5}
                  onChange={(e) => updateSetting("general.platformFeePercent", Number(e.target.value))}
                />
              </div>
            </div>
            <Button
              onClick={() => saveSettings("general", [
                "general.platformName",
                "general.supportEmail", 
                "general.defaultCurrency",
                "general.platformFeePercent"
              ])}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save General Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Trust System Settings */}
      <TabsContent value="trust">
        <Card>
          <CardHeader>
            <CardTitle>Trust System Settings</CardTitle>
            <CardDescription>Configure user trust levels and strike system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newUserTrust">New User Trust Level</Label>
                <Input
                  id="newUserTrust"
                  type="number"
                  min="0"
                  max="5"
                  value={(settings["trust.newUserTrustLevel"] as number) || 0}
                  onChange={(e) => updateSetting("trust.newUserTrustLevel", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strikesForBan">Strikes for Ban</Label>
                <Input
                  id="strikesForBan"
                  type="number"
                  min="1"
                  value={(settings["trust.strikesForBan"] as number) || 3}
                  onChange={(e) => updateSetting("trust.strikesForBan", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banDuration">Ban Duration (days)</Label>
                <Input
                  id="banDuration"
                  type="number"
                  min="1"
                  value={(settings["trust.banDurationDays"] as number) || 30}
                  onChange={(e) => updateSetting("trust.banDurationDays", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strikeExpiry">Strike Expiry (days)</Label>
                <Input
                  id="strikeExpiry"
                  type="number"
                  min="1"
                  value={(settings["trust.strikeExpiryDays"] as number) || 90}
                  onChange={(e) => updateSetting("trust.strikeExpiryDays", Number(e.target.value))}
                />
              </div>
            </div>
            <Button
              onClick={() => saveSettings("trust", [
                "trust.newUserTrustLevel",
                "trust.strikesForBan",
                "trust.banDurationDays",
                "trust.strikeExpiryDays"
              ])}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Trust Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Homepage Settings */}
      <TabsContent value="homepage">
        <Card>
          <CardHeader>
            <CardTitle>Homepage Settings</CardTitle>
            <CardDescription>Customize homepage content and sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={(settings["homepage.heroTitle"] as string) || ""}
                  onChange={(e) => updateSetting("homepage.heroTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Textarea
                  id="heroSubtitle"
                  value={(settings["homepage.heroSubtitle"] as string) || ""}
                  onChange={(e) => updateSetting("homepage.heroSubtitle", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showStats"
                    checked={(settings["homepage.showStats"] as boolean) ?? true}
                    onCheckedChange={(checked: boolean) => updateSetting("homepage.showStats", checked)}
                  />
                  <Label htmlFor="showStats">Show Stats Section</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showTestimonials"
                    checked={(settings["homepage.showTestimonials"] as boolean) ?? true}
                    onCheckedChange={(checked: boolean) => updateSetting("homepage.showTestimonials", checked)}
                  />
                  <Label htmlFor="showTestimonials">Show Testimonials</Label>
                </div>
              </div>
            </div>
            <Button
              onClick={() => saveSettings("homepage", [
                "homepage.heroTitle",
                "homepage.heroSubtitle",
                "homepage.showStats",
                "homepage.showTestimonials"
              ])}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Homepage Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SEO Settings */}
      <TabsContent value="seo">
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Configure search engine optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={(settings["seo.metaTitle"] as string) || ""}
                  onChange={(e) => updateSetting("seo.metaTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={(settings["seo.metaDescription"] as string) || ""}
                  onChange={(e) => updateSetting("seo.metaDescription", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={(settings["seo.ogImage"] as string) || ""}
                  onChange={(e) => updateSetting("seo.ogImage", e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => saveSettings("seo", [
                "seo.metaTitle",
                "seo.metaDescription",
                "seo.ogImage"
              ])}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save SEO Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Settings */}
      <TabsContent value="email">
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={(settings["email.fromName"] as string) || "Playmaker"}
                  onChange={(e) => updateSetting("email.fromName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={(settings["email.fromEmail"] as string) || ""}
                  onChange={(e) => updateSetting("email.fromEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderHours">Reminder Hours Before</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min="1"
                  value={(settings["email.reminderHoursBefore"] as number) || 24}
                  onChange={(e) => updateSetting("email.reminderHoursBefore", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bookingConfirmation"
                  checked={(settings["email.bookingConfirmationEnabled"] as boolean) ?? true}
                  onCheckedChange={(checked: boolean) => updateSetting("email.bookingConfirmationEnabled", checked)}
                />
                <Label htmlFor="bookingConfirmation">Booking Confirmations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="reminderEnabled"
                  checked={(settings["email.reminderEnabled"] as boolean) ?? true}
                  onCheckedChange={(checked: boolean) => updateSetting("email.reminderEnabled", checked)}
                />
                <Label htmlFor="reminderEnabled">Booking Reminders</Label>
              </div>
            </div>
            <Button
              onClick={() => saveSettings("email", [
                "email.fromName",
                "email.fromEmail",
                "email.reminderHoursBefore",
                "email.bookingConfirmationEnabled",
                "email.reminderEnabled"
              ])}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
