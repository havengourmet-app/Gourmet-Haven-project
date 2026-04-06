import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useRealtimeOrders({ filters = [], onOrderChange, enabled = true }) {
  const callbackRef = useRef(onOrderChange);
  const normalizedFilters = Array.isArray(filters) && filters.length > 0 ? filters : [{}];
  const filtersKey = JSON.stringify(normalizedFilters);
  const channelName = `orders-${filtersKey.length}-${Array.from(filtersKey).reduce(
    (hash, character) => hash + character.charCodeAt(0),
    0
  )}`;

  useEffect(() => {
    callbackRef.current = onOrderChange;
  }, [onOrderChange]);

  useEffect(() => {
    if (!supabase || !enabled || typeof callbackRef.current !== "function") {
      return undefined;
    }

    const channel = supabase.channel(channelName);

    normalizedFilters.forEach((subscription) => {
      channel.on(
        "postgres_changes",
        {
          event: subscription.event || "*",
          schema: "public",
          table: "orders",
          ...(subscription.filter ? { filter: subscription.filter } : {})
        },
        (payload) => {
          callbackRef.current?.(payload);
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, enabled, filtersKey]);
}
