import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { formatCOP } from '../../data/businessData';
import { Modal, Field } from './AdminShared';
import servicesService from '../../services/servicesService';

const EMPTY = { name: '', subtitle: '', description: '', price: '', duration_minutes: 45, max_capacity: 1, category: 'otro', available: true };

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try { setServices(await servicesService.getAllServicesAdmin() || []); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing('new'); setForm(EMPTY); };
  const openEdit = (s) => { setEditing(s.id); setForm(s); };

  const save = async () => {
    const payload = { ...form, price: Number(form.price), duration_minutes: Number(form.duration_minutes), max_capacity: Number(form.max_capacity) };
    if (editing === 'new') await servicesService.createService(payload);
    else await servicesService.updateService(editing, payload);
    setEditing(null);
    await load();
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    await servicesService.deleteService(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl">Servicios</h2>
        <button onClick={openCreate} className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2">
          <Icon name="Plus" size={14} /> Nuevo
        </button>
      </div>

      {loading ? <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p> : (
        <div className="surface overflow-hidden">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Duración</th><th>Capacidad</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="font-mono">{s.duration_minutes} min</td>
                  <td className="font-mono">{s.max_capacity}</td>
                  <td className="font-mono text-teal-glow">{formatCOP(s.price)}</td>
                  <td><span className={`pill ${s.available ? 'pill-teal' : 'pill-ink'}`}>{s.available ? 'activo' : 'inactivo'}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(s)} style={{ color: 'var(--ink-muted)' }}><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => remove(s.id)} style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'} onClose={() => setEditing(null)}>
          <Field label="Nombre"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Subtítulo"><input className="input" value={form.subtitle || ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (COP)"><input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Duración (min)"><input className="input" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacidad simultánea">
              <input className="input" type="number" min="1" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: e.target.value })} />
            </Field>
            <Field label="Categoría">
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="corte">Corte</option>
                <option value="afeitado">Afeitado</option>
                <option value="completo">Completo</option>
                <option value="diseño">Diseño</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
            <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>Disponible para reservar</span>
          </label>
          <button onClick={save} className="btn-teal w-full mt-2">Guardar</button>
        </Modal>
      )}
    </div>
  );
}
