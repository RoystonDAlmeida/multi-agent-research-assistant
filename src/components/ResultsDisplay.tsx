import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import ExportActions from './ExportActions';
import PreviewContent from './PreviewContent';
import SourcesDisplay from './SourcesDisplay';
import PerspectivesDisplay from './PerspectivesDisplay';
import FeedbackForm from './FeedbackForm';

interface ResultsDisplayProps {
  query: any;
  onFeedback: (feedback: string) => void;
}

// Displays the research results, sources, perspectives, and feedback for a given query
const ResultsDisplay = ({ query, onFeedback }: ResultsDisplayProps) => {
  const [selectedFormat, setSelectedFormat] = useState('preview');

  // Fetch real research results from database for the given query
  const { data: results, isLoading } = useQuery({
    queryKey: ['research-results', query.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_results')
        .select('*')
        .eq('query_id', query.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!query.id && query.status === 'completed',
  });

  // Show loading state while fetching results
  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading research results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no results are available yet
  if (!results) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-white/20">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No results available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Parse JSON fields safely with proper type casting and filtering
  const allSources = (results.sources as any)?.sources || [];
  const sources = allSources.filter((source: any) => 
    source.title && 
    source.title !== 'source' && 
    source.title.trim() !== ''
  );
  const perspectives = (results.perspectives as any)?.perspectives || [];

  return (
    <div className="space-y-6">
      {/* Header card with export actions */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Research Complete
            </CardTitle>
            <ExportActions query={query} results={results} />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for preview, sources, perspectives, and feedback */}
      <Tabs value={selectedFormat} onValueChange={setSelectedFormat} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
          <TabsTrigger value="perspectives">Perspectives ({perspectives.length})</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <PreviewContent results={results} />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <SourcesDisplay results={results} />
        </TabsContent>

        <TabsContent value="perspectives" className="space-y-4">
          <PerspectivesDisplay results={results} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackForm results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsDisplay;
