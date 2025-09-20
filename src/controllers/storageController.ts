// ==================== src/controllers/storageController.ts ====================
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import * as storageService from '../services/storageServices';

export const uploadServiceImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw createError('No files provided', 400);
    }

    const files = req.files as Express.Multer.File[];
    const urls = await storageService.uploadServiceImages(files, req.user.id);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        urls,
        count: urls.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteServiceImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw createError('No image URLs provided', 400);
    }

    await storageService.deleteServiceImages(imageUrls);

    res.json({
      success: true,
      message: 'Images deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getOptimizedImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename } = req.params;
    const { width, height, quality, format } = req.query;

    const optimizedUrl = storageService.getOptimizedImageUrl(
      filename,
      {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality ? parseInt(quality as string) : undefined,
        format: format as any
      }
    );

    res.json({
      success: true,
      data: { optimizedUrl }
    });
  } catch (error) {
    next(error);
  }
};