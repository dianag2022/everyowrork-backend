// ==================== src/routes/reviews.ts ====================
import { Router } from 'express';
import { 
  authenticateToken,
  requireRole, 
  requireAdmin,
  optionalAuth,
  type AuthRequest 
} from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reviewParamsSchema,
  reviewQuerySchema 
} from '../schemas/reviewSchemas';
import * as reviewController from '../controllers/reviewController';

const router = Router();

// GET /api/reviews/service/:serviceId - Get reviews for a service
router.get('/service/:serviceId',
  validateRequest({ 
    params: { serviceId: reviewParamsSchema.serviceId },
    query: reviewQuerySchema 
  }),
  reviewController.getServiceReviews
);

// GET /api/reviews/service/:serviceId/stats - Get review statistics
router.get('/service/:serviceId/stats',
  validateRequest({ params: { serviceId: reviewParamsSchema.serviceId } }),
  reviewController.getServiceReviewStats
);

// GET /api/reviews/user/:userId? - Get reviews by user (optional userId)
router.get('/user/:userId',
  authenticateToken,
  validateRequest({ query: reviewQuerySchema }),
  reviewController.getUserReviews
);

// GET /api/reviews/:id - Get specific review
router.get('/:id',
  validateRequest({ params: { id: reviewParamsSchema.id } }),
  reviewController.getReviewById
);

// POST /api/reviews - Create new review
router.post('/',
  authenticateToken,
  validateRequest({ body: createReviewSchema }),
  reviewController.createReview
);

// PUT /api/reviews/:id - Update review
router.put('/:id',
  authenticateToken,
  validateRequest({ 
    params: { id: reviewParamsSchema.id },
    body: updateReviewSchema 
  }),
  reviewController.updateReview
);

// DELETE /api/reviews/:id - Delete review
router.delete('/:id',
  authenticateToken,
  validateRequest({ params: { id: reviewParamsSchema.id } }),
  reviewController.deleteReview
);

// POST /api/reviews/:id/vote - Vote on review (helpful/not helpful)
router.post('/:id/vote',
  authenticateToken,
  validateRequest({ 
    params: { id: reviewParamsSchema.id },
    body: { vote_type: reviewParamsSchema.vote_type }
  }),
  reviewController.voteOnReview
);

// DELETE /api/reviews/:id/vote - Remove vote from review
router.delete('/:id/vote',
  authenticateToken,
  validateRequest({ params: { id: reviewParamsSchema.id } }),
  reviewController.removeReviewVote
);

// GET /api/reviews/:id/vote - Get user's vote on review
router.get('/:id/vote',
  authenticateToken,
  validateRequest({ params: { id: reviewParamsSchema.id } }),
  reviewController.getUserVoteOnReview
);

export default router;