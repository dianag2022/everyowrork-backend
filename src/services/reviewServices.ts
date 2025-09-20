// ==================== src/services/reviewService.ts ====================
import { supabase, supabaseAdmin } from '../config/supabase';
import { createError } from '../middleware/errorHandler';

export interface Review {
  id: string;
  service_id: string;
  reviewer_id: string;
  rating: number;
  title: string;
  comment?: string;
  images?: string[];
  verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithReviewer extends Review {
  reviewer: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PaginatedReviews {
  reviews: ReviewWithReviewer[];
  total_count: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const getServiceReviews = async (
  serviceId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' = 'newest'
): Promise<PaginatedReviews> => {
  const offset = (page - 1) * limit;

  let orderClause = 'created_at desc';
  switch (sortBy) {
    case 'oldest':
      orderClause = 'created_at asc';
      break;
    case 'rating_high':
      orderClause = 'rating desc, created_at desc';
      break;
    case 'rating_low':
      orderClause = 'rating asc, created_at desc';
      break;
    case 'helpful':
      orderClause = 'helpful_count desc, created_at desc';
      break;
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('service_id', serviceId)
    .order(orderClause.split(',')[0].split(' ')[0], { 
      ascending: orderClause.includes('asc')
    })
    .range(offset, offset + limit - 1);

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    throw createError('Failed to fetch reviews', 500);
  }

  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', serviceId);

  if (countError) {
    console.error('Error counting reviews:', countError);
    throw createError('Failed to count reviews', 500);
  }

  return {
    reviews: reviews as ReviewWithReviewer[],
    total_count: count || 0,
    has_more: (offset + limit) < (count || 0),
    next_cursor: (offset + limit) < (count || 0) ? (page + 1).toString() : undefined
  };
};

export const getServiceReviewStats = async (serviceId: string): Promise<ReviewStats> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('service_id', serviceId);

  if (error) {
    console.error('Error fetching review stats:', error);
    throw createError('Failed to fetch review stats', 500);
  }

  const reviews = data || [];
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
  });

  return {
    total_reviews: totalReviews,
    average_rating: Math.round(averageRating * 10) / 10,
    rating_distribution: distribution
  };
};

export const createReview = async (reviewData: any): Promise<Review> => {
  // Check if user has already reviewed this service
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('service_id', reviewData.service_id)
    .eq('reviewer_id', reviewData.reviewer_id)
    .maybeSingle();

  if (existingReview) {
    throw createError('You have already reviewed this service', 400);
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert([
      {
        service_id: reviewData.service_id,
        reviewer_id: reviewData.reviewer_id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment || null,
        images: reviewData.images || [],
        verified: false,
        helpful_count: 0
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw createError('Failed to create review', 500);
  }

  return data as Review;
};

export const updateReview = async (
  reviewId: string,
  updateData: any,
  userId: string
): Promise<Review> => {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .eq('reviewer_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw createError('Failed to update review', 500);
  }

  return data as Review;
};

export const deleteReview = async (reviewId: string, userId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('reviewer_id', userId);

  if (error) {
    console.error('Error deleting review:', error);
    throw createError('Failed to delete review', 500);
  }
};

export const getReviewById = async (reviewId: string): Promise<ReviewWithReviewer | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching review:', error);
    throw createError('Failed to fetch review', 500);
  }

  return data as ReviewWithReviewer;
};

export const getUserReviews = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedReviews> => {
  const offset = (page - 1) * limit;

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (reviewsError) {
    console.error('Error fetching user reviews:', reviewsError);
    throw createError('Failed to fetch user reviews', 500);
  }

  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', userId);

  if (countError) {
    console.error('Error counting user reviews:', countError);
    throw createError('Failed to count user reviews', 500);
  }

  return {
    reviews: reviews as ReviewWithReviewer[],
    total_count: count || 0,
    has_more: (offset + limit) < (count || 0)
  };
};

export const voteOnReview = async (
  reviewId: string,
  voteType: 'helpful' | 'not_helpful',
  userId: string
): Promise<any> => {
  const { data, error } = await supabaseAdmin
    .from('review_votes')
    .upsert([
      {
        review_id: reviewId,
        voter_id: userId,
        vote_type: voteType
      }
    ], {
      onConflict: 'review_id,voter_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error voting on review:', error);
    throw createError('Failed to vote on review', 500);
  }

  return data;
};

export const removeReviewVote = async (reviewId: string, userId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('review_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('voter_id', userId);

  if (error) {
    console.error('Error removing review vote:', error);
    throw createError('Failed to remove review vote', 500);
  }
};

export const getUserVoteOnReview = async (reviewId: string, userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('review_votes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('voter_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user vote:', error);
    throw createError('Failed to fetch user vote', 500);
  }

  return data;
};