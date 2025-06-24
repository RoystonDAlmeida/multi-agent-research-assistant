import { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResearchContext } from '@/contexts/ResearchContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';
import ReactModal from 'react-modal';
import { Helmet } from 'react-helmet-async';

const History = () => {
  const { queries, queriesLoading, deleteQuery, isDeleting } = useResearchContext();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredQueries = queries?.filter(query => 
    query.topic.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'web-research': return 'bg-yellow-100 text-yellow-800';
      case 'compilation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  // Handler for delete with toast
  const handleDelete = async (queryId: string) => {
    setDeletingId(queryId);
    try {
      await new Promise<void>((resolve, reject) => {
        deleteQuery(queryId, {
          onSuccess: () => {
            toast({ title: 'Research query deleted successfully!'});
            resolve();
          },
          onError: (error: any) => {
            toast({ title: error?.message || 'Failed to delete research query'});
            reject(error);
          },
        });
      });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Multi Agent Research Assistant | History</title>
      </Helmet>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Research History</h1>
            <label htmlFor="history-search" className="sr-only">Search research topics</label>
            <Input
              id="history-search"
              name="search"
              autoComplete="off"
              placeholder="Search research topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Research Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {queriesLoading ? (
                <div className="text-center py-8">Loading history...</div>
              ) : filteredQueries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No matching research found.' : 'No research history yet.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQueries.map((query) => (
                    <div key={query.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{query.topic}</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Depth:</span> {query.depth}
                            </div>
                            <div>
                              <span className="font-medium">Format:</span> {query.format}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(query.created_at).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Updated:</span> {new Date(query.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                          {query.perspectives && query.perspectives.length > 0 && (
                            <div className="mb-4">
                              <span className="text-sm font-medium text-gray-600">Perspectives:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {query.perspectives.map((perspective, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {perspective}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(query.status)}`}>
                            {getStatusText(query.status)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (query.status === 'completed') {
                                  navigate(`/results?id=${query.id}`);
                                } else {
                                  navigate(`/progress?id=${query.id}`);
                                }
                              }}
                            >
                              {query.status === 'completed' ? 'View Results' : 'View Progress'}
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="ml-1"
                              disabled={isDeleting || deletingId === query.id}
                              onClick={() => setConfirmDeleteId(query.id)}
                              aria-label="Delete research query"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <ReactModal
        isOpen={!!confirmDeleteId}
        onRequestClose={() => setConfirmDeleteId(null)}
        contentLabel="Confirm Delete"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40"
        overlayClassName=""
        style={{ content: { border: 'none', background: 'none', padding: 0 } }}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
          <h2 className="text-lg font-semibold mb-4">Delete Research Query?</h2>
          <p className="mb-6">Are you sure you want to delete this research query? This action cannot be undone.</p>
          <div className="flex justify-center gap-4">
            <Button
              variant="destructive"
              disabled={isDeleting || (confirmDeleteId && deletingId === confirmDeleteId)}
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
              }}
            >
              Yes, Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
};

export default History;
