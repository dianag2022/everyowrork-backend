// ==================== src/controllers/serviceController.ts ====================
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import * as serviceService from '../services/serviceServices';
import { SERVICE_LIMITS } from '../config/constants';

export const getServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await serviceService.getActiveServices();
    res.json({
      status: 'success',
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
      status: 'success',
      data: services,
      count: services.length,
      meta: {
        filters: {
          query,
          category,
          minPrice,
          maxPrice,
          location: userLocation,
          radiusKm
        }
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
      status: 'success',
      data: services,
      count: services.length,
      meta: {
        bounds
      }
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
      status: 'success',
      data: services,
      count: services.length,
      meta: {
        category
      }
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
      status: 'success',
      data: services,
      count: services.length,
      meta: {
        providerId
      }
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
      status: 'success',
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
    const existingServicesCount = await serviceService.countServicesByProviderId(req.user.id);
    if (existingServicesCount >= SERVICE_LIMITS.MAX_SERVICES_PER_USER) {
      throw createError('Maximum service limit reached. You can only create up to 3 services.', 403);
    }

    const serviceData = {
      ...req.body,
      provider_id: req.user.id
    };

    const service = await serviceService.createService(serviceData);
    
    res.status(201).json({
      status: 'success',
      data: service,
      meta: {
        message: 'Service created successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const countServicesByProviderId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw createError('User not authenticated', 401);
    }

    const existingServicesCount = await serviceService.countServicesByProviderId(req.user.id);
    
    
    res.json({
      status: 'success',
      data: { count: existingServicesCount },
      meta: {
        message: 'Service count retrieved successfully',
      }
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
      status: 'success',
      data: service,
      meta: {
        message: 'Service updated successfully'
      }
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
      status: 'success',
      data: service,
      meta: {
        message: `Service ${service.status ? 'activated' : 'deactivated'} successfully`
      }
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
    const deletedService = await serviceService.deleteService(id, req.user.id);
    
    res.json({
      status: 'success',
      data: {
        id: id,
        deleted: true
      },
      meta: {
        message: 'Service deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};
