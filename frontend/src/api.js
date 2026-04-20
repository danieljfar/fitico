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

function withQuery(path, query = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
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

export function apiClasses() {
  return request('/classes').then((payload) => ({ ...payload, classes: payload.classes || [] }));
}

export function apiFeaturedInstructors(limit = 4) {
  return request(withQuery('/classes/featured-instructors', { limit })).then((payload) => ({
    ...payload,
    instructors: payload.instructors || [],
  }));
}

export function apiMyReservations(token) {
  return request('/reservations/me', { token });
}

export function apiCreateReservation(token, classId) {
  return request('/reservations', {
    method: 'POST',
    token,
    body: { classId },
  });
}

export function apiCancelReservation(token, id) {
  return request(`/reservations/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function apiAdminDashboard(token) {
  return request('/admin/dashboard', { token });
}

export function apiAdminInstructors(token) {
  return request('/admin/instructors', { token });
}

export function apiAdminCreateInstructor(token, data) {
  return request('/admin/instructors', {
    method: 'POST',
    token,
    body: data,
  });
}

export function apiAdminUpdateInstructor(token, id, data) {
  return request(`/admin/instructors/${id}`, {
    method: 'PATCH',
    token,
    body: data,
  });
}

export function apiAdminDeleteInstructor(token, id) {
  return request(`/admin/instructors/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function apiAdminClasses(token) {
  return request('/admin/classes', { token });
}

export function apiAdminCreateClass(token, data) {
  return request('/admin/classes', {
    method: 'POST',
    token,
    body: data,
  });
}

export function apiAdminUpdateClass(token, id, data) {
  return request(`/admin/classes/${id}`, {
    method: 'PATCH',
    token,
    body: data,
  });
}

export function apiAdminDeleteClass(token, id) {
  return request(`/admin/classes/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function apiAdminClassesSchedule(token) {
  return request('/admin/classes', { token }).then((payload) => ({ ...payload, classes: payload.classes || [] }));
}

export function apiAdminCreateClassSession(token, data) {
  return request('/admin/classes', {
    method: 'POST',
    token,
    body: data,
  }).then((payload) => ({ ...payload, classSession: payload.class || null }));
}

export function apiAdminSearchUsers(token, query) {
  return request(withQuery('/admin/users', { q: query }), { token }).then((payload) => ({ ...payload, users: payload.users || [] }));
}

export function apiAdminClassReservations(token, classId) {
  return request(`/admin/classes/${classId}/reservations`, { token }).then((payload) => ({ ...payload, reservations: payload.reservations || [] }));
}

export function apiAdminDeleteReservation(token, id) {
  return request(`/admin/reservations/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function apiAdminCreateReservation(token, classId, userId) {
  return request(`/admin/classes/${classId}/reservations`, {
    method: 'POST',
    token,
    body: { userId },
  });
}

export function apiAdminAssignCredits(token, userId, units) {
  return request('/admin/credits/assign', {
    method: 'POST',
    token,
    body: { userId, units },
  });
}

export function apiAdminUpdateCredits(token, userId, data) {
  return request(`/admin/credits/${userId}`, {
    method: 'PATCH',
    token,
    body: data,
  });
}