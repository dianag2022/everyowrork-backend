// ==================== src/services/serviceService.ts ====================
import { supabase } from '../config/supabase';
import { createError } from '../middleware/errorHandler';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  min_price: number;
  max_price: number;
  provider_id: string;
  main_image?: string;
  gallery?: string[];
  socialMedia?: [{
    name: string;
    url: string;
    }
  ];
  status: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithProvider extends Service {
  provider: {
    id: string;
    email: string;
    raw_user_meta_data?: any;
  };
}

export interface CreateServiceData {
  title: string;
  description: string;
  category: string;
  min_price: number;
  max_price: number;
  main_image?: string;
  gallery?: string[];
  social_media?: [{
    name: string;
    url: string;
    }
  ];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}

// Get all active services with provider information
export const getActiveServices = async (): Promise<ServiceWithProvider[]> => {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('status', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    throw createError('Failed to fetch services', 500);
  }

  return data as ServiceWithProvider[];
};



// Get service by ID with provider information (handles both full UUID and short UUID)
export const getServiceById = async (id: string): Promise<ServiceWithProvider | null> => {
  try {
    console.log('Looking for service with ID:', id);
    
    // Check if it's a short UUID (8 characters) or full UUID (36 characters with hyphens)
    const isShortUuid = id.length === 8 && !id.includes('-');
    
    console.log('Is short UUID:', isShortUuid);
    
    if (isShortUuid) {
      // Use RPC function to search by short UUID
      const { data: services, error } = await supabase
        .rpc('find_service_by_short_uuid', { short_uuid: id });

      console.log('RPC query result:', { services, error });

      if (error) {
        console.error('Error fetching service by short UUID:', error);
        throw createError('Failed to fetch service', 500);
      }

      if (!services || services.length === 0) {
        console.log('Service not found with short UUID:', id);
        return null;
      }

      const service = services[0];

      // Now fetch the provider information separately
      const { data: provider, error: providerError } = await supabase
        .from('profiles')
        .select('id, email, raw_user_meta_data')
        .eq('id', service.provider_id)
        .single();

      if (providerError) {
        console.error('Error fetching provider:', providerError);
      }

      return {
        ...service,
        provider: provider || null
      } as ServiceWithProvider;

    } else {
      // Full UUID - use exact match (original logic)
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:profiles!provider_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('id', id)
        .eq('status', true)
        .single();

      console.log('Supabase query result (full UUID):', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Service not found with full UUID:', id);
          return null;
        }
        console.error('Error fetching service:', error);
        throw createError('Failed to fetch service', 500);
      }

      return data as ServiceWithProvider;
    }
  } catch (error) {
    console.error('Error in getServiceById:', error);
    throw error;
  }
};

// // Get service by ID with provider information
// export const getServiceById = async (id: string): Promise<ServiceWithProvider | null> => {
//   const { data, error } = await supabase
//     .from('services')
//     .select(`
//       *,
//       provider:profiles (
//         id,
//         email,
//         raw_user_meta_data
//       )
//     `)
//     .eq('id', id)
//     .single();

//   if (error) {
//     if (error.code === 'PGRST116') {
//       return null; // Service not found
//     }
//     console.error('Error fetching service:', error);
//     throw createError('Failed to fetch service', 500);
//   }

//   return data as ServiceWithProvider;
// };

// Get services by category
export const getServicesByCategory = async (category: string): Promise<ServiceWithProvider[]> => {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('category', category)
    .eq('status', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services by category:', error);
    throw createError('Failed to fetch services', 500);
  }

  return data as ServiceWithProvider[];
};

// Get services by provider
export const getServicesByProvider = async (providerId: string): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services by provider:', error);
    throw createError('Failed to fetch services', 500);
  }

  return data as Service[];
};

