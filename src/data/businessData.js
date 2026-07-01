// TODO: reemplazar con los datos reales del negocio cuando los tengas.
export const CONTACT_INFO = {
  name: 'BarberOS',
  location: 'Tu ciudad',
  phone: '+57 300 0000000',
  whatsapp: 'https://wa.me/573000000000',
  mapUrl: '#',
};

export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
