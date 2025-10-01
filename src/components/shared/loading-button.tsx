import { Loader2 } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading: boolean;
}

export function LoadingButton(props: LoadingButtonProps) {
  const { loading, disabled, children, ...rest } = props;
  return (
    <Button disabled={loading || disabled} {...rest}>
      {loading ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}
