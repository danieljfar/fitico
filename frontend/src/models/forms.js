export const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

export const emptyInstructorForm = {
  name: '',
  email: '',
  specialty: '',
  bio: '',
};

export const emptyClassForm = {
  name: '',
  instructorId: '',
  level: 'beginner',
  durationMinutes: 45,
  description: '',
};

export const emptyAdminModalState = {
  open: false,
  entity: null,
  mode: 'create',
  id: null,
};

export const emptyReservationModalState = {
  open: false,
  classItem: null,
  query: '',
  users: [],
  selectedUser: null,
  loading: false,
};
