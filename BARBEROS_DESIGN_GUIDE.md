# BarberOS - Design System & Brand Guide

## Visión General
BarberOS es una plataforma de agendamiento para barberías con interfaz moderna, modo claro/oscuro y flujo de reserva intuitivo.

---

## 🎨 Paleta de Colores

### Colores Primarios
- **Acento Principal (Teal)**: `#00F5D4` - Usado en botones, highlights, elementos interactivos
- **Fondo Oscuro**: `#121212` - Fondo principal en modo oscuro
- **Texto Claro**: `#FFFFFF` - Texto principal en modo oscuro
- **Borde Oscuro**: `#2A2A2A` - Bordes en modo oscuro

### Modo Claro
- **Fondo Claro**: `#F5F5F5` - Fondo principal en modo claro
- **Texto Oscuro**: `#1A1A1A` - Texto principal en modo claro
- **Borde Claro**: `#E0E0E0` - Bordes en modo claro

### Colores Secundarios
- **Verde Éxito**: `#4CAF50` - Para estados confirmados/exitosos
- **Naranja/Ámbar**: `#FF9800` - Para estados pendientes

---

## 🔤 Tipografía

### Fuentes Principales
- **Títulos**: `Poppins` (peso 600/700)
- **Cuerpo**: `Inter` (peso 400/500)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Tamaños Recomendados
- H1 (Títulos principales): 32-40px
- H2 (Subtítulos): 24-28px
- H3 (Encabezados): 18-20px
- Cuerpo (Body text): 14-16px
- Pequeño (Small): 12-14px

---

## 🎯 Componentes & Patrones

### Botones
- **Primario (CTA)**: Fondo `#00F5D4`, texto negro, padding 12-16px, border-radius 6px
- **Secundario**: Borde `2px solid #00F5D4`, fondo transparente, texto teal
- **Estado hover**: Opacidad 0.8 o color oscurecido

### Tarjetas / Contenedores
- Border: `1px solid` (color de borde según tema)
- Border-radius: 8-12px
- Padding: 16-20px
- Sombra (opcional): `0 2px 8px rgba(0, 245, 212, 0.1)` (solo con teal de acento)

### Inputs & Formularios
- Fondo: Color secundario del tema
- Border: `1px solid` color de borde
- Border-radius: 6px
- Padding: 12px
- Focus: Border color `#00F5D4`, shadow ligero

### Navegación
- Header sticky, altura 60px
- Logo + Marca en izquierda
- Navegación centro (Inicio, Reservar, Mis Citas)
- Toggle modo claro/oscuro en derecha

---

## 🎭 Modo Oscuro (Dark Mode)

**Paleta Oscura:**
```
Fondo: #121212
Secundario: #1E1E1E
Texto: #FFFFFF
Borde: #2A2A2A
Acento: #00F5D4
```

**Aplicación:**
- Fondo page: `#121212`
- Tarjetas/contenedores: `#1E1E1E` (opcional)
- Todos los textos: `#FFFFFF`
- Bordes: `#2A2A2A`
- Botones primarios: `#00F5D4` con texto negro

---

## ☀️ Modo Claro (Light Mode)

**Paleta Clara:**
```
Fondo: #F5F5F5
Secundario: #FFFFFF
Texto: #1A1A1A
Borde: #E0E0E0
Acento: #00F5D4
```

**Aplicación:**
- Fondo page: `#F5F5F5`
- Tarjetas/contenedores: `#FFFFFF`
- Todos los textos: `#1A1A1A`
- Bordes: `#E0E0E0`
- Botones primarios: `#00F5D4` con texto negro

---

## 📐 Espaciado (Spacing Scale)

```
4px   - xs
8px   - sm
12px  - md
16px  - lg
20px  - xl
24px  - 2xl
32px  - 3xl
```

---

## 🚀 Flujo de Reserva (4 Pasos)

1. **Selección de Servicio** - Usuario elige servicio (Corte, Barba, etc.)
2. **Selección de Barbero** - Usuario elige barbero preferido
3. **Fecha y Hora** - Calendario + horarios disponibles
4. **Datos de Contacto** - Nombre, teléfono, email

**Confirmación** - Resumen de la cita

---

## 📱 Responsive Design

- Mobile: 320px - 768px (stack vertical, padding 16px)
- Tablet: 768px - 1024px (2 columnas donde sea posible)
- Desktop: 1024px+ (3-4 columnas, padding 24px)

---

## ✨ Animaciones & Transiciones

- Duración estándar: 0.3s
- Easing: `ease-in-out`
- Hover states: Cambio de color, ligera escala (0.98-1.02)
- Page transitions: Fade-in suave

---

## 🔗 Logo & Branding

- **Logo**: BarberOS (con ícono de barbero)
- **Nombre**: "BarberOS"
- **Tagline**: Agendamiento inteligente para barberías

---

## 📋 Estados Comunes

- **Confirmada**: Fondo verde (`#4CAF50`), badge
- **Pendiente**: Fondo naranja (`#FF9800`), badge
- **Cancelada**: Fondo gris, tachado
- **Vacío**: Mensaje centrado, ícono suave

---

**Última actualización**: 2024
**Diseñador**: BarberOS Team
