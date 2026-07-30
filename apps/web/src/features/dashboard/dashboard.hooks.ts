import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardOverview, retryEmailJob } from "./dashboard.api";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 5_000,
  });
}

export function useRetryEmailJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryEmailJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}
