import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign } from "./campaigns.api";

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });
    },
  });
}
