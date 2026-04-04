import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeOrders({ scopeId, onOrderChange }) {
  useEffect(() => {
    if (!supabase || !scopeId || typeof onOrderChange !== "function") {
      return undefined;
    }

    const channel = supabase
      .channel(`orders:${scopeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders"
        },
        onOrderChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scopeId, onOrderChange]);
}
