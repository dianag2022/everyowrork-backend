// ==================== src/schemas/categorySchemas.ts ====================
import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().max(500).optional(),
  icon: Joi.string().max(50).optional(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional()
});

export const categoryParamsSchema = {
  id: Joi.string().uuid().required()
};