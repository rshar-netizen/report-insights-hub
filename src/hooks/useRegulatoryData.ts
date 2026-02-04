import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryDataApi, MetricDataResult, ScrapeResult, DataSource } from '@/lib/api/regulatoryData';
import { useToast } from '@/hooks/use-toast';

export function useMetricData(metricId: string, rssdId: string = '623806') {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['metric', metricId, rssdId],
    queryFn: () => regulatoryDataApi.fetchMetric(metricId, { rssdId }),
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    meta: {
      onError: (error: Error) => {
        toast({
          title: 'Failed to fetch metric data',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  });
}

export function useAllMetrics(rssdId: string = '623806') {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['allMetrics', rssdId],
    queryFn: () => regulatoryDataApi.fetchAllMetrics(rssdId),
    staleTime: 1000 * 60 * 15,
    retry: 2,
  });
}

export function useScrapeSource() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      source, 
      options 
    }: { 
      source: DataSource; 
      options?: { rssdId?: string; metric?: string; bankName?: string } 
    }) => {
      return regulatoryDataApi.scrapeSource(source, options);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Data scraped successfully',
          description: `Retrieved data from ${data.source.toUpperCase()}`,
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['metric'] });
        queryClient.invalidateQueries({ queryKey: ['allMetrics'] });
      } else {
        toast({
          title: 'Scraping failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Scraping error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRefreshMetric() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = useCallback(async (metricId: string, rssdId: string = '623806') => {
    try {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['metric', metricId, rssdId] });
      await queryClient.refetchQueries({ queryKey: ['metric', metricId, rssdId] });
      
      toast({
        title: 'Metric refreshed',
        description: `${metricId.toUpperCase()} data has been updated`,
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [queryClient, toast]);

  return { refresh };
}

// Hook for checking data freshness
export function useDataFreshness(scrapedAt: string | undefined) {
  if (!scrapedAt) return { isFresh: false, age: 'Unknown' };
  
  const scraped = new Date(scrapedAt);
  const now = new Date();
  const diffMs = now.getTime() - scraped.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let age = '';
  if (diffDays > 0) {
    age = `${diffDays}d ago`;
  } else if (diffHours > 0) {
    age = `${diffHours}h ago`;
  } else {
    age = `${diffMins}m ago`;
  }

  // Consider data fresh if less than 24 hours old
  const isFresh = diffHours < 24;

  return { isFresh, age };
}
