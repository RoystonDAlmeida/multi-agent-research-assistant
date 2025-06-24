import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import RatingSelector from './RatingSelector';
import { useResearch } from '@/hooks/useResearch';

interface FeedbackFormProps {
  results: any;
}

// Displays a feedback form for users to rate and comment on research results
const FeedbackForm = ({ results }: FeedbackFormProps) => {
  // State for feedback text and rating
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5); // Default rating
  const { submitFeedbackMutation } = useResearch();

  // Reset the form after successful feedback submission
  useEffect(() => {
    if (submitFeedbackMutation.isSuccess) {
      // Reset the form only after a successful submission
      setFeedback('');
      setRating(5);
    }
  }, [submitFeedbackMutation.isSuccess]);

  // Handle feedback form submission
  const handleFeedbackSubmit = () => {
    if (feedback.trim() && results) {
      submitFeedbackMutation.mutate({
        resultId: results.id,
        feedback: feedback,
        rating: rating,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <p className="text-gray-600">
          Rate the research quality and provide specific feedback to help improve future AI research
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback text area */}
        <Textarea
          placeholder="e.g., 'Please expand the section on economic impacts' or 'Add more recent data from 2024' or 'The analysis could include more international perspectives'"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          className="resize-none"
        />
        
        {/* Rating selector and submit button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <RatingSelector onRatingChange={setRating} />
          <Button 
            onClick={handleFeedbackSubmit}
            disabled={submitFeedbackMutation.isPending || !feedback.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto"
          >
            {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Rating & Feedback'}
          </Button>
        </div>
        
        {/* Feedback guidelines for users */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">💡 Feedback Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Be specific about which sections need improvement</li>
            <li>• Mention if you need different perspectives or additional sources</li>
            <li>• Request updates for recent developments or current events</li>
            <li>• Ask for clarification on technical or complex topics</li>
            <li>• Suggest alternative angles or approaches to the research</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
