import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useInfiniteBlogs(queryParams = {}) {
  return useInfiniteQuery(
    ['blogs', queryParams],
    ({ pageParam = '' }) => api.get(`/blogs?cursor=${pageParam}&${new URLSearchParams(queryParams)}`).then((res) => res.data),
    {
      getNextPageParam: (lastPage) => (lastPage.length === 20 ? lastPage[lastPage.length - 1]._id : undefined),
    }
  );
}