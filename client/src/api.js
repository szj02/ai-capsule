// All calls include credentials so the HttpOnly "token" cookie is sent
// automatically by the browser - the frontend never touches the JWT itself.
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (res.status === 401) {
    throw new Error('unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const getMe = () => apiFetch('/auth/me');
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });

export const getCapsules = () => apiFetch('/api/capsules');
export const createCapsule = (data) =>
  apiFetch('/api/capsules', { method: 'POST', body: JSON.stringify(data) });
export const updateCapsule = (id, data) =>
  apiFetch(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCapsule = (id) =>
  apiFetch(`/api/capsules/${id}`, { method: 'DELETE' });
