import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResearchQuery } from '@/types/research';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Backend URL for API requests
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Custom hook to manage research queries, results, and feedback
export const useResearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const lastRefreshRef = useRef<number>(0);

  // Fetch user's research queries with polling and real-time updates
  const { data: queries, isLoading: queriesLoading } = useQuery({
    queryKey: ['research-queries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('research_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch research results for the user
  const { data: results } = useQuery({
    queryKey: ['research-results', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('research_results')
        .select(`*, research_queries!inner(user_id)`)
        .eq('research_queries.user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000, // Poll every 60 seconds
  });

  // Real-time subscription for research query and result updates
  useEffect(() => {
    if (!user) {
      // Clean up any previous channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Throttled refresh function to avoid excessive updates
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) {
        return;
      }
      lastRefreshRef.current = now;
      queryClient.invalidateQueries({ queryKey: ['research-queries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['research-results', user?.id] });
    };

    // Create a new channel for this user with a unique name per session
    const uniqueSuffix = Math.random().toString(36).substring(2, 10);
    const channelName = `research_queries:user=${user.id}:${uniqueSuffix}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Listen for research_queries changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'research_queries',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // Show completion notification if status changed to completed
        if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
          toast.success(`Research "${payload.new.topic}" is complete! Click to view results.`, {
            duration: 10000,
            action: {
              label: 'View Results',
              onClick: () => {
                window.location.href = `/results?id=${payload.new.id}`;
              }
            }
          });
        }
        // Throttled refresh
        setTimeout(() => {
          throttledRefresh();
        }, 500);
      }
    );

    // Listen for research_results changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'research_results',
      },
      (payload) => {
        setTimeout(() => {
          throttledRefresh();
        }, 500);
      }
    );

    // Listen for agent_progress changes to trigger query updates
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_progress',
      },
      (payload) => {
        // Refresh less frequently for agent progress
        setTimeout(() => {
          throttledRefresh();
        }, 1000);
      }
    );

    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        // Channel successfully subscribed
      }
      if (error) {
        // Handle subscription error if needed
      }
    });

    // Cleanup function to remove channel on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);

  // Mutation to create a new research query
  const createQueryMutation = useMutation({
    mutationFn: async (query: ResearchQuery) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('research_queries')
        .insert({
          user_id: user.id,
          topic: query.topic,
          depth: query.depth,
          perspectives: query.perspectives,
          format: query.format,
          sources: query.sources,
          timeframe: query.timeframe,
          status: 'initializing'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['research-queries', user?.id] });
      toast.success('Research query created successfully!');
      // Start the Python backend research workflow
      startPythonResearchWorkflow(data.id);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create research query');
    },
  });

  // Function to start the backend research workflow via API
  const startPythonResearchWorkflow = async (queryId: string) => {
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      // Call the Python backend API
      const response = await fetch(`${BACKEND_URL}/api/research-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ queryId })
      });
      let responseData;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from Python backend');
      }
      if (!response.ok) {
        toast.error(responseData.detail || responseData.error || 'Failed to start research workflow');
        return;
      }
      if (responseData.langsmithEnabled) {
        toast.success('AI agents are researching with LangSmith tracking enabled!');
      } else {
        toast.success('AI agents are now researching your topic!');
      }
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['research-queries', user?.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start research workflow');
    }
  };

  // Mutation to submit user feedback on research results
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ resultId, feedback, rating }: { resultId: string, feedback: string, rating?: number }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          result_id: resultId,
          user_id: user.id,
          feedback_text: feedback,
          rating: rating || 5
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });

  // Mutation to delete a research query
  const deleteQueryMutation = useMutation({
    mutationFn: async (queryId: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('research_queries')
        .delete()
        .eq('id', queryId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-queries', user?.id] });
      toast.success('Research query deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete research query');
    },
  });

  // Return all state, queries, and mutation functions for use in components
  return {
    queries,
    results,
    queriesLoading,
    createQuery: createQueryMutation.mutate,
    isCreating: createQueryMutation.isPending,
    submitFeedbackMutation,
    deleteQuery: deleteQueryMutation.mutate,
    isDeleting: deleteQueryMutation.isPending,
  };
};
