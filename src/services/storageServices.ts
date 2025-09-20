// ==================== src/services/storageService.ts ====================
import { supabaseAdmin } from '../config/supabase';
import { createError } from '../middleware/errorHandler';

export const uploadServiceImages = async (
  files: Express.Multer.File[],
  userId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Create unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;
    
    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(process.env.STORAGE_BUCKET_NAME || 'service-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error for file', fileName, ':', error);
        throw createError(`Error uploading ${file.originalname}: ${error.message}`, 500);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(process.env.STORAGE_BUCKET_NAME || 'service-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  return uploadedUrls;
};

export const deleteServiceImages = async (imageUrls: string[]): Promise<void> => {
  const bucketName = process.env.STORAGE_BUCKET_NAME || 'service-images';
  
  const filePaths = imageUrls.map(url => {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucketName);
    return urlParts.slice(bucketIndex + 1).join('/');
  });

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .remove(filePaths);

  if (error) {
    console.error('Error deleting images:', error);
    throw createError(`Error deleting images: ${error.message}`, 500);
  }
};

export const getOptimizedImageUrl = (
  filename: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options;
  const bucketName = process.env.STORAGE_BUCKET_NAME || 'service-images';
  
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filename);

  // Add transformation parameters if supported by your storage
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  
  return `${publicUrl}?${params.toString()}`;
};
