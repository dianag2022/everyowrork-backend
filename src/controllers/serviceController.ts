// ==================== src/controllers/serviceController.ts ====================
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import * as serviceService from '../services/serviceServices';

export const getServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await serviceService.getActiveServices();
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    next(error);
  }
};

export const searchServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      query = '',
      category = '',
      minPrice,
      maxPrice,
      lat,
      lng,
      radiusKm = 50
    } = req.query as any;

    const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const services = await serviceService.searchServices(
      query,
      category,
      minPrice ? parseInt(minPrice) : undefined,
      maxPrice ? parseInt(maxPrice) : undefined,
      userLocation,
      parseInt(radiusKm)
    );

    res.json({
      success: true,
      data: services,
      count: services.length,
      filters: {
        query,
        category,
        minPrice,
        maxPrice,
        location: userLocation,
        radiusKm
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getServicesForMap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { north, south, east, west } = req.query as any;
    
    const bounds = (north && south && east && west) ? {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    } : undefined;

    const services = await serviceService.getServicesForMap(bounds);
    
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    next(error);
  }
};

export const getServicesByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const services = await serviceService.getServicesByCategory(category);
    
    res.json({
      success: true,
      data: services,
      count: services.length,
      category
    });
  } catch (error) {
    next(error);
  }
};

export const getServicesByProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { providerId } = req.params;
    const services = await serviceService.getServicesByProvider(providerId);
    
    res.json({
      success: true,
      data: services,
      count: services.length,
      providerId
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);
    
    if (!service) {
      throw createError('Service not found', 404);
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const serviceData = {
      ...req.body,
      provider_id: req.user.id
    };

    const service = await serviceService.createService(serviceData);
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const updateData = req.body;

    const service = await serviceService.updateService(id, updateData, req.user.id);
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

export const toggleServiceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const service = await serviceService.toggleServiceStatus(id, req.user.id);
    
    res.json({
      success: true,
      message: `Service ${service.status ? 'activated' : 'deactivated'} successfully`,
      data: service
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    await serviceService.deleteService(id, req.user.id);
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};