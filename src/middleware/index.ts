// ==================== src/middleware/index.ts (ÍNDICE) ====================
// Archivo para exportar todos los middlewares de forma organizada

export {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAuth,
  optionalAuth,
  type AuthRequest
} from './auth';

export {
  validateRequest,
  commonSchemas
} from './validation';

export {
  errorHandler,
  notFoundHandler
} from './errorHandler';