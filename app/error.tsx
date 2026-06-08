"use client";

import { useEffect } from "react";
import { CollectiumSystemPage } from "@/components/system/CollectiumSystemPage";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error }: ErrorPageProps) {
  useEffect(() => {
    console.error("Collectium page error", error);
  }, [error]);

  return <CollectiumSystemPage variant="error" errorId={error.digest} />;
}
