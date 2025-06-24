import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import ResearchForm from '@/components/ResearchForm';
import { useResearchContext } from '@/contexts/ResearchContext';
import { ResearchQuery } from '@/types/research';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, FileText } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { Helmet } from 'react-helmet-async';

/**
 * Dashboard component serves as the main landing page for authenticated users.
 * It displays a carousel of recent research queries, provides a form to initiate
 * new research, and handles UI feedback for ongoing processes like query creation
 * and agent errors.
 */
const Dashboard = () => {
  // Authentication and navigation hooks.
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  // Research context for accessing queries and creation functions.
  const { queries, createQuery, isCreating } = useResearchContext();
  // UI hooks for displaying toasts and managing component refs.
  const { toast } = useToast();
  const carouselRef = useRef<HTMLDivElement>(null);
  // State to track the newly created query for highlighting and scrolling.
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [lastQueryCount, setLastQueryCount] = useState(0);

  /**
   * Effect hook to enforce authentication. Redirects to the '/auth' page
   * if the user is not logged in after the initial loading check is complete.
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Track query count changes and scroll to top when new query is added
  useEffect(() => {
    if (queries) {
      setLastQueryCount(queries.length);
    }
  }, [queries]);

  /**
   * Handles the submission of the research form.
   * It calls the `createQuery` function and then attempts to highlight the new
   * query in the carousel after a short delay.
   * @param query The research query data from the form.
   */
  const handleQuerySubmit = (query: ResearchQuery) => {
    createQuery(query);
    
    // Immediately scroll to the top of the page to show the carousel.
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // After a delay, identify the newest query and set it as selected.
    // The delay allows time for the query list to update.
    setTimeout(() => {
      if (queries && queries.length > 0) {
        const newestQuery = queries[0]; // Queries are ordered by created_at desc.
        setSelectedQueryId(newestQuery.id);
      }
    }, 1000);
  };

  /**
   * Effect hook that triggers a scroll-into-view animation for a newly created query.
   * It polls the DOM until the new carousel item is rendered, then smoothly scrolls to it.
   * This provides a clear visual confirmation that the new query has been added.
   */
  useEffect(() => {
    if (selectedQueryId && queries) {
      // The `tryScroll` function repeatedly checks for the existence of the new carousel item.
      const tryScroll = (attempts = 0) => {
        const firstCarouselItem = document.querySelector('[data-carousel-item="0"]');
        if (firstCarouselItem) {
          // Scroll to top first, then scroll the item into view for a better experience.
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            firstCarouselItem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }, 300);
        } else if (attempts < 15) {
          // Retry after a short delay if the item is not yet in the DOM.
          setTimeout(() => tryScroll(attempts + 1), 200);
        }
      };
      tryScroll();
    }
  }, [selectedQueryId, queries]);

  /**
   * Effect hook to display error toasts for the selected query.
   * It uses the `useRealtimeProgress` hook to monitor agent statuses and shows a
   * destructive toast if any agent reports an error.
   */
  const agentProgress = useRealtimeProgress(selectedQueryId);
  useEffect(() => {
    const errorAgent = agentProgress.find(agent => agent.status === 'error');
    if (errorAgent) {
      toast({
        title: 'Agent Error',
        description: `${errorAgent.name} failed: ${errorAgent.currentTask || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  }, [agentProgress, toast]);

  /**
   * Navigates to the results page for a given query.
   * @param queryId The ID of the query.
   */
  const handleViewResults = (queryId: string) => {
    navigate(`/results?id=${queryId}`);
  };

  /**
   * Navigates to the progress page for a given query.
   * @param queryId The ID of the query.
   */
  const handleViewProgress = (queryId: string) => {
    navigate(`/progress?id=${queryId}`);
  };

  /**
   * Returns a status icon component based on the query's status.
   * @param status The current status of the research query.
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'waiting':
      case 'initializing':
      case 'researching':
      case 'analyzing':
      case 'fact_checking':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  /**
   * Returns a user-friendly string for a given status key.
   * @param status The current status of the research query.
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'waiting':
        return 'Initializing';
      case 'initializing':
        return 'Setting up';
      case 'researching':
        return 'Researching';
      case 'analyzing':
        return 'Analyzing';
      case 'fact_checking':
        return 'Fact Checking';
      default:
        return 'Unknown';
    }
  };

  /**
   * Returns Tailwind CSS classes for styling a status badge.
   * @param status The current status of the research query.
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'waiting':
      case 'initializing':
      case 'researching':
      case 'analyzing':
      case 'fact_checking':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Displays a loading screen while the user's authentication status is being checked.
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-sm">MA</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Returns null if the user is not authenticated, as the useEffect will handle the redirect.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Multi Agent Research Assistant | Dashboard</title>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Research Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start a new research or view your recent research results
            </p>
          </div>

          {/* Carousel for displaying recent research queries */}
          <div className="w-full max-w-3xl mx-auto" ref={carouselRef}>
            <Carousel>
              <CarouselContent>
                {queries && queries.length > 0 ? (
                  queries.slice(0, 10).map((query, index) => (
                    <CarouselItem key={query.id} id={`carousel-item-${query.id}`} data-carousel-item={index}>
                      <Card className={`h-full flex flex-col justify-between shadow-md ${
                        // Highlight the card if it's the one that was just created.
                        selectedQueryId === query.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}>
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate mb-2 text-lg">
                              {query.topic}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(query.status)}
                              <Badge className={getStatusColor(query.status)}>
                                {getStatusText(query.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(query.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {query.status === 'completed' ? (
                            <Button
                              size="sm"
                              onClick={() => handleViewResults(query.id)}
                              className="mt-4"
                            >
                              View Results
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleViewProgress(query.id)}
                              className="mt-4 bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              View Progress
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))
                ) : (
                  // Empty state for the carousel when there are no queries.
                  <CarouselItem data-carousel-item="0">
                    <Card className="h-full flex flex-col justify-center items-center shadow-md">
                      <CardContent className="p-8 text-center flex flex-col items-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Research Queries</h3>
                        <p className="text-gray-500">Start your first research using the form below!</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </div>

          {/* The main form for initiating a new research query. */}
          <div className="w-full">
            <ResearchForm onSubmit={handleQuerySubmit} isLoading={isCreating} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;