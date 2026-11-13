import { QueryClient } from "@tanstack/react-query";

// Los datos vienen de Supabase; cada useQuery define su propio queryFn (ver lib/api.ts).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
