// ==================== src/schemas/storageSchemas.ts ====================
import Joi from 'joi';

export const uploadSchema = Joi.object({
  metadata: Joi.object().optional()
});

export const deleteImagesSchema = Joi.object({
  imageUrls: Joi.array().items(Joi.string().uri()).min(1).required()
});
