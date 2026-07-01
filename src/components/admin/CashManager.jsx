import React, { useEffect, useState } from 'react';
import { Icon } from '../Shared';
import { formatCOP } from '../../data/businessData';
import { ErrorBanner, KPI, TableSkeleton } from './AdminShared';
import financeService from '../../services/financeService';
import appointmentsService from '../../services/appointmentsService';
import { todayISO } from '../../lib/date';

const EXPENSE_CATEGORIES = ['Insumos', 'Servicios públicos', 'Arriendo', 'Nómina', 'Mantenimiento', 'Otro'];

export default function CashManager({ fixedBarberId = null }) {
  const [date, setDate] = useState(todayISO());
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [appointmentRevenue, setAppointmentRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saleForm, setSaleForm] = useState({ quantity: 1, price_per_unit: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Otro', description: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, e, appts] = await Promise.all([
        financeService.getSales({ from: date, to: date, barberId: fixedBarberId || undefined }),
        financeService.getExpenses({ from: date, to: date, barberId: fixedBarberId || undefined }),
        fixedBarberId
          ? appointmentsService.getAllAppointments({ date, barberId: fixedBarberId, status: 'completed' })
          : Promise.resolve([]),
      ]);
      setSales(s || []);
      setExpenses(e || []);
      setAppointmentRevenue((appts || []).reduce((sum, a) => sum + Number(a.services?.price || 0), 0));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, fixedBarberId]);

  const counterSales = sales.reduce((sum, s) => sum + Number(s.total ?? s.quantity * s.price_per_unit), 0);
  const totalSales = counterSales + appointmentRevenue;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const net = totalSales - totalExpenses;

  const addSale = async () => {
    setSaving(true);
    setError(null);
    try {
      await financeService.createSale({ ...saleForm, date, price_per_unit: Number(saleForm.price_per_unit), quantity: Number(saleForm.quantity) || 1, barber_id: fixedBarberId });
      setSaleForm({ quantity: 1, price_per_unit: '', description: '' });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  const removeSale = async (id) => {
    if (!confirm('¿Eliminar esta venta?')) return;
    setError(null);
    try { await financeService.deleteSale(id); await load(); }
    catch (err) { setError(err.message || 'No se pudo eliminar la venta'); }
  };

  const addExpense = async () => {
    setSaving(true);
    setError(null);
    try {
      await financeService.createExpense({ ...expenseForm, date, amount: Number(expenseForm.amount), barber_id: fixedBarberId });
      setExpenseForm({ category: 'Otro', description: '', amount: '' });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    setError(null);
    try { await financeService.deleteExpense(id); await load(); }
    catch (err) { setError(err.message || 'No se pudo eliminar el gasto'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display font-bold text-xl">{fixedBarberId ? 'Mi caja' : 'Caja y gastos'}</h2>
        <input type="date" aria-label="Fecha" className="input !w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className={`grid grid-cols-1 ${fixedBarberId ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 mb-8`}>
        {fixedBarberId && <KPI label="Citas completadas" value={appointmentRevenue} icon="CalendarCheck" format={formatCOP} />}
        <KPI label={fixedBarberId ? 'Ventas mostrador' : 'Ventas del día'} value={counterSales} icon="TrendingUp" format={formatCOP} />
        <KPI label="Gastos del día" value={totalExpenses} icon="TrendingDown" format={formatCOP} />
        <KPI label="Neto" value={net} icon="Wallet" format={formatCOP} />
      </div>

      {loading ? <TableSkeleton cols={4} /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-display font-semibold mb-3">Ventas</h3>
            <div className="surface p-4 mb-3 grid grid-cols-4 gap-2 items-end">
              <label className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                Cant.
                <input className="input mt-1" type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm({ ...saleForm, quantity: e.target.value })} />
              </label>
              <label className="text-xs col-span-1" style={{ color: 'var(--ink-faint)' }}>
                Precio unit.
                <input className="input mt-1" type="number" value={saleForm.price_per_unit} onChange={e => setSaleForm({ ...saleForm, price_per_unit: e.target.value })} />
              </label>
              <label className="text-xs col-span-1" style={{ color: 'var(--ink-faint)' }}>
                Descripción
                <input className="input mt-1" value={saleForm.description} onChange={e => setSaleForm({ ...saleForm, description: e.target.value })} />
              </label>
              <button onClick={addSale} disabled={saving || !saleForm.price_per_unit} className="btn-teal !py-2.5 !text-xs">Añadir</button>
            </div>
            <div className="surface overflow-hidden">
              <table className="table">
                <thead><tr><th>Cant.</th><th>Total</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {sales.length === 0 && <tr><td colSpan={4} className="text-center py-6" style={{ color: 'var(--ink-faint)' }}>Sin ventas este día.</td></tr>}
                  {sales.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono">{s.quantity}</td>
                      <td className="font-mono text-teal-glow">{formatCOP(s.total ?? s.quantity * s.price_per_unit)}</td>
                      <td>{s.description}</td>
                      <td><button onClick={() => removeSale(s.id)} aria-label="Eliminar venta" style={{ color: '#ff8080' }}><Icon name="Trash2" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-3">Gastos</h3>
            <div className="surface p-4 mb-3 grid grid-cols-4 gap-2 items-end">
              <label className="text-xs col-span-1" style={{ color: 'var(--ink-faint)' }}>
                Categoría
                <select className="input mt-1" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-xs col-span-1" style={{ color: 'var(--ink-faint)' }}>
                Descripción
                <input className="input mt-1" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
              </label>
              <label className="text-xs col-span-1" style={{ color: 'var(--ink-faint)' }}>
                Monto
                <input className="input mt-1" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </label>
              <button onClick={addExpense} disabled={saving || !expenseForm.description || !expenseForm.amount} className="btn-teal !py-2.5 !text-xs">Añadir</button>
            </div>
            <div className="surface overflow-hidden">
              <table className="table">
                <thead><tr><th>Categoría</th><th>Monto</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {expenses.length === 0 && <tr><td colSpan={4} className="text-center py-6" style={{ color: 'var(--ink-faint)' }}>Sin gastos este día.</td></tr>}
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td>{e.category}</td>
                      <td className="font-mono" style={{ color: 'var(--danger)' }}>{formatCOP(e.amount)}</td>
                      <td>{e.description}</td>
                      <td><button onClick={() => removeExpense(e.id)} aria-label="Eliminar gasto" style={{ color: '#ff8080' }}><Icon name="Trash2" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
