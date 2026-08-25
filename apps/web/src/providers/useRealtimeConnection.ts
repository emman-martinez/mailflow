import { useContext } from "react";
import { RealtimeContext } from "./realtime-context";

export function useRealtimeConnection() {
  return useContext(RealtimeContext);
}
