import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingSelectorProps {
  onRatingChange: (rating: number) => void;
}

// Displays a 1-5 star rating selector and notifies parent on change
const RatingSelector = ({ onRatingChange }: RatingSelectorProps) => {
  // State for the selected and hovered rating
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Handle click on a star to set the rating
  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    onRatingChange(rating);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Rate this research:</span>
      <div className="flex space-x-1">
        {/* Render 5 clickable stars for rating */}
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRatingClick(rating)}
          >
            <Star
              className={`w-5 h-5 ${
                rating <= (hoveredRating || selectedRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-600">({selectedRating}/5)</span>
    </div>
  );
};

export default RatingSelector;
