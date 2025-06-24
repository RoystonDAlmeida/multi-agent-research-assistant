import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResearchContext } from '@/contexts/ResearchContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import ProgressTracker from '@/components/ProgressTracker';
import { Helmet } from 'react-helmet-async';

/**
 * ProgressPage component displays the real-time progress of a specific research query.
 * It retrieves the query ID from the URL, finds the corresponding query from the
 * ResearchContext, and uses the ProgressTracker component to visualize the status.
 * It also handles authentication, ensuring only logged-in users can view the page.
 */
const ProgressPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Retrieves all research queries from the research context.
  const { queries } = useResearchContext();
  // Retrieves user authentication state and loading status.
  const { user, loading } = useAuth();

  // Parses the query ID from the URL's search parameters.
  const params = new URLSearchParams(location.search);
  const queryId = params.get('id');

  // Memoizes the specific query object based on the queryId from the URL.
  // This prevents unnecessary recalculations on re-renders unless queries or queryId change.
  const query = useMemo(() => queries?.find((q) => q.id === queryId), [queries, queryId]);

  /**
   * Effect hook to enforce authentication.
   * If the authentication check is complete and no user is logged in,
   * it redirects the user to the authentication page.
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Renders a null state during the initial auth loading to prevent flickering.
  if (loading || !user || !queries) return null;

  // Handles the case where the query ID from the URL does not match any existing queries.
  if (!query) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Research query not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Back to Dashboard</button>
      </div>
    );
  }

  // Renders the main content of the progress page.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Multi Agent Research Assistant | Progress</title>
      </Helmet>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* The ProgressTracker component is responsible for displaying the research steps and their status. */}
        <ProgressTracker currentState={query.status} query={query} />
      </div>
    </div>
  );
};

export default ProgressPage; 