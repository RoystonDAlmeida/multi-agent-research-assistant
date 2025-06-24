import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerspectivesDisplayProps {
  results: any;
}

// Utility to linkify [n] citations for clickable navigation
function linkifyCitations(text: string) {
  return text.replace(/\[(\d+)\]/g, (match, n) =>
    `<a href="#source-${n}" class="citation-link" onclick="event.preventDefault();const el=document.getElementById('source-${n}');if(el){el.scrollIntoView({behavior:'smooth'});el.classList.add('highlight');setTimeout(()=>el.classList.remove('highlight'),2000);}">${match}</a>`
  );
}

// Displays multiple stakeholder perspectives for the research results
const PerspectivesDisplay = ({ results }: PerspectivesDisplayProps) => {
  // Extract perspectives from the results
  const perspectives = (results.perspectives as any)?.perspectives || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multiple Perspectives</CardTitle>
        <p className="text-gray-600">
          Analysis from {perspectives.length} different viewpoints by specialized AI agents
        </p>
      </CardHeader>
      <CardContent>
        {perspectives.length > 0 ? (
          <div className="grid gap-6">
            {/* Render each perspective with title, viewpoint, and supporting evidence */}
            {perspectives.map((perspective: any, index: number) => (
              <div key={perspective.id || index} className="p-6 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{perspective.title}</h4>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: linkifyCitations(perspective.viewpoint) }} />
                </div>
                {perspective.evidence && perspective.evidence.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded border">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Supporting Evidence:</h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {perspective.evidence.map((evidence: string, idx: number) => (
                        <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: linkifyCitations(evidence) }} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No alternative perspectives available for this research.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerspectivesDisplay;
