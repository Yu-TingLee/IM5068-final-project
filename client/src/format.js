export function formatCents(cents) {
  return (cents / 100).toLocaleString('zh-TW', { maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-TW');
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('zh-TW', { hour12: false });
}

export function appUrl(path) {
  return `${window.location.origin}${window.location.pathname}#${path}`;
}
