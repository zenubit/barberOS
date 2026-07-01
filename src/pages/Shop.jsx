import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon, Skeleton } from '../components/Shared';
import { formatCOP, CONTACT_INFO } from '../data/businessData';
import productsService from '../services/productsService';

function handleSpotlight(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

function ProductCard({ p, i }) {
  const image = p.product_images?.sort((a, b) => a.display_order - b.display_order)?.[0]?.image_url;
  const outOfStock = (p.stock ?? 0) <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (i % 6) * 0.06 }}
      onMouseMove={handleSpotlight}
      className="glass-panel spotlight-card overflow-hidden flex flex-col"
    >
      <div
        className="aspect-square flex items-center justify-center relative"
        style={{ background: image ? `center/cover no-repeat url(${image})` : 'var(--surface-2)' }}
      >
        {!image && <Icon name="Package" size={36} style={{ color: 'var(--ink-faint)' }} />}
        {p.tag && (
          <span className="absolute top-3 left-3 pill pill-teal">{p.tag}</span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(6,8,11,0.72)' }}>
            <span className="pill pill-red">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        {p.product_categories?.name && (
          <span className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>
            {p.product_categories.name}
          </span>
        )}
        <h3 className="font-display font-semibold text-base mb-1.5">{p.name}</h3>
        {p.description && (
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--ink-muted)' }}>{p.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-mono text-lg font-semibold text-teal-glow">{formatCOP(p.price)}</span>
          <a
            href={CONTACT_INFO.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium hover:opacity-80 inline-flex items-center gap-1.5"
            style={{ color: outOfStock ? 'var(--ink-faint)' : 'var(--teal)', pointerEvents: outOfStock ? 'none' : 'auto' }}
          >
            <Icon name="MessageCircle" size={13} /> Consultar
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([productsService.getPublicProducts(), productsService.getPublicCategories()]);
        if (mounted) { setProducts(p || []); setCategories(c || []); }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category_id === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-24 md:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <span className="font-display italic text-base" style={{ color: 'var(--teal)' }}>Tienda</span>
        <h1 className="font-display font-semibold text-3xl md:text-4xl mt-1">Productos de cuidado</h1>
        <p className="mt-3 max-w-xl text-sm" style={{ color: 'var(--ink-muted)' }}>
          Los mismos productos que usamos en el sillón, listos para llevar a casa. Consulta disponibilidad por WhatsApp.
        </p>
      </motion.div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`pill cursor-pointer ${activeCategory === 'all' ? 'pill-teal' : 'pill-ink'}`}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`pill cursor-pointer ${activeCategory === c.id ? 'pill-teal' : 'pill-ink'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-panel overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-5">
                <Skeleton className="h-4 w-2/3 rounded mb-3" />
                <Skeleton className="h-3 w-full rounded mb-2" />
                <Skeleton className="h-6 w-1/3 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface p-10 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
          <Icon name="PackageOpen" size={28} className="mx-auto mb-3" style={{ color: 'var(--ink-faint)' }} />
          Aún no hay productos disponibles en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
      )}
    </div>
  );
}
