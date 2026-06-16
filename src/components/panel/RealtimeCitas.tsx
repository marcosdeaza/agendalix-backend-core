"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeCitas({ negocioId }: { negocioId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`panel-refresh-${negocioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "citas", filter: `negocio_id=eq.${negocioId}` },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [negocioId, router]);

  return null;
}
