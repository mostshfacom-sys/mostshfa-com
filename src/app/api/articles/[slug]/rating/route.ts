import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for ratings (in production, use database)
const ratings: Record<string, { total: number; count: number; userRatings: Record<string, number> }> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const articleRating = ratings[params.slug] || { total: 0, count: 0 };
  const average = articleRating.count > 0 ? articleRating.total / articleRating.count : 0;

  return NextResponse.json({
    average: Math.round(average * 10) / 10,
    count: articleRating.count,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { rating, visitorId } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 });
    }

    // Initialize if not exists
    if (!ratings[params.slug]) {
      ratings[params.slug] = { total: 0, count: 0, userRatings: {} };
    }

    const articleRating = ratings[params.slug];

    // Check if user already rated
    if (articleRating.userRatings[visitorId]) {
      // Update existing rating
      const oldRating = articleRating.userRatings[visitorId];
      articleRating.total = articleRating.total - oldRating + rating;
      articleRating.userRatings[visitorId] = rating;
    } else {
      // New rating
      articleRating.total += rating;
      articleRating.count += 1;
      articleRating.userRatings[visitorId] = rating;
    }

    const average = articleRating.total / articleRating.count;

    return NextResponse.json({
      success: true,
      average: Math.round(average * 10) / 10,
      count: articleRating.count,
      userRating: rating,
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
