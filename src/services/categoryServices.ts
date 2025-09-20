// ==================== src/services/categoryService.ts ====================
import { supabase, supabaseAdmin } from '../config/supabase';
import { createError } from '../middleware/errorHandler';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw createError('Failed to fetch categories', 500);
  }

  return data as Category[];
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching category:', error);
    throw createError('Failed to fetch category', 500);
  }

  return data as Category;
};

export const createCategory = async (categoryData: any): Promise<Category> => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw createError('Failed to create category', 500);
  }

  return data as Category;
};

export const updateCategory = async (id: string, updateData: any): Promise<Category> => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw createError('Failed to update category', 500);
  }

  return data as Category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw createError('Failed to delete category', 500);
  }
};