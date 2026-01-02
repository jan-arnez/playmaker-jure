"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, Bell, Check, Calendar, AlertTriangle, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface EmailTemplate {
  subject: string;
  body: string;
}

interface EmailTemplateEditorProps {
  initialTemplates: Record<string, EmailTemplate>;
}

const defaultTemplates: Record<string, EmailTemplate> = {
  "email.template.bookingConfirmation": {
    subject: "Booking Confirmed - {{facilityName}}",
    body: `<p>Dear <strong>{{userName}}</strong>,</p>
<p>Your booking has been confirmed!</p>
<h2>Booking Details:</h2>
<ul>
<li>Facility: {{facilityName}}</li>
<li>Address: {{facilityAddress}}</li>
<li>Date: {{bookingDate}}</li>
<li>Time: {{bookingTime}}</li>
<li>Court: {{courtName}}</li>
<li>Price: {{price}}</li>
</ul>
<p>Please arrive 10 minutes before your scheduled time.</p>
<p>Best regards,<br/>The Playmaker Team</p>`,
  },
  "email.template.bookingReminder": {
    subject: "Reminder: Booking Tomorrow - {{facilityName}}",
    body: `<p>Hi <strong>{{userName}}</strong>,</p>
<p>This is a friendly reminder that you have a booking tomorrow!</p>
<h2>Booking Details:</h2>
<ul>
<li>Facility: {{facilityName}}</li>
<li>Address: {{facilityAddress}}</li>
<li>Date: {{bookingDate}}</li>
<li>Time: {{bookingTime}}</li>
</ul>
<p>We look forward to seeing you!</p>
<p>Best regards,<br/>The Playmaker Team</p>`,
  },
  "email.template.bookingCancellation": {
    subject: "Booking Cancelled - {{facilityName}}",
    body: `<p>Dear <strong>{{userName}}</strong>,</p>
<p>Your booking has been cancelled.</p>
<h2>Cancelled Booking:</h2>
<ul>
<li>Facility: {{facilityName}}</li>
<li>Date: {{bookingDate}}</li>
<li>Time: {{bookingTime}}</li>
</ul>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br/>The Playmaker Team</p>`,
  },
  "email.template.noShowWarning": {
    subject: "No-Show Warning - Strike Issued",
    body: `<p>Dear <strong>{{userName}}</strong>,</p>
<p>We noticed you did not attend your booking at <strong>{{facilityName}}</strong> on {{bookingDate}}.</p>
<p>A strike has been issued to your account. You currently have <strong>{{strikeCount}} strike(s)</strong>.</p>
<p style="color: #dc2626;"><strong>Please note:</strong> {{strikesForBan}} strikes will result in a temporary booking ban.</p>
<p>If this was an error, please contact us immediately.</p>
<p>Best regards,<br/>The Playmaker Team</p>`,
  },
  "email.template.welcome": {
    subject: "Welcome to Playmaker!",
    body: `<p>Hi <strong>{{userName}}</strong>,</p>
<p>Welcome to Playmaker! We're excited to have you join our community.</p>
<p>With Playmaker, you can:</p>
<ul>
<li>Find and book sports facilities near you</li>
<li>Discover new sports and activities</li>
<li>Manage your bookings easily</li>
</ul>
<p><a href="{{appUrl}}">Start exploring →</a></p>
<p>Best regards,<br/>The Playmaker Team</p>`,
  },
};

const templateMeta = {
  "email.template.bookingConfirmation": {
    name: "Booking Confirmation",
    icon: Check,
    description: "Sent when a booking is confirmed",
    variables: ["userName", "facilityName", "facilityAddress", "bookingDate", "bookingTime", "courtName", "price"],
  },
  "email.template.bookingReminder": {
    name: "Booking Reminder",
    icon: Bell,
    description: "Sent 24h before the booking",
    variables: ["userName", "facilityName", "facilityAddress", "bookingDate", "bookingTime"],
  },
  "email.template.bookingCancellation": {
    name: "Booking Cancellation",
    icon: Calendar,
    description: "Sent when a booking is cancelled",
    variables: ["userName", "facilityName", "facilityAddress", "bookingDate", "bookingTime"],
  },
  "email.template.noShowWarning": {
    name: "No-Show Warning",
    icon: AlertTriangle,
    description: "Sent when user doesn't show up",
    variables: ["userName", "facilityName", "bookingDate", "strikeCount", "strikesForBan"],
  },
  "email.template.welcome": {
    name: "Welcome Email",
    icon: Mail,
    description: "Sent when a new user registers",
    variables: ["userName", "appUrl"],
  },
};

