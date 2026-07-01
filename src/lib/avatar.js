// Genera una URL de foto aleatoria pero determinística a partir de una
// semilla (nombre, id, etc.) usando DiceBear (servicio público, sin API key).
// Cambiar la semilla cambia la foto; misma semilla = misma foto siempre.
export function randomAvatarUrl(seed) {
  const s = encodeURIComponent(seed || Math.random().toString(36).slice(2));
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${s}`;
}
