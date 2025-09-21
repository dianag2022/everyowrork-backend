// ==================== src/routes/services.ts ====================
import { Router } from 'express';
import { 
  authenticateToken,
  requireRole, 
  requireAdmin,
  optionalAuth,
  type AuthRequest 
} from '../middleware/auth';
import { validateRequest, commonSchemas } from '../middleware/validation';
import { 
  createServiceSchema, 
  updateServiceSchema, 
  searchServicesSchema,
  serviceParamsSchema 
} from '../schemas/serviceSchemas';
import * as serviceController from '../controllers/serviceController';

const router = Router();

// GET /api/services - Get all active services (with optional filters)
// Público pero con auth opcional para personalización
router.get('/', 
  validateRequest({ query: searchServicesSchema }),
  optionalAuth,
  serviceController.getServices
);

// GET /api/services/search - Advanced search with filters
router.get('/search',
  validateRequest({ query: searchServicesSchema }),
  optionalAuth,
  serviceController.searchServices
);

// GET /api/services/map - Get services for map display (with optional bounds)
router.get('/map',
  optionalAuth,
  serviceController.getServicesForMap
);

// GET /api/services/category/:category - Get services by category
router.get('/category/:category',
  validateRequest({ params: { category: serviceParamsSchema.category } }),
  optionalAuth,
  serviceController.getServicesByCategory
);

// GET /api/services/provider/:providerId - Get services by provider
router.get('/provider/:providerId',
  validateRequest({ params: { providerId: serviceParamsSchema.providerId } }),
  optionalAuth,
  serviceController.getServicesByProvider
);

// GET /api/services/:id - Get specific service by ID
router.get('/:id',
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  optionalAuth,
  serviceController.getServiceById
);

// POST /api/services - Create new service (requires authentication)
// Solo usuarios autenticados pueden crear servicios
router.post('/',
  authenticateToken,
  validateRequest({ body: createServiceSchema }),
  serviceController.createService
);

// PUT /api/services/:id - Update existing service
// Solo admins o el propietario del servicio (lógica en el controller)
router.put('/:id',
  authenticateToken,
  validateRequest({ 
    params: { id: serviceParamsSchema.id },
    body: updateServiceSchema 
  }),
  serviceController.updateService
);

// PATCH /api/services/:id/toggle - Toggle service status (active/inactive)
// Solo admins pueden cambiar el status
router.patch('/:id/toggle',
  authenticateToken,
  requireRole(['admin']),
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  serviceController.toggleServiceStatus
);

// DELETE /api/services/:id - Soft delete service
// Solo admins o el propietario del servicio (lógica en el controller)
router.delete('/:id',
  authenticateToken,
  validateRequest({ params: { id: serviceParamsSchema.id } }),
  serviceController.deleteService
);


export default router;