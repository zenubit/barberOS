import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { Modal, Field, ErrorBanner } from './AdminShared';
import barbersService from '../../services/barbersService';
import scheduleService from '../../services/scheduleService';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BLOCK_TYPES = [
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'break', label: 'Descanso' },
  { value: 'day_off', label: 'Día libre' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'custom', label: 'Personalizado' },
];

const EMPTY_BLOCK = { block_type: 'lunch', start_date: '', end_date: '', start_time: '12:00', end_time: '13:00', recurrence: 'daily', reason: '' };
const EMPTY_RESERVED = { client_name: '', client_phone: '', slot_date: '', start_time: '', end_time: '', notes: '' };

export default function ScheduleManager({ fixedBarberId = null }) {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState(fixedBarberId);
  const [tab, setTab] = useState('schedule');

  const [schedule, setSchedule] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [reserved, setReserved] = useState([]);

  const [blockForm, setBlockForm] = useState(null);
  const [reservedForm, setReservedForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fixedBarberId) { setBarberId(fixedBarberId); return; }
    (async () => {
      try {
        const b = await barbersService.getAllBarbers(true);
        setBarbers(b || []);
        if (b?.length) setBarberId(b[0].id);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los trabajadores');
      }
    })();
  }, [fixedBarberId]);

  const loadAll = async (id) => {
    if (!id) return;
    try {
      const [sch, blk, res] = await Promise.all([
        scheduleService.getBarberSchedule(id),
        scheduleService.getBlocks(id),
        scheduleService.getReservedSlots(id),
      ]);
      const byDay = {};
      (sch || []).forEach(row => { byDay[row.day_of_week] = row; });
      setSchedule(DAYS.map((_, i) => byDay[i] || { day_of_week: i, open_time: '09:00', close_time: '18:00', is_active: false }));
      setBlocks(blk || []);
      setReserved(res || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el horario');
    }
  };

  useEffect(() => { loadAll(barberId); }, [barberId]);

  const updateDay = async (day, updates) => {
    const current = schedule.find(d => d.day_of_week === day);
    const merged = { ...current, ...updates };
    setSchedule(schedule.map(d => d.day_of_week === day ? merged : d));
    try {
      await scheduleService.upsertScheduleDay(barberId, day, {
        open_time: merged.open_time, close_time: merged.close_time, is_active: merged.is_active,
      });
    } catch (err) {
      setError(err.message || 'No se pudo guardar el horario del día');
    }
  };

  const saveBlock = async () => {
    setError(null);
    try {
      await scheduleService.createBlock({ ...blockForm, barber_id: barberId });
      setBlockForm(null);
      await loadAll(barberId);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el bloqueo');
    }
  };

  const removeBlock = async (id) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    setError(null);
    try {
      await scheduleService.deleteBlock(id);
      await loadAll(barberId);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el bloqueo');
    }
  };

  const saveReserved = async () => {
    setError(null);
    try {
      await scheduleService.createReservedSlot({ ...reservedForm, barber_id: barberId });
      setReservedForm(null);
      await loadAll(barberId);
    } catch (err) {
      setError(err.message || 'No se pudo reservar la franja');
    }
  };

  const cancelReserved = async (id) => {
    setError(null);
    try {
      await scheduleService.cancelReservedSlot(id);
      await loadAll(barberId);
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la franja');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display font-bold text-xl">{fixedBarberId ? 'Mi horario' : 'Horarios y bloqueos'}</h2>
        {!fixedBarberId && (
          <select className="input !w-auto" value={barberId || ''} onChange={e => setBarberId(e.target.value)}>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="flex gap-2 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {[
          { id: 'schedule', label: 'Horario semanal' },
          { id: 'blocks', label: 'Bloqueos' },
          { id: 'reserved', label: 'Clientes frecuentes' },
        ].map(t => (
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

      {tab === 'schedule' && (
        <div className="surface divide-y" style={{ borderColor: 'var(--border)' }}>
          {schedule.map(d => (
            <div key={d.day_of_week} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--border)' }}>
              <label className="flex items-center gap-2 w-32 cursor-pointer">
                <input type="checkbox" checked={d.is_active} onChange={e => updateDay(d.day_of_week, { is_active: e.target.checked })} />
                <span className="text-sm">{DAYS[d.day_of_week]}</span>
              </label>
              <input type="time" className="input !w-auto" value={d.open_time?.slice(0,5)} disabled={!d.is_active}
                onChange={e => updateDay(d.day_of_week, { open_time: e.target.value })} />
              <span style={{ color: 'var(--ink-faint)' }}>—</span>
              <input type="time" className="input !w-auto" value={d.close_time?.slice(0,5)} disabled={!d.is_active}
                onChange={e => updateDay(d.day_of_week, { close_time: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {tab === 'blocks' && (
        <div>
          <button onClick={() => setBlockForm(EMPTY_BLOCK)} className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2 mb-4">
            <Icon name="Plus" size={14} /> Nuevo bloqueo
          </button>
          <div className="space-y-2">
            {blocks.length === 0 && <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Sin bloqueos configurados.</p>}
            {blocks.map(b => (
              <div key={b.id} className="surface p-4 flex items-center justify-between">
                <div>
                  <span className="pill pill-amber mr-2">{BLOCK_TYPES.find(t => t.value === b.block_type)?.label || b.block_type}</span>
                  <span className="text-sm">{b.start_date} → {b.end_date}{b.start_time ? ` · ${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}` : ' (todo el día)'}</span>
                  {b.reason && <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>{b.reason}</p>}
                </div>
                <button onClick={() => removeBlock(b.id)} aria-label="Eliminar bloqueo" style={{ color: '#ff8080' }}><Icon name="Trash2" size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reserved' && (
        <div>
          <button onClick={() => setReservedForm(EMPTY_RESERVED)} className="btn-teal !py-2 !px-4 !text-xs flex items-center gap-2 mb-4">
            <Icon name="Plus" size={14} /> Reservar franja
          </button>
          <div className="space-y-2">
            {reserved.length === 0 && <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Sin franjas reservadas.</p>}
            {reserved.map(r => (
              <div key={r.id} className="surface p-4 flex items-center justify-between">
                <div>
                  <span className={`pill ${r.status === 'reserved' ? 'pill-teal' : 'pill-ink'} mr-2`}>{r.status}</span>
                  <span className="text-sm">{r.client_name} · {r.slot_date} · {r.start_time?.slice(0,5)}-{r.end_time?.slice(0,5)}</span>
                </div>
                {r.status === 'reserved' && (
                  <button onClick={() => cancelReserved(r.id)} aria-label="Cancelar franja reservada" style={{ color: '#ff8080' }}><Icon name="X" size={15} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {blockForm && (
        <Modal title="Nuevo bloqueo" onClose={() => setBlockForm(null)}>
          <Field label="Tipo">
            <select className="input" value={blockForm.block_type} onChange={e => setBlockForm({ ...blockForm, block_type: e.target.value })}>
              {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Desde"><input type="date" className="input" value={blockForm.start_date} onChange={e => setBlockForm({ ...blockForm, start_date: e.target.value })} /></Field>
            <Field label="Hasta"><input type="date" className="input" value={blockForm.end_date} onChange={e => setBlockForm({ ...blockForm, end_date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hora inicio (opcional)"><input type="time" className="input" value={blockForm.start_time || ''} onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })} /></Field>
            <Field label="Hora fin (opcional)"><input type="time" className="input" value={blockForm.end_time || ''} onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })} /></Field>
          </div>
          <Field label="Recurrencia">
            <select className="input" value={blockForm.recurrence} onChange={e => setBlockForm({ ...blockForm, recurrence: e.target.value })}>
              <option value="none">Única vez</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
            </select>
          </Field>
          <Field label="Motivo"><input className="input" value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} /></Field>
          <button onClick={saveBlock} className="btn-teal w-full mt-2">Guardar bloqueo</button>
        </Modal>
      )}

      {reservedForm && (
        <Modal title="Reservar franja para cliente frecuente" onClose={() => setReservedForm(null)}>
          <Field label="Nombre del cliente"><input className="input" value={reservedForm.client_name} onChange={e => setReservedForm({ ...reservedForm, client_name: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input" value={reservedForm.client_phone} onChange={e => setReservedForm({ ...reservedForm, client_phone: e.target.value })} /></Field>
          <Field label="Fecha"><input type="date" className="input" value={reservedForm.slot_date} onChange={e => setReservedForm({ ...reservedForm, slot_date: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hora inicio"><input type="time" className="input" value={reservedForm.start_time} onChange={e => setReservedForm({ ...reservedForm, start_time: e.target.value })} /></Field>
            <Field label="Hora fin"><input type="time" className="input" value={reservedForm.end_time} onChange={e => setReservedForm({ ...reservedForm, end_time: e.target.value })} /></Field>
          </div>
          <Field label="Notas"><input className="input" value={reservedForm.notes} onChange={e => setReservedForm({ ...reservedForm, notes: e.target.value })} /></Field>
          <button onClick={saveReserved} className="btn-teal w-full mt-2">Reservar</button>
        </Modal>
      )}
    </div>
  );
}
