import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PreviewContentProps {
  results: any;
}

// Displays a formatted preview of the research summary and sections
const PreviewContent = ({ results }: PreviewContentProps) => {
  // Extract sections from results (if any)
  const sections = (results.content as any)?.sections || [];
  
  // Format markdown-like content to HTML for display
  const formatMarkdownContent = (content: string) => {
    if (!content) return content;
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')               // italic
      .replace(/^## (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/^# (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[h])(.+)/gm, '<p class="mb-4">$1</p>')
      .replace(/^<p class="mb-4"><\/p>/gm, '');
  };

  // Utility to linkify [n] citations for clickable navigation
  function linkifyCitations(text: string) {
    return text.replace(/\[(\d+)\]/g, (match, n) =>
      `<a href="#source-${n}" class="citation-link" onclick="event.preventDefault();const el=document.getElementById('source-${n}');if(el){el.scrollIntoView({behavior:'smooth'});el.classList.add('highlight');setTimeout(()=>el.classList.remove('highlight'),2000);}">${match}</a>`
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Research Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Executive Summary Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h3>
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: linkifyCitations(formatMarkdownContent(results.summary || 'No summary available')) 
              }}
            />
          </div>
          
          {/* Detailed Analysis Sections */}
          {sections.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Analysis</h3>
              <div className="space-y-6">
                {sections.map((section: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {section.title}
                    </h4>
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: linkifyCitations(formatMarkdownContent(section.content || 'No content available')) 
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviewContent;
