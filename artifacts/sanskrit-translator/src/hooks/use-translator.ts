import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { translateImage, translateText, getHistory, getStats } from "../lib/api";

export function useTranslateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: translateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    }
  });
}

export function useTranslateText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: translateText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    }
  });
}

export function useHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["history", limit],
    queryFn: () => getHistory(limit)
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getStats
  });
}