// Advanced search services with filters
export const searchServices = async (
  query: string = '',
  category: string = '',
  minPrice?: number,
  maxPrice?: number,
  userLocation?: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<ServiceWithProvider[]> => {
  try {
    let supabaseQuery = supabase
      .from('services')
      .select(`
        *,
        provider:profiles (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('status', true);

    // Add text search
    if (query && query.trim() !== '') {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,category.ilike.%${query.trim()}%`
      );
    }

    // Add category filter
    if (category && category.trim() !== '') {
      supabaseQuery = supabaseQuery.eq('category', category.trim());
    }

    // Add price range filter
    if (minPrice !== undefined && minPrice > 0) {
      supabaseQuery = supabaseQuery.gte('max_price', minPrice);
    }

    if (maxPrice !== undefined && maxPrice < Number.MAX_SAFE_INTEGER) {
      supabaseQuery = supabaseQuery.lte('min_price', maxPrice);
    }

    const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

    if (error) throw error;

    let results = (data || []).map(service => ({
      ...service,
      gallery: service.gallery || []
    })) as ServiceWithProvider[];

    // Filter by distance if user location provided
    if (userLocation && userLocation.lat && userLocation.lng) {
      results = results
        .map(service => {
          if (service.latitude && service.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              service.latitude,
              service.longitude
            );
            return { ...service, distance };
          }
          return { ...service, distance: Infinity };
        })
        .filter(service => (service as any).distance <= radiusKm)
        .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
    }

    return results;
  } catch (error) {
    console.error('Error searching services:', error);
    throw createError('Failed to search services', 500);
  }
};

// Get services for map display with optional bounds filtering
export const getServicesForMap = async (bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<Service[]> => {
  try {
    let query = supabase
      .from('services')
      .select('*')
      .eq('status', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (bounds) {
      query = query
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(service => ({
      ...service,
      gallery: service.gallery || []
    })) as Service[];
  } catch (error) {
    console.error('Error getting services for map:', error);
    throw createError('Failed to get services for map', 500);
  }
};

// Create new service
export const createService = async (serviceData: CreateServiceData & { provider_id: string }): Promise<Service> => {
  const { location, ...otherData } = serviceData;

  const { data, error } = await supabase
    .from('services')
    .insert([
      {
        ...otherData,
        status: true,
        min_price: serviceData.min_price || 0,
        max_price: serviceData.max_price || 0,
        main_image: serviceData.main_image,
        gallery: serviceData.gallery || [],
        social_media: serviceData.social_media || [],
        
        // Location fields
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        address: location?.address || null,
        city: location?.city || null,
        state: location?.state || null,
        country: location?.country || 'Colombia',
        postal_code: location?.postal_code || null,
        
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw createError('Failed to create service', 500);
  }

  return data as Service;
};

// Update existing service
export const updateService = async (
  serviceId: string,
  updateData: Partial<CreateServiceData>,
  userId: string
): Promise<Service> => {
  const { location, ...otherData } = updateData;

  const updateObject: any = {
    ...otherData,
    updated_at: new Date().toISOString(),
  };

  if (location) {
    updateObject.latitude = location.latitude ?? null;
    updateObject.longitude = location.longitude ?? null;
    updateObject.address = location.address ?? null;
    updateObject.city = location.city ?? null;
    updateObject.state = location.state ?? null;
    updateObject.country = location.country ?? 'Colombia';
    updateObject.postal_code = location.postal_code ?? null;
  }

  const { data, error } = await supabase
    .from('services')
    .update(updateObject)
    .eq('id', serviceId)
    .eq('provider_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    throw createError('Failed to update service', 500);
  }

  return data as Service;
};

// Toggle service status (active/inactive)
export const toggleServiceStatus = async (
  serviceId: string,
  userId: string
): Promise<Service> => {
  // First get the current service to check ownership and current status
  const { data: currentService, error: fetchError } = await supabase
    .from('services')
    .select('status, provider_id')
    .eq('id', serviceId)
    .eq('provider_id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching service:', fetchError);
    throw createError('Service not found or access denied', 404);
  }

  // Toggle the status
  const newStatus = !currentService.status;

  const { data, error } = await supabase
    .from('services')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)
    .eq('provider_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling service status:', error);
    throw createError('Failed to toggle service status', 500);
  }

  return data as Service;
};

// Soft delete service (set status to false)
export const deleteService = async (serviceId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('services')
    .update({ 
      status: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)
    .eq('provider_id', userId);

  if (error) {
    console.error('Error deleting service:', error);
    throw createError('Failed to delete service', 500);
  }
};

// Utility function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};