import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Restaurant, RestaurantFilters } from '@/types/restaurant';

export const useRestaurants = (searchQuery?: string, filters?: RestaurantFilters) => {
  const { data: restaurants, isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['restaurants', searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/restaurants?${params.toString()}`);
      return response.data;
    },
  });

  return {
    restaurants,
    isLoading,
    error,
  };
}; 