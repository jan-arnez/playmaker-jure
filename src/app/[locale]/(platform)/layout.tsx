import type { PropsWithChildren } from "react";

export default function PlatformLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-max min-h-screen">
      <main className="min-h-full h-max">{children}</main>
    </div>
  );
}
