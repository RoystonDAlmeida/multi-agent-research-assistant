import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentProgress } from '@/types/research';

/**
 * Interface describing the raw shape of data from the 'agent_progress'
 * table in the database.
 */
interface DatabaseAgentProgress {
  id: string;
  query_id: string | null;
  agent_name: string;
  status: string | null;
  progress: number | null;
  current_task: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Custom hook `useRealtimeProgress` fetches and subscribes to real-time updates
 * for agent progress associated with a specific research query. It provides a
 * live view of each agent's status and current task.
 *
 * @param queryId The ID of the research query to monitor. If null, the hook will not fetch data.
 * @returns An array of `AgentProgress` objects, representing the latest state of each agent.
 */
export const useRealtimeProgress = (queryId: string | null) => {
  // State to store the processed progress of each agent.
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
  // Ref to hold the Supabase real-time channel instance.
  const channelRef = useRef<any>(null);
  // Ref to track the timestamp of the last fetch to prevent rate-limiting issues.
  const lastFetchRef = useRef<number>(0);

  /**
   * Main effect hook to manage data fetching and real-time subscriptions.
   * It sets up and tears down the Supabase channel and a polling interval.
   */
  useEffect(() => {
    // If there's no queryId, clear any existing progress and do nothing.
    if (!queryId) {
      setAgentProgress([]);
      return;
    }

    // Ensures that any previous channel subscription is removed before creating a new one.
    // This is important when the queryId changes.
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    /**
     * Fetches the latest progress for all agents for the given queryId.
     * It includes a debounce mechanism to avoid rapid-fire fetching.
     * After fetching, it processes the raw data to find the most recent update for each agent.
     */
    const fetchProgress = async () => {
      const now = Date.now();
      // Prevents fetching more than once every 500ms to avoid unnecessary load.
      if (now - lastFetchRef.current < 500) {
        return;
      }
      lastFetchRef.current = now;

      try {
        // Fetch all progress entries for the given query from the database.
        const { data, error } = await supabase
          .from('agent_progress')
          .select('*')
          .eq('query_id', queryId)
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching agent progress:", error);
          return;
        }
        
        if (data) {
          // Process the fetched data to get only the latest update for each unique agent.
          // This is necessary because the table stores a history of progress updates.
          const latestProgressByAgent = data.reduce((acc: Record<string, DatabaseAgentProgress>, item: DatabaseAgentProgress) => {
            if (!acc[item.agent_name] || new Date(item.updated_at || '') > new Date(acc[item.agent_name].updated_at || '')) {
              acc[item.agent_name] = item;
            }
            return acc;
          }, {});

          // Map the processed data to the `AgentProgress` type used by the frontend.
          const mappedProgress: AgentProgress[] = Object.values(latestProgressByAgent).map((item: DatabaseAgentProgress) => ({
            name: item.agent_name,
            status: (item.status as AgentProgress['status']) || 'waiting',
            progress: item.progress || 0,
            currentTask: item.current_task || undefined,
          }));
          
          setAgentProgress(mappedProgress);
        }
      } catch (error) {
        console.error("Caught error in fetchProgress:", error);
        return;
      }
    };

    // Perform an initial fetch when the component mounts or queryId changes.
    fetchProgress();

    // Create a unique channel name for the subscription to avoid client-side conflicts.
    const channelName = `agent-progress-${queryId}-${Date.now()}`;
    
    // Set up a Supabase real-time subscription channel.
    channelRef.current = supabase
      .channel(channelName)
      // Subscribe to all changes in the 'agent_progress' table for the current queryId.
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_progress',
          filter: `query_id=eq.${queryId}`,
        },
        (payload) => {
          // When a change is detected, re-fetch the progress data after a short delay
          // to batch multiple quick updates into a single fetch.
          setTimeout(() => {
            fetchProgress();
          }, 100);
        }
      )
      // Also subscribe to changes in the main 'research_queries' table.
      // This ensures agent progress is re-fetched if the overall query status changes.
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_queries',
          filter: `id=eq.${queryId}`,
        },
        (payload) => {
          // Also refresh when the main query status changes
          setTimeout(() => {
            fetchProgress();
          }, 100);
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('Supabase subscription error:', error);
        }
      });

    // Set up a periodic polling mechanism as a fallback to catch any updates
    // that might be missed by the real-time subscription.
    const intervalId = setInterval(() => {
      fetchProgress();
    }, 3000); // Refresh every 3 seconds

    // Cleanup function to be called when the component unmounts or queryId changes.
    return () => {
      if (channelRef.current) {
        // Removes the channel subscription from Supabase.
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clears the polling interval to prevent memory leaks.
      clearInterval(intervalId);
    };
  }, [queryId]);

  return agentProgress;
};
