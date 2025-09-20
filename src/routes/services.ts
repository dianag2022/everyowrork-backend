// ==================== src/routes/services.ts ====================
import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createServiceSchema, 
  updateServiceSchema, 
  searchServicesSchema,
  serviceParamsSchema 
} from '../schemas/serviceSchemas';
import * as serviceController from '../controllers/serviceController';

const router = Router();

// GET /api/services - Get all active services (with optional filters)
router.get('/', 
  validateRequest({ query: searchServicesSchema }),
  serviceController.getServices
);

// GET /api/services/search - Advanced search with filters
router.get('/search',
  validateRequest({ query: searchServicesSchema }),
  serviceController.searchServices
);

// GET /api/services/map - Get services for map display (with optional bounds)
router.get('/map',
  serviceController.getServicesForMap
);

// GET /api/services/category/:category - Get services by category
router.get('/category/:category',
  validateRequest({ params: { category: serviceParamsSchema.category } }),
  serviceController.getServicesByCategory
);

// GET /api/services/provider/:providerId - Get services by provider
router.get('/provider/:providerId',
  validateRequest({ params: { providerId: serviceParamsSchema.providerId } }),
  serviceController.getServicesByProvider
);

// GET /api/services/:id - Get specific service by ID
router.get('/:id',
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  serviceController.getServiceById
);

// POST /api/services - Create new service (requires authentication)
router.post('/',
  authenticateUser,
  validateRequest({ body: createServiceSchema }),
  serviceController.createService
);

// PUT /api/services/:id - Update existing service (requires auth + ownership)
router.put('/:id',
  authenticateUser,
  validateRequest({ 
    params: { id: serviceParamsSchema.id },
    body: updateServiceSchema 
  }),
  serviceController.updateService
);

// PATCH /api/services/:id/toggle - Toggle service status (active/inactive)
router.patch('/:id/toggle',
  authenticateUser,
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  serviceController.toggleServiceStatus
);

// DELETE /api/services/:id - Soft delete service (requires auth + ownership)
router.delete('/:id',
  authenticateUser,
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  serviceController.deleteService
);

export default router;