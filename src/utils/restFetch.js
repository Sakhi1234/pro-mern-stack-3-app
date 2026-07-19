import axios from 'axios';

function toQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function reviveDates(value) {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      out[k] = reviveDates(v);
    });
    return out;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d;
  }
  return value;
}

export async function apiFetch(path, options = {}, showError = null) {
  const apiBase = import.meta.env.VITE_UI_API_ENDPOINT || '/api';
  try {
    const response = await axios({
      url: `${apiBase}${path}`,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      withCredentials: true,
    });
    return reviveDates(response.data);
  } catch (err) {
    const payload = err?.response?.data;
    const message = payload?.details?.length
      ? `${payload.error}:\n ${payload.details.join('\n ')}`
      : payload?.error || payload?.message || err.message || 'Request failed';
    if (showError) showError(message);
    return null;
  }
}

export { toQuery };
