import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useAuth() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    retry: false,
    onError: () => {
      localStorage.removeItem('jwt');
    },
  });
}