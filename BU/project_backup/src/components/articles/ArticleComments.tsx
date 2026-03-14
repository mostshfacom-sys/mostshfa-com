'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  likes: number;
  replies?: Comment[];
}

interface ArticleCommentsProps {
  articleId: number;
  initialComments?: Comment[];
}

export default function ArticleComments({ articleId, initialComments = [] }: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    const comment: Comment = {
      id: Date.now(),
      author: authorName,
      content: newComment,
      date: new Date().toISOString(),
      likes: 0,
    };

    // In production, send to API
    // await fetch(`/api/articles/${articleId}/comments`, {
    //   method: 'POST',
    //   body: JSON.stringify({ author: authorName, content: newComment }),
    // });

    setComments([comment, ...comments]);
    setNewComment('');
    setAuthorName('');
    setIsSubmitting(false);
    setShowForm(false);
  };

  const handleLike = (commentId: number) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 7) return `منذ ${days} أيام`;
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          التعليقات ({comments.length})
        </h3>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} variant="primary" size="sm">
            أضف تعليق
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {showForm && (
        <Card className="bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التعليق
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold">
                    {comment.author.charAt(0)}
                  </span>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-400">{formatDate(comment.date)}</span>
                  </div>
                  <p className="text-gray-600 mb-3">{comment.content}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                      <span>إعجاب</span>
                    </button>
                    <button className="text-gray-500 hover:text-primary-600 transition-colors">
                      رد
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
