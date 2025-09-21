// ==================== src/routes/categories.ts ====================
import { Router } from 'express';

import { 
  authenticateToken,
  requireRole, 
  requireAdmin,
  optionalAuth,
  type AuthRequest 
} from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createCategorySchema, categoryParamsSchema } from '../schemas/categorySchemas';
import * as categoryController from '../controllers/categoryController';

const router = Router();

// GET /api/categories - Get all categories
router.get('/',
  categoryController.getCategories
);

// GET /api/categories/:id - Get category by ID
router.get('/:id',
  validateRequest({ params: { id: categoryParamsSchema.id } }),
  categoryController.getCategoryById
);

// POST /api/categories - Create new category (admin only)
router.post('/',
  authenticateToken,
  validateRequest({ body: createCategorySchema }),
  categoryController.createCategory
);

// PUT /api/categories/:id - Update category (admin only)
router.put('/:id',
  authenticateToken,
  validateRequest({ 
    params: { id: categoryParamsSchema.id },
    body: createCategorySchema 
  }),
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category (admin only)
router.delete('/:id',
  authenticateToken,
  validateRequest({ params: { id: categoryParamsSchema.id } }),
  categoryController.deleteCategory
);

export default router;