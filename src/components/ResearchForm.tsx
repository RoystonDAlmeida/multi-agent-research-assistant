import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResearchQuery } from '../types/research';

/**
 * Props for the ResearchForm component.
 * @param onSubmit A callback function that is executed when the form is submitted with valid data.
 * @param isLoading A boolean to indicate if the form submission is currently in progress, used to disable the submit button.
 * @param defaultDepth The default depth for the research query.
 */
interface ResearchFormProps {
  onSubmit: (query: ResearchQuery) => void;
  isLoading?: boolean;
  defaultDepth?: string;
}

/**
 * A comprehensive form for users to specify the details of their research query.
 * It includes fields for the topic, research depth, output format, perspectives,
 * preferred sources, and an optional timeframe.
 */
const ResearchForm = ({ onSubmit, isLoading = false, defaultDepth = 'comprehensive' }: ResearchFormProps) => {
  // State to manage all the form's input values.
  const [formData, setFormData] = useState({
    topic: '',
    depth: defaultDepth,
    perspectives: [] as string[],
    format: 'markdown' as const,
    sources: [] as string[],
    timeframe: ''
  });

  // Update formData.depth if defaultDepth prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, depth: defaultDepth }));
  }, [defaultDepth]);

  // Map internal depth values to labels expected by ResearchQuery
  const depthLabelMap: Record<string, string> = {
    basic: "Basic Overview",
    comprehensive: "Comprehensive Analysis",
    expert: "Expert-Level Deep Dive"
  };

  /**
   * Handles the form submission process.
   * It prevents the default form action, validates the topic, calls the onSubmit prop,
   * and then resets the form to its initial state.
   * @param e The form event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation to ensure a topic is entered.
    if (!formData.topic.trim()) return;
    
    onSubmit({
      ...formData,
      depth: depthLabelMap[formData.depth] as "Basic Overview" | "Comprehensive Analysis" | "Expert-Level Deep Dive"
    });
    
    // Reset form fields after submission for a clean user experience.
    setFormData({
      topic: '',
      depth: defaultDepth,
      perspectives: [],
      format: 'markdown',
      sources: [],
      timeframe: ''
    });
  };

  /**
   * Handles changes to the perspective checkboxes.
   * It adds or removes a perspective from the state array based on whether the box is checked or unchecked.
   * @param perspective The perspective string to add or remove.
   * @param checked The new checked state of the checkbox.
   */
  const handlePerspectiveChange = (perspective: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      perspectives: checked 
        ? [...prev.perspectives, perspective]
        : prev.perspectives.filter(p => p !== perspective)
    }));
  };

  /**
   * Handles changes to the source checkboxes.
   * It adds or removes a source from the state array based on the checkbox state.
   * @param source The source string to add or remove.
   * @param checked The new checked state of the checkbox.
   */
  const handleSourceChange = (source: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sources: checked 
        ? [...prev.sources, source]
        : prev.sources.filter(s => s !== source)
    }));
  };

  return (
    <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-gray-800">
          Start Your Research
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Research Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
              Research Topic *
            </Label>
            <Textarea
              id="topic"
              name="topic"
              placeholder="e.g., 'Impact of artificial intelligence on healthcare outcomes' or 'Renewable energy adoption trends in developing countries'"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              className="min-h-[100px] resize-none"
              required
              autoComplete="off"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Research Depth Selection */}
            <div className="space-y-2">
              <Label htmlFor="depth" className="text-sm font-medium text-gray-700">
                Research Depth
              </Label>
              <Select name="depth" value={formData.depth} onValueChange={(value: any) => setFormData(prev => ({ ...prev, depth: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Overview</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="expert">Expert-Level Deep Dive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Output Format Selection */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700 mb-1">Output Format</legend>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="markdown"
                    name="format"
                    value="markdown"
                    checked={formData.format === 'markdown'}
                    onChange={() => setFormData(prev => ({ ...prev, format: 'markdown' }))}
                    className="form-radio"
                  />
                  <label htmlFor="markdown" className="text-sm text-gray-600">
                    Markdown (.md)
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Research Perspectives Checkboxes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700 mb-1">Research Perspectives (Select all that apply)</legend>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Technical/Scientific',
                'Economic Impact',
                'Social Implications',
                'Environmental Factors',
                'Policy & Regulation',
                'Historical Context'
              ].map((perspective) => (
                <div key={perspective} className="flex items-center space-x-2">
                  <Checkbox
                    id={perspective}
                    name="perspectives"
                    checked={formData.perspectives.includes(perspective)}
                    onCheckedChange={(checked) => handlePerspectiveChange(perspective, !!checked)}
                  />
                  <Label htmlFor={perspective} className="text-sm text-gray-600">
                    {perspective}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Preferred Sources Checkboxes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700 mb-1">Preferred Sources</legend>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Academic Papers',
                'News Articles',
                'Government Reports',
                'Industry Research',
                'Expert Interviews',
                'Statistical Databases'
              ].map((source) => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={source}
                    name="sources"
                    checked={formData.sources.includes(source)}
                    onCheckedChange={(checked) => handleSourceChange(source, !!checked)}
                  />
                  <Label htmlFor={source} className="text-sm text-gray-600">
                    {source}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Optional Time Frame Input */}
          <div className="space-y-2">
            <Label htmlFor="timeframe" className="text-sm font-medium text-gray-700">
              Time Frame (Optional)
            </Label>
            <Input
              id="timeframe"
              name="timeframe"
              placeholder="e.g., 'Last 5 years' or 'Since 2020'"
              value={formData.timeframe}
              onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
              autoComplete="off"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 text-lg"
            disabled={!formData.topic.trim() || isLoading}
          >
            {isLoading ? 'Starting Research...' : 'Start Research'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResearchForm;
