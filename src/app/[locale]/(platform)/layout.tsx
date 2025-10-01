import type { PropsWithChildren } from "react";
import { PlatformFooter } from "@/modules/platform/components/layout/platform-footer";

export default function PlatformLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-max min-h-screen">
      <main className="min-h-full h-max">{children}</main>
      <PlatformFooter />
    </div>
  );
}
