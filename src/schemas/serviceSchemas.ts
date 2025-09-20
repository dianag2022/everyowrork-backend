// ==================== src/schemas/serviceSchemas.ts ====================
import Joi from 'joi';

export const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional().default('Colombia'),
  postal_code: Joi.string().max(20).optional()
});

export const createServiceSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10).max(2000),
  category: Joi.string().required().max(100),
  min_price: Joi.number().min(0).required(),
  max_price: Joi.number().min(0).required(),
  main_image: Joi.string().uri().optional(),
  gallery: Joi.array().items(Joi.string().uri()).max(10).optional(),
  location: locationSchema.optional(),
  embed_title: Joi.string().max(200).optional(),
  embed_url: Joi.string().uri().optional()
}).custom((value, helpers) => {
  if (value.max_price < value.min_price) {
    return helpers.error('any.invalid', { message: 'max_price must be greater than or equal to min_price' });
  }
  return value;
});

export const updateServiceSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  category: Joi.string().max(100).optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  main_image: Joi.string().uri().optional().allow(null),
  gallery: Joi.array().items(Joi.string().uri()).max(10).optional(),
  location: locationSchema.optional(),
  embed_title: Joi.string().max(200).optional().allow(null),
  embed_url: Joi.string().uri().optional().allow(null)
}).custom((value, helpers) => {
  if (value.max_price !== undefined && value.min_price !== undefined && value.max_price < value.min_price) {
    return helpers.error('any.invalid', { message: 'max_price must be greater than or equal to min_price' });
  }
  return value;
});

export const searchServicesSchema = Joi.object({
  query: Joi.string().max(200).optional().default(''),
  category: Joi.string().max(100).optional().default(''),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radiusKm: Joi.number().min(1).max(500).optional().default(50),
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(50).optional().default(10)
});

export const serviceParamsSchema = {
  id: Joi.string().uuid().required(),
  category: Joi.string().max(100).required(),
  providerId: Joi.string().uuid().required()
};