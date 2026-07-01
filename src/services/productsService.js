import { supabase } from './supabaseClient';

const handleError = (error, context) => {
  const errorMessage = error?.message || 'Error desconocido';
  console.error(`[ProductsService - ${context}]:`, errorMessage);
  throw new Error(`${context}: ${errorMessage}`);
};

const slugify = (name) =>
  name.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const productsService = {
  // Vista pública (tienda): RLS ya filtra a solo visible=true / categorías activas,
  // pero se acota explícitamente aquí para dejar la intención clara en el código.
  async getPublicProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories:category_id(name, slug), product_images(id, image_url, display_order)')
        .eq('visible', true)
        .order('created_at', { ascending: false });
      if (error) handleError(error, 'getPublicProducts');
      return data || [];
    } catch (err) {
      handleError(err, 'getPublicProducts');
    }
  },

  async getPublicCategories() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (error) handleError(error, 'getPublicCategories');
      return data || [];
    } catch (err) {
      handleError(err, 'getPublicCategories');
    }
  },

  async getAllProductsAdmin() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories:category_id(name, slug), product_images(id, image_url, display_order)')
        .order('created_at', { ascending: false });
      if (error) handleError(error, 'getAllProductsAdmin');
      return data || [];
    } catch (err) {
      handleError(err, 'getAllProductsAdmin');
    }
  },

  async getCategories(includeInactive = true) {
    try {
      let query = supabase.from('product_categories').select('*').order('display_order', { ascending: true });
      if (!includeInactive) query = query.eq('active', true);
      const { data, error } = await query;
      if (error) handleError(error, 'getCategories');
      return data || [];
    } catch (err) {
      handleError(err, 'getCategories');
    }
  },

  async createCategory(categoryData) {
    try {
      if (!categoryData.name) throw new Error('El nombre de la categoría es requerido');
      const { data, error } = await supabase
        .from('product_categories')
        .insert([{
          name: categoryData.name,
          slug: slugify(categoryData.name),
          description: categoryData.description || '',
          display_order: categoryData.display_order || 999,
          active: categoryData.active !== false,
        }])
        .select();
      if (error) handleError(error, 'createCategory');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createCategory');
    }
  },

  async updateCategory(id, updates) {
    try {
      if (!id) throw new Error('Category ID es requerido');
      const payload = { ...updates };
      if (updates.name) payload.slug = slugify(updates.name);
      const { data, error } = await supabase.from('product_categories').update(payload).eq('id', id).select();
      if (error) handleError(error, 'updateCategory');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateCategory');
    }
  },

  async deleteCategory(id) {
    try {
      if (!id) throw new Error('Category ID es requerido');
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error('No se puede eliminar: tiene productos asociados.');
        handleError(error, 'deleteCategory');
      }
      return true;
    } catch (err) {
      handleError(err, 'deleteCategory');
    }
  },

  async createProduct(productData) {
    try {
      if (!productData.name || !productData.price) throw new Error('Campos requeridos faltantes (name, price)');
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description || '',
          collection: productData.collection || null,
          price: productData.price,
          stock: productData.stock ?? 0,
          category_id: productData.category_id || null,
          color_hex: productData.color_hex || null,
          accent_hex: productData.accent_hex || null,
          color_name: productData.color_name || null,
          tag: productData.tag || null,
          material: productData.material || null,
          sku: productData.sku || null,
          visible: productData.visible !== false,
        }])
        .select();
      if (error) handleError(error, 'createProduct');
      return data?.[0];
    } catch (err) {
      handleError(err, 'createProduct');
    }
  },

  async updateProduct(id, updates) {
    try {
      if (!id) throw new Error('Product ID es requerido');
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) handleError(error, 'updateProduct');
      return data?.[0];
    } catch (err) {
      handleError(err, 'updateProduct');
    }
  },

  async deleteProduct(id) {
    try {
      if (!id) throw new Error('Product ID es requerido');
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error('No se puede eliminar: tiene apartados asociados.');
        handleError(error, 'deleteProduct');
      }
      return true;
    } catch (err) {
      handleError(err, 'deleteProduct');
    }
  },

  // Reemplaza la imagen principal de un producto (sin bucket de Storage configurado
  // todavía, se guarda por URL directa en product_images).
  async setPrimaryImage(productId, imageUrl) {
    try {
      if (!productId) throw new Error('Product ID es requerido');
      const { error: delError } = await supabase.from('product_images').delete().eq('product_id', productId);
      if (delError) handleError(delError, 'setPrimaryImage (delete)');

      if (imageUrl) {
        const { error: insError } = await supabase
          .from('product_images')
          .insert([{ product_id: productId, image_url: imageUrl, display_order: 0 }]);
        if (insError) handleError(insError, 'setPrimaryImage (insert)');
      }
      return true;
    } catch (err) {
      handleError(err, 'setPrimaryImage');
    }
  }
};

export default productsService;
