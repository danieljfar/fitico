const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
}

export function apiRegister(data) {
  return request('/auth/register', { method: 'POST', body: data });
}

export function apiLogin(data) {
  return request('/auth/login', { method: 'POST', body: data });
}

export function apiMe(token) {
  return request('/auth/me', { token });
}

export function apiSlots() {
  return request('/slots');
}

export function apiMyReservations(token) {
  return request('/reservations/me', { token });
}

export function apiCreateReservation(token, slotId) {
  return request('/reservations', {
    method: 'POST',
    token,
    body: { slotId },
  });
}

export function apiCancelReservation(token, id) {
  return request(`/reservations/${id}`, {
    method: 'DELETE',
    token,
  });
}