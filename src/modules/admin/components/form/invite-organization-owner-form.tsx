"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDialog } from "@/context/dialog-context";
import { authClient } from "@/modules/auth/lib/auth-client";

const formSchema = z.object({
  email: z.email(),
});

interface InviteOrganizationOwnerFormProps {
  organizationId: string;
}

export function InviteOrganizationOwnerForm({
  organizationId,
}: InviteOrganizationOwnerFormProps) {
  const { setIsDialogOpen } = useDialog();
  const t = useTranslations("AdminModule.inviteOrganizationOwnerForm");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit({ email }: z.infer<typeof formSchema>) {
    const { error } = await authClient.organization.inviteMember({
      organizationId,
      email,
      role: "owner",
    });

    if (error) {
      form.setError("root", {
        message: error.message,
      });
      return;
    }

    toast.success(t("successMessage"));
    setIsDialogOpen(false);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input placeholder={t("emailPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!form.formState.isValid && form.formState.errors.root?.message && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{form.formState.errors.root?.message}</AlertTitle>
          </Alert>
        )}
        <Button
          className="w-full"
          variant="secondary"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {t("invite")}
        </Button>
      </form>
    </Form>
  );
}
