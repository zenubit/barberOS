# BarberOS — Estado del proyecto y próximos pasos

> Este archivo es el punto de partida si retomas el trabajo en un chat nuevo.
> Pégaselo a Claude al abrir la conversación para que tenga contexto completo.

## Qué es esto

Clon de la app de agendamiento de Cénit (barbería), pero para **BarberOS**: otro diseño (tema oscuro/claro teal, estética "terminal/OS"), otra base de datos Supabase, y un modelo de negocio mejorado (varios trabajadores, varios servicios, franjas reservadas para clientes frecuentes, bloqueos tipo almuerzo/vacaciones).

Vive en `Desktop/BarberOS`, completamente separado de `Desktop/cenit` (no se tocó nada de ese proyecto).

## Stack

- Vite + React 19 + React Router 7 + Tailwind v4 + Framer Motion + lucide-react
- Supabase (Postgres) — proyecto `ursxdtclgeiwjjalgyje`
- Credenciales en `.env` (gitignored, no está en el repo)

## Base de datos — ya aplicada y verificada

Esquema completo en [`supabase/schema.sql`](supabase/schema.sql), aplicado contra la DB real con `npm run db:apply` (usa `apply-schema.js` + `DATABASE_URL` del `.env`).

Tablas: `profiles`, `barbers`, `services`, `barber_services` (qué trabajador hace qué servicio), `barber_schedules` (horario semanal por trabajador), `schedule_blocks` (almuerzo/día libre/vacaciones/custom, con recurrencia), `reserved_slots` (franjas reservadas para clientes frecuentes), `appointments`, `reservations`/`products`/`product_categories`/`product_images` (tienda), `daily_sales`/`expenses` (caja), `monthly_raffles` (sorteos), `notifications_log`, `admin_settings`.

Función clave: `get_available_slots(barber_id, service_id, date, client_phone)` — calcula disponibilidad real considerando duración/capacidad del servicio, horario, bloqueos y franjas reservadas.

**Estado actual de los datos: la base está vacía.** 0 servicios, 0 trabajadores. Hay que cargar datos reales (o seed) desde el panel admin para poder probar el flujo de reserva de punta a punta.

## Qué está construido (funcional)

- **Home** (`src/pages/Home.jsx`) — landing, carga servicios/equipo en vivo
- **Reservar** (`src/pages/Booking.jsx`) — flujo de 4 pasos: servicio → barbero → fecha/hora → confirmación
- **Auth / Perfil** (`src/pages/Auth.jsx`, `Profile.jsx`) — login, registro, "mis citas" con cancelación
- **Admin** (`src/pages/Admin.jsx` + `src/components/admin/*`):
  - Dashboard (KPIs + agenda del día)
  - Trabajadores (CRUD + asignar servicios por trabajador)
  - Servicios (CRUD + capacidad simultánea)
  - Horarios y bloqueos (horario semanal, bloqueos, franjas reservadas para clientes frecuentes)
  - Citas (filtros por fecha/estado/trabajador, cambio de estado)

`npm run build` compila sin errores. `npx eslint .` sin errores (solo warnings de dependencias de hooks, no bloqueantes).

## Qué falta (pendiente de construir)

1. **Cargar datos reales**: servicios, trabajadores, horarios, asignación trabajador↔servicio. Sin esto no se puede probar el flujo de reserva visualmente.
2. **Tienda, Caja/Gastos, Sorteos** — las tablas de DB ya existen, pero las pantallas de admin son solo un placeholder ("Próximamente"). Falta construir las vistas (reutilizar el patrón de `ServicesManager.jsx`/`BarbersManager.jsx`).
3. **Notificaciones por correo** — Cénit usa nodemailer + un endpoint `api/send-email.js`; en BarberOS no se implementó todavía (no hay envío de confirmación de cita por correo).
4. **Opción "cualquiera disponible"** en el paso de selección de barbero — hoy el cliente debe elegir un barbero específico.
5. **Reserva de un solo servicio por cita** — el esquema (`appointments.service_id`) es de un solo servicio; si se necesita agendar varios servicios en una sola cita habría que rediseñar esa parte.
6. **Push a GitHub** (`zenubit/barberOS`, repo público) — quedó pendiente: la cuenta autenticada en esta máquina (`Josep991`) no tiene permiso de escritura sobre ese repo. Hay un commit local (`gitignore` + fix de README) sin subir. Falta iniciar sesión con la cuenta dueña del repo (`gh auth login`, ver conversación anterior) y correr `git push -u origin main`.
7. **Datos de contacto reales del negocio** — `src/data/businessData.js` tiene placeholders (teléfono, WhatsApp, ubicación). Reemplazar cuando se tengan los datos reales.
8. **Optimizar bundle** — el build avisa que el chunk JS supera 500kB; no es urgente, pero si crece más conviene code-splitting con `React.lazy`.

## Qué probar (checklist antes de dar por lista una función)

- [ ] Crear un servicio y un trabajador desde el admin, asignar el servicio al trabajador, configurar su horario semanal
- [ ] Flujo de reserva completo como cliente logueado, verificar que la cita quede en Supabase (`appointments`)
- [ ] Que un bloqueo (ej. almuerzo 12-13h) realmente oculte esos horarios en el paso de fecha/hora
- [ ] Que una franja reservada para un cliente frecuente bloquee el horario para otros clientes pero lo deje disponible para ese cliente (usar su teléfono)
- [ ] Cancelar una cita desde "Mis citas" y confirmar que el estado cambia en la DB
- [ ] Cambiar el estado de una cita desde el admin (Citas) y verificar reflejo inmediato
- [ ] Probar el toggle de tema claro/oscuro
- [ ] Probar en móvil (el diseño es mobile-first pero no se verificó visualmente por falta de navegador conectado en esta sesión)
- [ ] Revisar políticas RLS con un usuario real no-admin (que solo vea sus propias citas, no las de otros)

## Cómo correr el proyecto

```bash
cd Desktop/BarberOS
npm install       # si hace falta
npm run dev       # servidor de desarrollo (http://localhost:5173 o el puerto libre)
npm run build     # build de producción
npm run db:apply  # reaplica supabase/schema.sql contra la DB (usa CREATE TABLE IF NOT EXISTS, es seguro repetir)
npm run db:verify # lista las tablas actuales en la DB
```

## Notas de seguridad

- `.env` tiene las credenciales reales (URL, anon key, service role key, connection string). Está en `.gitignore`, nunca se subió a GitHub.
- El repo `zenubit/barberOS` es **público** — cuidado con no commitear nada que tenga secretos en texto plano.
