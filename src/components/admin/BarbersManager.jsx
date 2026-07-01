import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { Modal, Field, ErrorBanner, TableSkeleton } from './AdminShared';
import barbersService from '../../services/barbersService';
import servicesService from '../../services/servicesService';

const EMPTY = { name: '', role: 'Barbero', years_experience: '', signature_style: '', phone: '', email: '', status: 'active' };

export default function BarbersManager() {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [assigning, setAssigning] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([barbersService.getAllBarbers(true), servicesService.getAllServicesAdmin()]);
      setBarbers(b || []);
      setServices(s || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing('new'); setForm(EMPTY); };
  const openEdit = (b) => { setEditing(b.id); setForm(b); };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing === 'new') await barbersService.createBarber(form);
      else await barbersService.updateBarber(editing, form);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el trabajador');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este trabajador?')) return;
    setError(null);
    try {
      await barbersService.deleteBarber(id);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el trabajador');
    }
  };

  const openAssign = async (barber) => {
    setAssigning(barber);
    try {
      const ids = await barbersService.getBarberServiceIds(barber.id);
      setAssignedIds(ids || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los servicios asignados');
    }
  };

  const toggleService = (id) => {
    setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveAssign = async () => {
    setError(null);
    try {
      await barbersService.setBarberServices(assigning.id, assignedIds);
      setAssigning(null);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la asignación');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl">Trabajadores</h2>
        <button onClick={openCreate} className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2">
          <Icon name="Plus" size={14} /> Nuevo
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {loading ? <div className="surface overflow-hidden"><TableSkeleton cols={5} /></div> : (
        <div className="surface overflow-hidden">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th>Servicios</th><th></th></tr></thead>
            <tbody>
              {barbers.map(b => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.role}</td>
                  <td><span className={`pill ${b.status === 'active' ? 'pill-teal' : 'pill-ink'}`}>{b.status}</span></td>
                  <td>
                    <button onClick={() => openAssign(b)} className="text-xs hover:opacity-80" style={{ color: 'var(--teal)' }}>Asignar</button>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(b)} aria-label={`Editar ${b.name}`} style={{ color: 'var(--ink-muted)' }}><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => remove(b.id)} aria-label={`Eliminar ${b.name}`} style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nuevo trabajador' : 'Editar trabajador'} onClose={() => setEditing(null)}>
          <Field label="Nombre"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Rol"><input className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Años de experiencia"><input className="input" type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: Number(e.target.value) })} /></Field>
          <Field label="Estilo / especialidad"><input className="input" value={form.signature_style} onChange={e => setForm({ ...form, signature_style: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Estado">
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="on-leave">De permiso</option>
            </select>
          </Field>
          <button onClick={save} disabled={saving} className="btn-teal w-full mt-2">{saving ? 'Guardando...' : 'Guardar'}</button>
        </Modal>
      )}

      {assigning && (
        <Modal title={`Servicios de ${assigning.name}`} onClose={() => setAssigning(null)}>
          <div className="space-y-2 mb-4">
            {services.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: 'var(--surface-2)' }}>
                <input type="checkbox" checked={assignedIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
          <button onClick={saveAssign} className="btn-teal w-full">Guardar asignación</button>
        </Modal>
      )}
    </div>
  );
}
