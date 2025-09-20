// ==================== src/controllers/reviewController.ts ====================
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import * as reviewService from '../services/reviewServices';

export const getServiceReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { serviceId } = req.params;
    console.log(serviceId);
    
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query as any;

    const reviews = await reviewService.getServiceReviews(
      serviceId,
      parseInt(page),
      parseInt(limit),
      sortBy
    );

    res.json({
      success: true,
      data: reviews.reviews,
      pagination: {
        current_page: parseInt(page),
        total_count: reviews.total_count,
        has_more: reviews.has_more,
        next_cursor: reviews.next_cursor
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceReviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { serviceId } = req.params;
    const stats = await reviewService.getServiceReviewStats(serviceId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;

    const targetUserId = userId || req.user.id;
    const reviews = await reviewService.getUserReviews(
      targetUserId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: reviews.reviews,
      pagination: {
        current_page: parseInt(page),
        total_count: reviews.total_count,
        has_more: reviews.has_more
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    if (!review) {
      throw createError('Review not found', 404);
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const reviewData = {
      ...req.body,
      reviewer_id: req.user.id
    };

    const review = await reviewService.createReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.body, req.user.id);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    await reviewService.deleteReview(id, req.user.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const voteOnReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { vote_type } = req.body;

    const vote = await reviewService.voteOnReview(id, vote_type, req.user.id);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: vote
    });
  } catch (error) {
    next(error);
  }
};

export const removeReviewVote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    await reviewService.removeReviewVote(id, req.user.id);

    res.json({
      success: true,
      message: 'Vote removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserVoteOnReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const vote = await reviewService.getUserVoteOnReview(id, req.user.id);

    res.json({
      success: true,
      data: vote
    });
  } catch (error) {
    next(error);
  }
};