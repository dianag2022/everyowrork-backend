// ==================== src/schemas/reviewSchemas.ts ====================
import Joi from 'joi';

export const createReviewSchema = Joi.object({
  service_id: Joi.string().uuid().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().required().min(3).max(200),
  comment: Joi.string().max(1000).optional().allow(''),
  images: Joi.array().items(Joi.string().uri()).max(5).optional()
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  title: Joi.string().min(3).max(200).optional(),
  comment: Joi.string().max(1000).optional().allow(''),
  images: Joi.array().items(Joi.string().uri()).max(5).optional()
});

export const reviewQuerySchema = Joi.object({
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(50).optional().default(10),
  sortBy: Joi.string().valid('newest', 'oldest', 'rating_high', 'rating_low', 'helpful').optional().default('newest')
});

export const reviewParamsSchema = {
  id: Joi.string().uuid().required(),
  serviceId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().optional(),
  vote_type: Joi.string().valid('helpful', 'not_helpful').required()
};