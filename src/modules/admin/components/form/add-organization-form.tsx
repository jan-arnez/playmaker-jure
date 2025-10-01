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
import { createOrganization } from "../../actions/create-organization";

export function CreateOrganizationForm() {
  const { setIsDialogOpen } = useDialog();
  const t = useTranslations("AdminModule.createOrganizationForm");

  const formSchema = z.object({
    name: z.string().min(1, t("nameRequired")),
    slug: z.string().min(1, t("slugRequired")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  async function onSubmit({ name, slug }: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);

    const result = await createOrganization(formData);

    if (result.error) {
      form.setError("root", {
        message: result.error,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
              <FormControl>
                <Input placeholder={t("slugPlaceholder")} {...field} />
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
          {t("create")}
        </Button>
      </form>
    </Form>
  );
}
