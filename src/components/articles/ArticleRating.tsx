'use client';

import { useState } from 'react';

interface ArticleRatingProps {
  articleId: number;
  initialRating?: number;
  totalRatings?: number;
}

export default function ArticleRating({ articleId, initialRating = 0, totalRatings = 0 }: ArticleRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [count, setCount] = useState(totalRatings);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (value: number) => {
    if (submitted) return;
    
    setUserRating(value);
    setSubmitted(true);
    
    // Calculate new average (simplified - in production, this would be server-side)
    const newCount = count + 1;
    const newRating = ((rating * count) + value) / newCount;
    setRating(newRating);
    setCount(newCount);

    // In production, send to API
    // await fetch(`/api/articles/${articleId}/rate`, {
    //   method: 'POST',
    //   body: JSON.stringify({ rating: value }),
    // });
  };

  const displayRating = hoveredRating || userRating || rating;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !submitted && setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={submitted}
            className={`transition-colors ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <svg
              className={`w-6 h-6 ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>
      
      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
        <span className="mx-1">•</span>
        <span>{count} تقييم</span>
      </div>

      {submitted && (
        <span className="text-sm text-green-600">شكراً لتقييمك!</span>
      )}
    </div>
  );
}
