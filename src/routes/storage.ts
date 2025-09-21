// ==================== src/routes/storage.ts ====================
import { Router } from 'express';
import multer from 'multer';
import { 
  authenticateToken,
  requireRole, 
  requireAdmin,
  optionalAuth,
  type AuthRequest 
} from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { uploadSchema } from '../schemas/storageSchemas';
import * as storageController from '../controllers/storageController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// POST /api/storage/upload - Upload service images
router.post('/upload',
  authenticateToken,
  upload.array('images', 10), // Accept up to 10 images
  validateRequest({ body: uploadSchema }),
  storageController.uploadServiceImages
);

// DELETE /api/storage/delete - Delete service images
router.delete('/delete',
  authenticateToken,
  storageController.deleteServiceImages
);

// GET /api/storage/optimize/:filename - Get optimized image URL
router.get('/optimize/:filename',
  storageController.getOptimizedImage
);

export default router;