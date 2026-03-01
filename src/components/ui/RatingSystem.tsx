'use client';

import React, { useState, useCallback } from 'react';

interface RatingSystemProps {
  entityId: number;
  entityType: 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'tool';
  currentRating?: number;
  ratingCount?: number;
  onRatingSubmit?: (rating: number, comment?: string) => void;
  showComments?: boolean;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

interface RatingData {
  rating: number;
  comment: string;
  isHelpful?: boolean;
  createdAt: string;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  entityId,
  entityType,
  currentRating = 0,
  ratingCount = 0,
  onRatingSubmit,
  showComments = false,
  size = 'md',
  readonly = false,
  className = ''
}) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          star: 'w-4 h-4',
          text: 'text-sm',
          button: 'px-3 py-1 text-sm'
        };
      case 'lg':
        return {
          star: 'w-8 h-8',
          text: 'text-lg',
          button: 'px-6 py-3 text-lg'
        };
      default:
        return {
          star: 'w-6 h-6',
          text: 'text-base',
          button: 'px-4 py-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const handleStarClick = useCallback((rating: number) => {
    if (readonly) return;
    
    setUserRating(rating);
    if (!showComments) {
      handleSubmitRating(rating);
    } else {
      setShowCommentForm(true);
    }
  }, [readonly, showComments]);

  const handleSubmitRating = useCallback(async (rating: number, commentText?: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: commentText || comment
        })
      });

      if (response.ok) {
        onRatingSubmit?.(rating, commentText || comment);
        setComment('');
        setShowCommentForm(false);
        
        // إعادة تحميل التقييمات إذا كانت معروضة
        if (showComments) {
          loadRatings();
        }
      } else {
        throw new Error('فشل في إرسال التقييم');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('حدث خطأ في إرسال التقييم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, entityType, entityId, comment, onRatingSubmit, showComments]);

  const loadRatings = useCallback(async () => {
    if (!showComments) return;
    
    setIsLoadingComments(true);
    
    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/ratings`);
      
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [showComments, entityType, entityId]);

  React.useEffect(() => {
    if (showComments) {
      loadRatings();
    }
  }, [showComments, loadRatings]);

  const renderStars = (rating: number, interactive: boolean = false) => {
    const stars = [];
    const displayRating = interactive ? (hoverRating || userRating) : rating;
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= displayRating;
      const isHalfFilled = !isFilled && i - 0.5 <= displayRating;
      
      stars.push(
        <button
          key={i}
          type="button"
          disabled={readonly || isSubmitting}
          onClick={() => interactive && handleStarClick(i)}
          onMouseEnter={() => interactive && !readonly && setHoverRating(i)}
          onMouseLeave={() => interactive && !readonly && setHoverRating(0)}
          className={`
            ${sizeClasses.star} transition-colors duration-150
            ${interactive && !readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            ${readonly ? 'opacity-75' : ''}
          `}
        >
          <svg
            fill={isFilled ? '#FCD34D' : isHalfFilled ? 'url(#half-star)' : 'none'}
            stroke={isFilled || isHalfFilled ? '#FCD34D' : '#D1D5DB'}
            strokeWidth={1}
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="#FCD34D" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      );
    }
    
    return stars;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className={`rating-system ${className}`}>
      {/* عرض التقييم الحالي */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          {renderStars(currentRating)}
        </div>
        
        {currentRating > 0 && (
          <div className={`flex items-center gap-2 ${sizeClasses.text}`}>
            <span className="font-semibold text-gray-900">
              {formatRating(currentRating)}
            </span>
            {ratingCount > 0 && (
              <span className="text-gray-500">
                ({formatCount(ratingCount)} تقييم)
              </span>
            )}
          </div>
        )}
      </div>

      {/* نموذج التقييم */}
      {!readonly && (
        <div className="space-y-4">
          <div>
            <p className={`text-gray-700 mb-2 ${sizeClasses.text}`}>
              قيم هذا {entityType === 'hospital' ? 'المستشفى' : 
                      entityType === 'clinic' ? 'العيادة' :
                      entityType === 'lab' ? 'المختبر' :
                      entityType === 'pharmacy' ? 'الصيدلية' : 'العنصر'}:
            </p>
            <div className="flex items-center gap-1">
              {renderStars(userRating, true)}
            </div>
          </div>

          {/* نموذج التعليق */}
          {showCommentForm && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب تعليقك هنا (اختياري)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSubmitRating(userRating, comment)}
                  disabled={isSubmitting || userRating === 0}
                  className={`
                    bg-blue-600 text-white rounded-lg font-medium transition-colors
                    hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                    ${sizeClasses.button}
                  `}
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </button>
                
                <button
                  onClick={() => {
                    setShowCommentForm(false);
                    setUserRating(0);
                    setComment('');
                  }}
                  className={`
                    border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors
                    hover:bg-gray-50 ${sizeClasses.button}
                  `}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* عرض التقييمات والتعليقات */}
      {showComments && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            التقييمات والمراجعات ({ratings.length})
          </h3>
          
          {isLoadingComments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {renderStars(rating.rating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(rating.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  
                  {rating.comment && (
                    <p className="text-gray-700 mb-2">{rating.comment}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="hover:text-blue-600 transition-colors">
                      مفيد
                    </button>
                    <button className="hover:text-red-600 transition-colors">
                      إبلاغ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد تقييمات بعد</p>
              <p className="text-sm mt-1">كن أول من يقيم!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingSystem;