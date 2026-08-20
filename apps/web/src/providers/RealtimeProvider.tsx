import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeSocket } from "../lib/realtime/socket";

type JobStatusEvent = {
  type: "email_job_updated";
  emailJobId: string;
  campaignId: string;
  status:
    | "WAITING"
    | "ACTIVE"
    | "RETRYING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELED";
  attemptsMade: number;
  updatedAt: string;
};

const RealtimeContext = createContext(false);

export function RealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(realtimeSocket.connected);

  useEffect(() => {
    function handleConnect() {
      setIsConnected(true);
      console.info("Connected to Mailflow realtime server.");
    }

    function handleReady(payload: { connectedAt: string }) {
      console.info("Realtime connection ready:", payload);
    }

    function handleDisconnect(reason: string) {
      setIsConnected(false);
      console.info("Disconnected from realtime server:", reason);
    }

    function handleJobUpdated(payload: JobStatusEvent) {
      console.info("Email job updated:", payload);

      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "overview"],
      });
    }

    realtimeSocket.on("connect", handleConnect);
    realtimeSocket.on("realtime:ready", handleReady);
    realtimeSocket.on("disconnect", handleDisconnect);
    realtimeSocket.on("email_job_updated", handleJobUpdated);

    realtimeSocket.connect();

    return () => {
      realtimeSocket.off("connect", handleConnect);
      realtimeSocket.off("realtime:ready", handleReady);
      realtimeSocket.off("disconnect", handleDisconnect);
      realtimeSocket.off("email_job_updated", handleJobUpdated);
      realtimeSocket.disconnect();
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={isConnected}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeConnection() {
  return useContext(RealtimeContext);
}
