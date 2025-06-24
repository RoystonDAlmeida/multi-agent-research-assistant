import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ExportActionsProps {
  query: any;
  results: any;
}

// Provides export and sharing actions for research results
const ExportActions = ({ query, results }: ExportActionsProps) => {
  // Utility to strip markdown bold/italic for plain text export
  function stripMarkdown(text: string) {
    if (!text) return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1');     // italic
  }

  // Format research content for plain text export
  const formatContentForExport = () => {
    const sections = (results.content as any)?.sections || [];
    const sources = (results.sources as any)?.sources || [];
    const perspectives = (results.perspectives as any)?.perspectives || [];
    
    let content = `Research Report: ${results.title}\n\n`;
    content += `Topic: ${query.topic}\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    content += `Summary:\n${stripMarkdown(results.summary)}\n\n`;
    
    if (sections.length > 0) {
      content += `Detailed Analysis:\n\n`;
      sections.forEach((section: any, index: number) => {
        content += `${index + 1}. ${stripMarkdown(section.title)}\n`;
        content += `${stripMarkdown(section.content)}\n\n`;
      });
    }
    
    if (sources.length > 0) {
      content += `Sources:\n\n`;
      sources.forEach((source: any, index: number) => {
        if (source.title && source.title !== 'source') {
          content += `${index + 1}. ${stripMarkdown(source.title)}\n`;
          if (source.url && source.url !== '#') {
            content += `   URL: ${source.url}\n`;
          }
          if (source.type) {
            content += `   Type: ${source.type}\n`;
          }
          if (source.reliability) {
            content += `   Reliability: ${source.reliability}%\n`;
          }
          content += `\n`;
        }
      });
    }
    if (perspectives.length > 0) {
      content += `Perspectives:\n\n`;
      perspectives.forEach((perspective: any, idx: number) => {
        content += `${stripMarkdown(perspective.title)}\n${stripMarkdown(perspective.viewpoint)}\n`;
        if (perspective.evidence && perspective.evidence.length > 0) {
          content += `Evidence:\n`;
          perspective.evidence.forEach((ev: string) => {
            content += `- ${stripMarkdown(ev)}\n`;
          });
        }
        content += `\n`;
      });
    }
    return content;
  };

  // Generate HTML content for PDF/HTML export
  const generatePDFContent = () => {
    const sections = (results.content as any)?.sections || [];
    const sources = (results.sources as any)?.sources || [];
    const perspectives = (results.perspectives as any)?.perspectives || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${results.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1d4ed8; margin-top: 30px; }
          h3 { color: #1e40af; margin-top: 25px; }
          .meta { background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .section { margin: 25px 0; padding: 20px; border-left: 3px solid #e5e7eb; }
          .source { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 5px; }
          .source-title { font-weight: bold; color: #1f2937; }
          .source-url { color: #2563eb; text-decoration: none; }
          .perspective { margin: 18px 0; padding: 14px; background: #f3f4f6; border-radius: 5px; }
          .perspective-title { font-weight: bold; color: #1e293b; }
          .evidence-list { margin: 8px 0 0 18px; }
        </style>
      </head>
      <body>
        <h1>${results.title || 'Research Report'}</h1>
        <div class="meta">
          <strong>Generated on:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Topic:</strong> ${query.topic}
        </div>
        <h2>Executive Summary</h2>
        <p>${results.summary}</p>
        ${sections.length > 0 ? `
          <h2>Detailed Analysis</h2>
          ${sections.map((section: any, index: number) => `
            <div class="section">
              <h3>${index + 1}. ${section.title}</h3>
              <p>${section.content.replace(/\n/g, '</p><p>')}</p>
            </div>
          `).join('')}
        ` : ''}
        ${sources.filter((s: any) => s.title && s.title !== 'source').length > 0 ? `
          <h2>Sources</h2>
          ${sources.filter((s: any) => s.title && s.title !== 'source').map((source: any, index: number) => `
            <div class="source">
              <div class="source-title">${index + 1}. ${source.title}</div>
              ${source.url && source.url !== '#' ? `<div><a href="${source.url}" class="source-url">${source.url}</a></div>` : ''}
              ${source.type ? `<div><strong>Type:</strong> ${source.type}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}
        ${perspectives.length > 0 ? `
          <h2>Perspectives</h2>
          ${perspectives.map((perspective: any, idx: number) => `
            <div class="perspective">
              <div class="perspective-title">${perspective.title}</div>
              <div>${perspective.viewpoint}</div>
              ${perspective.evidence && perspective.evidence.length > 0 ? `
                <ul class="evidence-list">
                  ${perspective.evidence.map((ev: string) => `<li>${ev}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
          <p>Generated by Multi-Agent Research Assistant</p>
        </div>
      </body>
      </html>
    `;
    return htmlContent;
  };

  // Download the research report as an HTML file (user can print to PDF)
  const handleDownloadPDF = () => {
    try {
      const htmlContent = generatePDFContent();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${query.topic.replace(/\s+/g, '_')}_research_report.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Research report downloaded as HTML. Use your browser or a PDF printer to save as PDF.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Export research as JSON or TXT
  const handleExport = (format: string) => {
    let content = '';
    let mimeType = '';
    let extension = format;
    
    if (format === 'json') {
      const data = {
        title: results.title,
        summary: results.summary,
        query: query.topic,
        content: results.content,
        sources: results.sources,
        exportedAt: new Date().toISOString()
      };
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else {
      content = formatContentForExport();
      mimeType = 'text/plain';
    }
    
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = `${query.topic.replace(/\s+/g, '_')}_export.${extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success(`Research exported as ${format.toUpperCase()}!`);
  };

  // Share research via email (or clipboard if too long)
  const handleEmailShare = () => {
    const sections = (results.content as any)?.sections || [];
    const sources = (results.sources as any)?.sources || [];
    const perspectives = (results.perspectives as any)?.perspectives || [];
    
    let emailBody = `Hi,\n\nI wanted to share this comprehensive research report with you:\n\nTitle: ${results.title}\nTopic: ${query.topic}\nGenerated: ${new Date().toLocaleDateString()}\n\nExecutive Summary:\n${stripMarkdown(results.summary)}\n\n`;

    if (sections.length > 0) {
      emailBody += `Detailed Analysis:\n\n`;
      sections.forEach((section: any, index: number) => {
        emailBody += `${index + 1}. ${stripMarkdown(section.title)}\n${stripMarkdown(section.content)}\n\n`;
      });
    }

    if (sources.filter((s: any) => s.title && s.title !== 'source').length > 0) {
      emailBody += `Sources:\n\n`;
      sources.filter((s: any) => s.title && s.title !== 'source').forEach((source: any, index: number) => {
        emailBody += `${index + 1}. ${stripMarkdown(source.title)}`;
        if (source.url && source.url !== '#') {
          emailBody += `\n   URL: ${source.url}`;
        }
        if (source.type) {
          emailBody += `\n   Type: ${source.type}`;
        }
        emailBody += `\n\n`;
      });
    }

    if (perspectives.length > 0) {
      emailBody += `Perspectives:\n\n`;
      perspectives.forEach((perspective: any, idx: number) => {
        emailBody += `${stripMarkdown(perspective.title)}\n${stripMarkdown(perspective.viewpoint)}\n`;
        if (perspective.evidence && perspective.evidence.length > 0) {
          emailBody += `Evidence:\n`;
          perspective.evidence.forEach((ev: string) => {
            emailBody += `- ${stripMarkdown(ev)}\n`;
          });
        }
        emailBody += `\n`;
      });
    }

    emailBody += `Best regards`;
    
    const subject = encodeURIComponent(`Research Report: ${results.title}`);

    if (emailBody.length > 1500) {
      navigator.clipboard.writeText(emailBody).then(() => {
        toast.success('Research report copied to clipboard! Paste it into your email.');
        setTimeout(() => {
          window.open(`mailto:?subject=${subject}`, '_blank');
        }, 500);
      }).catch(() => {
        toast.error('Failed to copy research report to clipboard.');
      });
    } else {
      const body = encodeURIComponent(emailBody);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      toast.success('Email client opened with full research report!');
    }
  };

  // Share research using Web Share API or fallback to email
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: results.title,
        text: results.summary,
        url: window.location.href,
      }).then(() => {
        toast.success('Research shared successfully!');
      }).catch(() => {
        handleEmailShare();
      });
    } else {
      handleEmailShare();
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Download as HTML (PDF) */}
      <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
        Download PDF
      </Button>
      
      {/* Export as JSON or TXT */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Export <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('txt')}>
            Export as TXT
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Share via email or Web Share API */}
      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleShare}>
        <Mail className="mr-1 h-4 w-4" />
        Share via Email
      </Button>
    </div>
  );
};

export default ExportActions;
