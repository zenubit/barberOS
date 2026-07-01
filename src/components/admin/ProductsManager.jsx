import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { formatCOP } from '../../data/businessData';
import { Modal, Field, ErrorBanner, TableSkeleton } from './AdminShared';
import productsService from '../../services/productsService';

const EMPTY_PRODUCT = {
  name: '', description: '', collection: '', price: '', stock: 0,
  category_id: '', color_name: '', color_hex: '', tag: '', material: '', sku: '', visible: true,
};
const EMPTY_CATEGORY = { name: '', description: '', active: true };

export default function ProductsManager() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [imageUrl, setImageUrl] = useState('');

  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([productsService.getAllProductsAdmin(), productsService.getCategories()]);
      setProducts(p || []);
      setCategories(c || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la tienda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreateProduct = () => { setEditingProduct('new'); setProductForm(EMPTY_PRODUCT); setImageUrl(''); };
  const openEditProduct = (p) => {
    setEditingProduct(p.id);
    setProductForm({ ...p, category_id: p.category_id || '' });
    setImageUrl(p.product_images?.[0]?.image_url || '');
  };

  const saveProduct = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        category_id: productForm.category_id || null,
      };
      let product;
      if (editingProduct === 'new') product = await productsService.createProduct(payload);
      else product = await productsService.updateProduct(editingProduct, payload);
      await productsService.setPrimaryImage(product.id, imageUrl.trim());
      setEditingProduct(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setError(null);
    try {
      await productsService.deleteProduct(id);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto');
    }
  };

  const openCreateCategory = () => { setEditingCategory('new'); setCategoryForm(EMPTY_CATEGORY); };
  const openEditCategory = (c) => { setEditingCategory(c.id); setCategoryForm(c); };

  const saveCategory = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingCategory === 'new') await productsService.createCategory(categoryForm);
      else await productsService.updateCategory(editingCategory, categoryForm);
      setEditingCategory(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    setError(null);
    try {
      await productsService.deleteCategory(id);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl">Tienda</h2>
        <button
          onClick={tab === 'products' ? openCreateProduct : openCreateCategory}
          className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2"
        >
          <Icon name="Plus" size={14} /> {tab === 'products' ? 'Nuevo producto' : 'Nueva categoría'}
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="flex gap-2 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {[{ id: 'products', label: 'Productos' }, { id: 'categories', label: 'Categorías' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer"
            style={tab === t.id ? { background: 'var(--teal)', color: 'var(--accent-ink)' } : { color: 'var(--ink-muted)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="surface overflow-hidden"><TableSkeleton cols={6} /></div> : tab === 'products' ? (
        <div className="surface overflow-hidden overflow-x-auto">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Visible</th><th></th></tr></thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin productos todavía.</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.product_categories?.name || '—'}</td>
                  <td className="font-mono text-teal-glow">{formatCOP(p.price)}</td>
                  <td className="font-mono">{p.stock}</td>
                  <td><span className={`pill ${p.visible ? 'pill-teal' : 'pill-ink'}`}>{p.visible ? 'sí' : 'no'}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditProduct(p)} aria-label={`Editar ${p.name}`} style={{ color: 'var(--ink-muted)' }}><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => removeProduct(p.id)} aria-label={`Eliminar ${p.name}`} style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Slug</th><th>Activa</th><th></th></tr></thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--ink-faint)' }}>Sin categorías todavía.</td></tr>
              )}
              {categories.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>{c.slug}</td>
                  <td><span className={`pill ${c.active ? 'pill-teal' : 'pill-ink'}`}>{c.active ? 'sí' : 'no'}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditCategory(c)} aria-label={`Editar ${c.name}`} style={{ color: 'var(--ink-muted)' }}><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => removeCategory(c.id)} aria-label={`Eliminar ${c.name}`} style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <Modal title={editingProduct === 'new' ? 'Nuevo producto' : 'Editar producto'} onClose={() => setEditingProduct(null)}>
          <Field label="Nombre"><input className="input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></Field>
          <Field label="Descripción"><input className="input" value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (COP)"><input className="input" type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} /></Field>
            <Field label="Stock"><input className="input" type="number" min="0" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <select className="input" value={productForm.category_id || ''} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="SKU"><input className="input" value={productForm.sku || ''} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></Field>
          </div>
          <Field label="URL de imagen"><input className="input" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></Field>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={productForm.visible} onChange={e => setProductForm({ ...productForm, visible: e.target.checked })} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Visible en tienda</span>
          </label>
          <button onClick={saveProduct} disabled={saving} className="btn-teal w-full mt-2">{saving ? 'Guardando...' : 'Guardar'}</button>
        </Modal>
      )}

      {editingCategory && (
        <Modal title={editingCategory === 'new' ? 'Nueva categoría' : 'Editar categoría'} onClose={() => setEditingCategory(null)}>
          <Field label="Nombre"><input className="input" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /></Field>
          <Field label="Descripción"><input className="input" value={categoryForm.description || ''} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm({ ...categoryForm, active: e.target.checked })} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Activa</span>
          </label>
          <button onClick={saveCategory} disabled={saving} className="btn-teal w-full mt-2">{saving ? 'Guardando...' : 'Guardar'}</button>
        </Modal>
      )}
    </div>
  );
}
