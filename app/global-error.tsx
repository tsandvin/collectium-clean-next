"use client";

import { useEffect } from "react";
import { CollectiumSystemPage } from "@/components/system/CollectiumSystemPage";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("Collectium global error", error);
  }, [error]);

  return (
    <html lang="no">
      <body>
        <CollectiumSystemPage variant="error" errorId={error.digest} />
      </body>
    </html>
  );
}
