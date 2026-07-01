import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { Modal, Field } from './AdminShared';
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

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([barbersService.getAllBarbers(true), servicesService.getAllServicesAdmin()]);
      setBarbers(b || []);
      setServices(s || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing('new'); setForm(EMPTY); };
  const openEdit = (b) => { setEditing(b.id); setForm(b); };

  const save = async () => {
    if (editing === 'new') await barbersService.createBarber(form);
    else await barbersService.updateBarber(editing, form);
    setEditing(null);
    await load();
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este trabajador?')) return;
    await barbersService.deleteBarber(id);
    await load();
  };

  const openAssign = async (barber) => {
    setAssigning(barber);
    const ids = await barbersService.getBarberServiceIds(barber.id);
    setAssignedIds(ids || []);
  };

  const toggleService = (id) => {
    setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveAssign = async () => {
    await barbersService.setBarberServices(assigning.id, assignedIds);
    setAssigning(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-xl">Trabajadores</h2>
        <button onClick={openCreate} className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2">
          <Icon name="Plus" size={14} /> Nuevo
        </button>
      </div>

      {loading ? <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p> : (
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
                      <button onClick={() => openEdit(b)} style={{ color: 'var(--ink-muted)' }}><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => remove(b.id)} style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
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
          <button onClick={save} className="btn-teal w-full mt-2">Guardar</button>
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
