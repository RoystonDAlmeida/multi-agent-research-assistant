import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SourcesDisplayProps {
  results: any;
}

// Displays the list of sources used in the research results
const SourcesDisplay = ({ results }: SourcesDisplayProps) => {
  // Extract and filter sources from the results
  const allSources = (results.sources as any)?.sources || [];
  const sources = allSources.filter((source: any) => 
    source.title && 
    source.title !== 'source' && 
    source.title.trim() !== ''
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Sources</CardTitle>
        <p className="text-gray-600">
          {sources.length} verified sources analyzed by AI research agents
        </p>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
          <div className="grid gap-4">
            {/* Render each source with title, URL, type, and optional scores */}
            {sources.map((source: any, index: number) => (
              <div id={`source-${index + 1}`} key={source.id || index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border source-item">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">{source.title}</h4>
                  {source.url && source.url !== '#' && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {source.url}
                    </a>
                  )}
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {source.type || 'academic'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[100px]">
                  {/* Optional reliability and relevance scores */}
                  {source.reliability && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-600">Reliability</div>
                      <div className="font-semibold text-green-600">{source.reliability}%</div>
                    </div>
                  )}
                  {source.relevance && (
                    <div>
                      <div className="text-xs text-gray-600">Relevance</div>
                      <div className="font-semibold text-blue-600">
                        {Math.round(source.relevance * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No sources available for this research query.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SourcesDisplay;
