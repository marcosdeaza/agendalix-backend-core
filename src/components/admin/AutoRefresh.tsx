"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renderiza los datos del servidor cada `seconds` sin recargar la página. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