// Sample data for live preview
const sampleData: Record<string, string> = {
  userName: "John Doe",
  userEmail: "john.doe@example.com",
  facilityName: "Sports Center Ljubljana",
  facilityAddress: "123 Main Street, Ljubljana",
  courtName: "Tennis Court 1",
  bookingDate: "January 15, 2026",
  bookingTime: "10:00 - 11:00",
  bookingPrice: "€25.00",
  strikeCount: "1",
  strikesForBan: "3",
  appUrl: "https://playmaker.si",
};

// Replace template variables with sample data
function replaceVariables(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => sampleData[key] || match);
}

export function EmailTemplateEditor({ initialTemplates }: EmailTemplateEditorProps) {
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>(() => {
    const merged = { ...defaultTemplates };
    Object.keys(initialTemplates).forEach(key => {
      if (initialTemplates[key]) {
        merged[key] = initialTemplates[key];
      }
    });
    return merged;
  });
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("email.template.bookingConfirmation");
  const [showPreview, setShowPreview] = useState(true);

  const updateTemplate = (key: string, field: "subject" | "body", value: string) => {
    setTemplates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const saveTemplate = async (key: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          value: templates[key],
          category: "email-templates",
          label: templateMeta[key as keyof typeof templateMeta]?.name,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("Email template saved!");
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const saveAllTemplates = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(templates).map(([key, value]) => ({
        key,
        value,
        category: "email-templates",
        label: templateMeta[key as keyof typeof templateMeta]?.name,
      }));

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("All email templates saved!");
    } catch {
      toast.error("Failed to save templates");
    } finally {
      setSaving(false);
    }
  };

  const currentMeta = templateMeta[activeTemplate as keyof typeof templateMeta];
  const CurrentIcon = currentMeta?.icon || Mail;
  const currentTemplate = templates[activeTemplate];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Design beautiful email notifications with the visual editor. Click "Variables" to insert dynamic content.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
            <TabsList className="flex flex-wrap h-auto gap-2 mb-6">
              {Object.entries(templateMeta).map(([key, meta]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <meta.icon className="h-4 w-4" />
                  {meta.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(templates).map(([key, template]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <CurrentIcon className="h-8 w-8 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium">{currentMeta?.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentMeta?.description}</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid lg:grid-cols-[250px_1fr] gap-6 items-start">
                    {/* Variables Legend */}
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <Label className="text-sm font-medium mb-3 block">Available Variables</Label>
                        <div className="space-y-2">
                          {currentMeta?.variables.map((variable) => (
                            <div 
                              key={variable}
                              className="group flex items-center justify-between p-2 bg-background rounded border text-xs font-mono cursor-pointer hover:border-primary transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(`{{${variable}}}`);
                                toast.success(`Copied {{${variable}}} to clipboard`);
                              }}
                              title="Click to copy"
                            >
                              <span>{`{{${variable}}}`}</span>
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3">
                          Click to copy variable to clipboard. Paste into editor to use.
                        </p>
                      </div>
                    </div>

                    {/* Editor */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-subject`}>Subject Line</Label>
                        <Input
                          id={`${key}-subject`}
                          value={template.subject}
                          onChange={(e) => updateTemplate(key, "subject", e.target.value)}
                          placeholder="Email subject..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email Body</Label>
                        <RichTextEditor
                          content={template.body}
                          onChange={(html) => updateTemplate(key, "body", html)}
                          placeholder="Start designing your email..."
                          variables={currentMeta?.variables || []}
                        />
                      </div>

                      <Button onClick={() => saveTemplate(key)} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save This Template
                      </Button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  {showPreview && (
                    <div className="space-y-2">
                      <Label>Live Preview</Label>
                      <div className="border rounded-lg overflow-hidden shadow-sm">
                        {/* Email Header */}
                        <div className="bg-gray-100 p-3 border-b">
                          <p className="text-sm text-muted-foreground">To: {sampleData.userEmail}</p>
                          <p className="font-medium">{replaceVariables(template.subject)}</p>
                        </div>
                        {/* Email Body */}
                        <div 
                          className="p-4 bg-white prose prose-sm max-w-none"
                          style={{ minHeight: "300px" }}
                          dangerouslySetInnerHTML={{ 
                            __html: replaceVariables(template.body)
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Preview shows sample data. Variables will be replaced when email is sent.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Button onClick={saveAllTemplates} disabled={saving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        Save All Templates
      </Button>
    </div>
  );
}
