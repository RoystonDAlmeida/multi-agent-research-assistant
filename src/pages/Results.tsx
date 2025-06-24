import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultsDisplay from '@/components/ResultsDisplay';
import { useResearchContext } from '@/contexts/ResearchContext';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

// Results page for displaying research results for a specific query
const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { queries } = useResearchContext();
  const { user, loading } = useAuth();

  // Get queryId from URL (?id=...)
  const params = new URLSearchParams(location.search);
  const queryId = params.get('id');

  // Redirect to /auth if not signed in (after loading)
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Wait for auth and queries to be ready
  if (loading || !user || !queries) {
    return null;
  }

  // Find the query object from context using the queryId
  const query = queries.find((q) => q.id === queryId);

  // If the query is not found, show a message and a button to go back
  if (!query) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Research query not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Back to Dashboard</button>
      </div>
    );
  }

  // Render the results page with header and results display
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Multi Agent Research Assistant | Results</title>
      </Helmet>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <ResultsDisplay query={query} onFeedback={() => {}} />
      </div>
    </div>
  );
};

export default ResultsPage; 