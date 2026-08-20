import {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { realtimeSocket } from "../lib/realtime/socket";

const RealtimeContext = createContext(false);

export function RealtimeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    function handleConnect() {
      console.info("Connected to Mailflow realtime server.");
    }

    function handleReady(payload: { connectedAt: string }) {
      console.info("Realtime connection ready:", payload);
    }

    function handleDisconnect(reason: string) {
      console.info("Disconnected from realtime server:", reason);
    }

    realtimeSocket.on("connect", handleConnect);
    realtimeSocket.on("realtime:ready", handleReady);
    realtimeSocket.on("disconnect", handleDisconnect);
    realtimeSocket.connect();

    return () => {
      realtimeSocket.off("connect", handleConnect);
      realtimeSocket.off("realtime:ready", handleReady);
      realtimeSocket.off("disconnect", handleDisconnect);
      realtimeSocket.disconnect();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={realtimeSocket.connected}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeConnection() {
  return useContext(RealtimeContext);
}
