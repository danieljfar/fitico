import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Container, Form, Modal } from 'react-bootstrap';
import { FiArrowRight } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getTranslator } from './i18n/index.js';
import { AppTopBar } from './components/AppTopBar.jsx';
import {
  COUNTRY_OPTIONS,
  getCountryFromStorage,
} from './models/countries.js';
import {
  emptyAdminModalState,
  emptyAuthForm,
  emptyClassForm,
  emptyInstructorForm,
  emptyReservationModalState,
} from './models/forms.js';
import {
  apiAdminClasses,
  apiAdminAssignCredits,
  apiAdminCreateClass,
  apiAdminCreateInstructor,
  apiAdminClassReservations,
  apiAdminClassesSchedule,
  apiAdminDashboard,
  apiAdminInstructors,
  apiAdminDeleteClass,
  apiAdminDeleteInstructor,
  apiAdminDeleteReservation,
  apiAdminCreateReservation,
  apiAdminSearchUsers,
  apiAdminUpdateClass,
  apiAdminUpdateCredits,
  apiAdminUpdateInstructor,
  apiCancelReservation,
  apiCreateReservation,
  apiClasses,
  apiFeaturedInstructors,
  apiLogin,
  apiMe,
  apiMyReservations,
  apiRegister,
} from './api.js';
import { ClientView } from './pages/ClientView.jsx';
import { AdminView } from './pages/admin/AdminView.jsx';
import { AdminModals } from './pages/admin/AdminModals.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function formatDateTimeByLocale(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function App() {
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState('client');
  const [clientViewSection, setClientViewSection] = useState('home');
  const [country, setCountry] = useState(getCountryFromStorage);
  const [form, setForm] = useState(emptyAuthForm);
  const [token, setToken] = useState(() => localStorage.getItem('fitico-token') || '');
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [featuredInstructorsByOccupancy, setFeaturedInstructorsByOccupancy] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminInstructors, setAdminInstructors] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminClassSessions, setAdminClassSessions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminModalState, setAdminModalState] = useState(emptyAdminModalState);
  const [instructorForm, setInstructorForm] = useState(emptyInstructorForm);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [classReservationsByClass, setClassReservationsByClass] = useState({});
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [reservationModalState, setReservationModalState] = useState(emptyReservationModalState);
  const [creditsQuery, setCreditsQuery] = useState('');
  const [creditUsers, setCreditUsers] = useState([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [selectedCreditUser, setSelectedCreditUser] = useState(null);
  const [creditEditValue, setCreditEditValue] = useState('');
  const [reservationConfirmState, setReservationConfirmState] = useState({
    open: false,
    classSession: null,
    submitting: false,
  });
  const [reservationAlertState, setReservationAlertState] = useState({
    open: false,
    success: false,
    title: '',
    message: '',
  });
  const countrySelectorRef = useRef(null);

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((countryOption) => countryOption.code === country) || COUNTRY_OPTIONS[0],
    [country]
  );

  const language = selectedCountry.lang;
  const locale = selectedCountry.locale;
  const t = getTranslator(language);

  const formatDateTime = (value) => formatDateTimeByLocale(value, locale);

  useEffect(() => {
    localStorage.setItem('fitico-country', country);
  }, [country]);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!countrySelectorRef.current) {
        return;
      }

      if (!countrySelectorRef.current.contains(event.target)) {
        setIsCountrySelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBaseData(currentToken) {
      try {
        const [classesPayload, reservationsPayload, featuredInstructorsPayload] = await Promise.all([
          apiClasses(),
          currentToken ? apiMyReservations(currentToken) : Promise.resolve({ reservations: [] }),
          apiFeaturedInstructors(4),
        ]);

        if (!active) {
          return;
        }

        setClasses(classesPayload.classes || []);
        setFeaturedInstructorsByOccupancy(featuredInstructorsPayload.instructors || []);
        setReservations(reservationsPayload.reservations || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    async function hydrateUser(currentToken) {
      if (!currentToken) {
        setUser(null);
        return;
      }

      try {
        const response = await apiMe(currentToken);
        if (active) {
          setUser(response.user);
        }
      } catch {
        localStorage.removeItem('fitico-token');
        if (active) {
          setToken('');
          setUser(null);
        }
      }
    }

    hydrateUser(token);
    loadBaseData(token);

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('slot_updated', async () => {
      try {
        const classesPayload = await apiClasses();
        const featuredInstructorsPayload = await apiFeaturedInstructors(4);
        if (active) {
          setClasses(classesPayload.classes || []);
          setFeaturedInstructorsByOccupancy(featuredInstructorsPayload.instructors || []);
        }

        if (token) {
          const [userPayload, reservationsPayload] = await Promise.all([
            apiMe(token),
            apiMyReservations(token),
          ]);

          if (active) {
            setUser(userPayload.user || null);
            setReservations(reservationsPayload.reservations || []);
          }
        }
      } catch (error) {
        toast.error(error.message);
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    async function loadAdminData() {
      if (!token || user?.role !== 'admin') {
        setAdminMetrics(null);
        setAdminInstructors([]);
        setAdminClasses([]);
        setAdminClassSessions([]);
        return;
      }

      setAdminLoading(true);

      try {
        const [metricsPayload, instructorsPayload, classesPayload, classSessionsPayload] = await Promise.all([
          apiAdminDashboard(token),
          apiAdminInstructors(token),
          apiAdminClasses(token),
          apiAdminClassesSchedule(token),
        ]);

        setAdminMetrics(metricsPayload.metrics || null);
        setAdminInstructors(instructorsPayload.instructors || []);
        setAdminClasses(classesPayload.classes || []);
        setAdminClassSessions(classSessionsPayload.classes || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setAdminLoading(false);
      }
    }

    loadAdminData();
  }, [token, user?.role]);

  async function refreshPublicData(currentToken = token) {
      const [classesPayload, reservationsPayload, featuredInstructorsPayload] = await Promise.all([
      apiClasses(),
      currentToken ? apiMyReservations(currentToken) : Promise.resolve({ reservations: [] }),
        apiFeaturedInstructors(4),
    ]);

    setClasses(classesPayload.classes || []);
      setFeaturedInstructorsByOccupancy(featuredInstructorsPayload.instructors || []);
    setReservations(reservationsPayload.reservations || []);
  }

  async function refreshAuthenticatedUserData(currentToken = token) {
    if (!currentToken) {
      setUser(null);
      setReservations([]);
      return;
    }

    const [userPayload, reservationsPayload] = await Promise.all([
      apiMe(currentToken),
      apiMyReservations(currentToken),
    ]);

    setUser(userPayload.user || null);
    setReservations(reservationsPayload.reservations || []);
  }

  useEffect(() => {
    if (user?.role !== 'admin') {
      setAdminViewMode('client');
    }
  }, [user?.role]);

  useEffect(() => {
    if (!token) {
      setClientViewSection('home');
    }
  }, [token]);

  useEffect(() => {
    if (!token || user?.role !== 'admin' || adminViewMode !== 'admin') {
      setCreditsLoading(false);
      setCreditUsers([]);
      return;
    }

    const query = creditsQuery.trim();

    if (query.length < 2) {
      setCreditUsers([]);
      setCreditsLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setCreditsLoading(true);

      try {
        const payload = await apiAdminSearchUsers(token, query);
        setCreditUsers(payload.users || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setCreditsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [token, user?.role, adminViewMode, creditsQuery]);

  useEffect(() => {
    if (!selectedCreditUser) {
      setCreditEditValue('');
      return;
    }

    setCreditEditValue(String(selectedCreditUser.credits ?? 0));
  }, [selectedCreditUser]);

  async function refreshAdminData() {
    if (!token || user?.role !== 'admin') {
      return;
    }

    const [metricsPayload, instructorsPayload, classesPayload, classSessionsPayload] = await Promise.all([
      apiAdminDashboard(token),
      apiAdminInstructors(token),
      apiAdminClasses(token),
      apiAdminClassesSchedule(token),
    ]);

    setAdminMetrics(metricsPayload.metrics || null);
    setAdminInstructors(instructorsPayload.instructors || []);
    setAdminClasses(classesPayload.classes || []);
    setAdminClassSessions(classSessionsPayload.classes || []);
  }

  async function refreshCreditsData(selectedUserId = selectedCreditUser?.id) {
    if (!token || user?.role !== 'admin' || adminViewMode !== 'admin') {
      return;
    }

    const query = creditsQuery.trim();

    if (query.length < 2) {
      return;
    }

    setCreditsLoading(true);
    try {
      const payload = await apiAdminSearchUsers(token, query);
      const users = payload.users || [];
      setCreditUsers(users);

      if (selectedUserId) {
        const updatedSelected = users.find((userItem) => userItem.id === selectedUserId) || null;
        setSelectedCreditUser(updatedSelected);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreditsLoading(false);
    }
  }

  async function refreshAfterAdminMutation({ refreshPublic = true, refreshCredits = false, selectedUserId = null } = {}) {
    const refreshTasks = [refreshAdminData()];

    if (refreshPublic) {
      refreshTasks.push(refreshPublicData());
    }

    await Promise.all(refreshTasks);

    if (refreshCredits) {
      await refreshCreditsData(selectedUserId);
    }
  }

  async function loadClassReservations(classId) {
    const payload = await apiAdminClassReservations(token, classId);
    setClassReservationsByClass((current) => ({
      ...current,
      [classId]: payload.reservations || [],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload =
        authMode === 'register'
          ? await apiRegister(form)
          : await apiLogin({ email: form.email, password: form.password });

      localStorage.setItem('fitico-token', payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setForm(emptyAuthForm);
      setShowAuthModal(false);
      toast.success(authMode === 'register' ? t('authCreateAccount') : t('authWelcomeBack'));

      const reservationsPayload = await apiMyReservations(payload.token);
      setReservations(reservationsPayload.reservations || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openReservationAlert(success, title, message) {
    setReservationAlertState({
      open: true,
      success,
      title,
      message,
    });
  }

  function closeReservationAlert() {
    setReservationAlertState({
      open: false,
      success: false,
      title: '',
      message: '',
    });
  }

  async function handleReserve(classSessionOrId) {
    if (!token) {
      setAuthMode('login');
      setShowAuthModal(true);
      toast.error(t('signInFirst'));
      return;
    }

    const classSession =
      typeof classSessionOrId === 'object'
        ? classSessionOrId
        : classes.find((item) => item.id === classSessionOrId) || null;

    const currentCredits = Number(user?.credits ?? 0);

    if (currentCredits <= 0) {
      openReservationAlert(false, t('reservationFailedTitle'), t('reservationFailedNoCredits'));
      return;
    }

    setReservationConfirmState({
      open: true,
      classSession,
      submitting: false,
    });
  }

  async function confirmReservation() {
    if (!reservationConfirmState.classSession?.id || !token) {
      return;
    }

    setReservationConfirmState((current) => ({ ...current, submitting: true }));

    try {
      await apiCreateReservation(token, reservationConfirmState.classSession.id);
      await refreshAuthenticatedUserData(token);

      setReservationConfirmState({
        open: false,
        classSession: null,
        submitting: false,
      });

      openReservationAlert(true, t('reservationSuccessTitle'), t('reservationCreated'));
    } catch (error) {
      setReservationConfirmState({
        open: false,
        classSession: null,
        submitting: false,
      });

      openReservationAlert(false, t('reservationFailedTitle'), error.message || t('reservationFailedUnknown'));
    }
  }

  async function handleCancel(reservationId) {
    try {
      await apiCancelReservation(token, reservationId);
      toast.success(t('reservationCancelled'));
      await refreshAuthenticatedUserData(token);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function openInstructorModal(mode = 'create', instructor = null) {
    setAdminModalState({ open: true, entity: 'instructor', mode, id: instructor?.id || null });
    setInstructorForm(
      instructor
        ? {
            name: instructor.name || '',
            email: instructor.email || '',
            specialty: instructor.specialty || '',
            bio: instructor.bio || '',
          }
        : emptyInstructorForm
    );
  }

  function openClassModal(mode = 'create', classItem = null) {
    setAdminModalState({ open: true, entity: 'class', mode, id: classItem?.id || null });
    setClassForm(
      classItem
        ? {
            name: classItem.name || '',
            instructorId: classItem.instructorId ? String(classItem.instructorId) : String(classItem.instructor?.id || ''),
            level: classItem.level || 'beginner',
            durationMinutes: classItem.durationMinutes || 45,
            description: classItem.description || '',
          }
        : emptyClassForm
    );
  }

  function closeAdminModal() {
    setAdminModalState(emptyAdminModalState);
    setInstructorForm(emptyInstructorForm);
    setClassForm(emptyClassForm);
  }

  async function handleSaveInstructor(event) {
    event.preventDefault();

    try {
      if (adminModalState.mode === 'edit' && adminModalState.id) {
        await apiAdminUpdateInstructor(token, adminModalState.id, instructorForm);
      } else {
        await apiAdminCreateInstructor(token, instructorForm);
      }

      closeAdminModal();
      await refreshAfterAdminMutation({ refreshPublic: true });
      toast.success(adminModalState.mode === 'edit' ? t('saveChanges') : t('instructorCreated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSaveClass(event) {
    event.preventDefault();

    try {
      const payload = {
        ...classForm,
        instructorId: Number(classForm.instructorId),
        durationMinutes: Number(classForm.durationMinutes),
      };

      if (adminModalState.mode === 'edit' && adminModalState.id) {
        await apiAdminUpdateClass(token, adminModalState.id, payload);
      } else {
        await apiAdminCreateClass(token, payload);
      }

      closeAdminModal();
      await refreshAfterAdminMutation({ refreshPublic: true });
      toast.success(adminModalState.mode === 'edit' ? t('saveChanges') : t('classCreated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDeleteInstructor(instructor) {
    try {
      await apiAdminDeleteInstructor(token, instructor.id);
      await refreshAfterAdminMutation({ refreshPublic: true });
      toast.success(t('instructorDeleted'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDeleteClass(classItem) {
    try {
      await apiAdminDeleteClass(token, classItem.id);
      await refreshAfterAdminMutation({ refreshPublic: true });
      setExpandedClassId((current) => (current === classItem.id ? null : current));
      toast.success(t('classDeleted'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleToggleReservations(classItem) {
    const nextExpandedId = expandedClassId === classItem.id ? null : classItem.id;
    setExpandedClassId(nextExpandedId);

    if (nextExpandedId && !classReservationsByClass[nextExpandedId]) {
      try {
        await loadClassReservations(nextExpandedId);
      } catch (error) {
        toast.error(error.message);
      }
    }
  }

  function openReservationModal(classItem) {
    setReservationModalState({ ...emptyReservationModalState, open: true, classItem });
  }

  function closeReservationModal() {
    setReservationModalState(emptyReservationModalState);
  }

  async function handleDeleteReservation(reservation) {
    try {
      const classId = reservation.classId || reservation.class?.id || expandedClassId;
      await apiAdminDeleteReservation(token, reservation.id);
      await refreshAfterAdminMutation({ refreshPublic: true });

      if (classId) {
        await loadClassReservations(classId);
      }

      toast.success(t('reservationDeleted'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateReservationForUser() {
    const classItem = reservationModalState.classItem;

    if (!classItem || !reservationModalState.selectedUser) {
      return;
    }

    try {
      await apiAdminCreateReservation(token, classItem.id, reservationModalState.selectedUser.id);
      await refreshAfterAdminMutation({ refreshPublic: true });
      await loadClassReservations(classItem.id);
      closeReservationModal();
      toast.success(t('reservationCreatedForUser'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleAssignCredits(units) {
    if (!selectedCreditUser?.id) {
      return;
    }

    try {
      const payload = await apiAdminAssignCredits(token, selectedCreditUser.id, units);
      const updatedUser = payload.user;

      if (updatedUser) {
        setSelectedCreditUser(updatedUser);
        setCreditUsers((current) => current.map((userItem) => (userItem.id === updatedUser.id ? updatedUser : userItem)));
      }

      await refreshAfterAdminMutation({ refreshPublic: false, refreshCredits: true, selectedUserId: updatedUser?.id });

      toast.success(t('creditsAssigned'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSubtractCredits(units) {
    if (!selectedCreditUser?.id) {
      return;
    }

    try {
      const payload = await apiAdminUpdateCredits(token, selectedCreditUser.id, {
        operation: 'subtract',
        amount: units,
      });

      const updatedUser = payload.user;

      if (updatedUser) {
        setSelectedCreditUser(updatedUser);
        setCreditUsers((current) => current.map((userItem) => (userItem.id === updatedUser.id ? updatedUser : userItem)));
      }

      await refreshAfterAdminMutation({ refreshPublic: false, refreshCredits: true, selectedUserId: updatedUser?.id });

      toast.success(t('creditsUpdated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSetCredits() {
    if (!selectedCreditUser?.id) {
      return;
    }

    const parsed = Number(creditEditValue);

    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error(t('creditsValueInvalid'));
      return;
    }

    try {
      const payload = await apiAdminUpdateCredits(token, selectedCreditUser.id, {
        operation: 'set',
        value: parsed,
      });

      const updatedUser = payload.user;

      if (updatedUser) {
        setSelectedCreditUser(updatedUser);
        setCreditUsers((current) => current.map((userItem) => (userItem.id === updatedUser.id ? updatedUser : userItem)));
      }

      await refreshAfterAdminMutation({ refreshPublic: false, refreshCredits: true, selectedUserId: updatedUser?.id });

      toast.success(t('creditsUpdated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDeleteCredits() {
    if (!selectedCreditUser?.id) {
      return;
    }

    try {
      const payload = await apiAdminUpdateCredits(token, selectedCreditUser.id, {
        operation: 'set',
        value: 0,
      });

      const updatedUser = payload.user;

      if (updatedUser) {
        setSelectedCreditUser(updatedUser);
        setCreditUsers((current) => current.map((userItem) => (userItem.id === updatedUser.id ? updatedUser : userItem)));
      }

      await refreshAfterAdminMutation({ refreshPublic: false, refreshCredits: true, selectedUserId: updatedUser?.id });

      toast.success(t('creditsDeleted'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    if (!reservationModalState.open) {
      return undefined;
    }

    const query = reservationModalState.query.trim();

    if (query.length < 2) {
      setReservationModalState((current) => ({ ...current, users: [], loading: false }));
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setReservationModalState((current) => ({ ...current, loading: true }));

      try {
        const payload = await apiAdminSearchUsers(token, query);
        setReservationModalState((current) => ({ ...current, users: payload.users || [], loading: false }));
      } catch (error) {
        setReservationModalState((current) => ({ ...current, loading: false }));
        toast.error(error.message);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [reservationModalState.open, reservationModalState.query, token]);

  function handleCountrySelect(nextCountryCode) {
    setCountry(nextCountryCode);
    setIsCountrySelectorOpen(false);
  }

  function logout() {
    localStorage.removeItem('fitico-token');
    setToken('');
    setUser(null);
    setAdminViewMode('client');
    setClientViewSection('home');
    setAdminModalState(emptyAdminModalState);
    setReservationModalState(emptyReservationModalState);
    setReservations([]);
    setAdminMetrics(null);
    setAdminInstructors([]);
    setAdminClasses([]);
    setAdminClassSessions([]);
    setClassReservationsByClass({});
    setExpandedClassId(null);
    setCreditsQuery('');
    setCreditUsers([]);
    setCreditsLoading(false);
    setSelectedCreditUser(null);
    setCreditEditValue('');
    setReservationConfirmState({ open: false, classSession: null, submitting: false });
    closeReservationAlert();
    toast.success(t('authSignedOut'));
  }

  const totalSeats = classes.reduce((sum, classSession) => sum + classSession.availableSeats, 0);
  const totalReservations = reservations.length;
  const liveClasses = classes.filter((classSession) => classSession.availableSeats > 0).length;
  const instructors = useMemo(() => {
    const byInstructor = new Map();

    classes.forEach((classSession) => {
      const instructorEntity = classSession.class?.instructor || classSession.instructor;
      const classEntity = classSession.class || null;

      const fallbackName = instructorEntity?.name || t('coachLabel');
      const fallbackSpecialty = instructorEntity?.specialty || classEntity?.name || t('noSpecialty');
      const id = instructorEntity?.id || `${fallbackName}-${fallbackSpecialty}`;

      if (!byInstructor.has(id)) {
        byInstructor.set(id, {
          id,
          name: fallbackName,
          specialty: fallbackSpecialty,
          bio: instructorEntity?.bio || '',
          email: instructorEntity?.email || '',
          status: instructorEntity?.status || 'active',
          classes: [],
          sessions: [],
          totalCapacity: 0,
          totalBooked: 0,
          occupancyRate: 0,
        });
      }

      const current = byInstructor.get(id);
      current.sessions.push(classSession);
      current.totalCapacity += Number(classSession.capacity) || 0;
      current.totalBooked += Number(classSession.bookedCount) || 0;

      if (classEntity && classEntity.id && !current.classes.some((item) => item.id === classEntity.id)) {
        current.classes.push(classEntity);
      }
    });

    return Array.from(byInstructor.values())
      .map((instructor) => ({
        ...instructor,
        occupancyRate:
          instructor.totalCapacity > 0
            ? Math.round((instructor.totalBooked / instructor.totalCapacity) * 100)
            : 0,
      }))
      .sort((a, b) => {
        if (b.occupancyRate !== a.occupancyRate) {
          return b.occupancyRate - a.occupancyRate;
        }

        return b.totalBooked - a.totalBooked;
      });
  }, [classes, t]);

  const highlightedInstructors =
    featuredInstructorsByOccupancy.length > 0
      ? featuredInstructorsByOccupancy.slice(0, 4)
      : instructors.slice(0, 4);

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <Container className="py-4 py-lg-5 position-relative" ref={countrySelectorRef}>
        <AppTopBar
          t={t}
          user={user}
          selectedCountry={selectedCountry}
          countryOptions={COUNTRY_OPTIONS}
          isCountrySelectorOpen={isCountrySelectorOpen}
          onToggleCountrySelector={() => setIsCountrySelectorOpen((value) => !value)}
          onSelectCountry={handleCountrySelect}
          isAdmin={user?.role === 'admin'}
          adminViewMode={adminViewMode}
          onToggleAdminViewMode={() => setAdminViewMode((current) => (current === 'admin' ? 'client' : 'admin'))}
          clientViewSection={clientViewSection}
          onSelectClientViewSection={setClientViewSection}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onLogout={logout}
        />

        {user?.role === 'admin' && adminViewMode === 'admin' ? (
          <AdminView
            t={t}
            adminLoading={adminLoading}
            adminMetrics={adminMetrics}
            adminInstructors={adminInstructors}
            adminClasses={adminClasses}
            adminClassSessions={adminClassSessions}
            reservationsByClass={classReservationsByClass}
            expandedClassId={expandedClassId}
            onCreateInstructor={() => openInstructorModal('create')}
            onEditInstructor={(instructor) => openInstructorModal('edit', instructor)}
            onDeleteInstructor={handleDeleteInstructor}
            onCreateClass={() => openClassModal('create')}
            onEditClass={(classItem) => openClassModal('edit', classItem)}
            onDeleteClass={handleDeleteClass}
            onToggleReservations={handleToggleReservations}
            onCreateReservation={openReservationModal}
            onDeleteReservation={handleDeleteReservation}
            creditsQuery={creditsQuery}
            creditUsers={creditUsers}
            creditsLoading={creditsLoading}
            selectedCreditUser={selectedCreditUser}
            creditEditValue={creditEditValue}
            onCreditsQueryChange={setCreditsQuery}
            onSelectCreditUser={setSelectedCreditUser}
            onAssignCredits={handleAssignCredits}
            onSubtractCredits={handleSubtractCredits}
            onSetCredits={handleSetCredits}
            onDeleteCredits={handleDeleteCredits}
            onCreditEditValueChange={setCreditEditValue}
          />
        ) : (
          <ClientView
            t={t}
            user={user}
            classes={classes}
            reservations={reservations}
            totalSeats={totalSeats}
            liveClasses={liveClasses}
            totalReservations={totalReservations}
            booting={booting}
            highlightedInstructors={highlightedInstructors}
            instructors={instructors}
            formatDateTime={formatDateTime}
            token={token}
            clientViewSection={clientViewSection}
            onReserve={handleReserve}
            onCancel={handleCancel}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}
      </Container>

      <AdminModals
        t={t}
        adminModalState={adminModalState}
        closeAdminModal={closeAdminModal}
        instructorForm={instructorForm}
        setInstructorForm={setInstructorForm}
        classForm={classForm}
        setClassForm={setClassForm}
        adminInstructors={adminInstructors}
        handleSaveInstructor={handleSaveInstructor}
        handleSaveClass={handleSaveClass}
        reservationModalState={reservationModalState}
        closeReservationModal={closeReservationModal}
        setReservationModalState={setReservationModalState}
        handleCreateReservationForUser={handleCreateReservationForUser}
      />

      <Modal
        show={reservationConfirmState.open}
        onHide={() => setReservationConfirmState({ open: false, classSession: null, submitting: false })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('reservationConfirmTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="class-meta mb-3">{t('reservationConfirmBody')}</p>

          {reservationConfirmState.classSession ? (
            <div className="reservation-row">
              <div className="class-title mb-1">
                {reservationConfirmState.classSession.title || reservationConfirmState.classSession.class?.name || t('className')}
              </div>
              <div className="class-meta mb-1">
                {reservationConfirmState.classSession.startsAt
                  ? formatDateTime(reservationConfirmState.classSession.startsAt)
                  : t('scheduled')}
              </div>
              <div className="class-meta">
                {t('creditsBalance')}: {Number(user?.credits ?? 0)}
              </div>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-dark"
            className="rounded-pill"
            onClick={() => setReservationConfirmState({ open: false, classSession: null, submitting: false })}
            disabled={reservationConfirmState.submitting}
          >
            {t('closeAction')}
          </Button>
          <Button
            variant="dark"
            className="rounded-pill"
            onClick={confirmReservation}
            disabled={reservationConfirmState.submitting}
          >
            {reservationConfirmState.submitting ? t('authProcessing') : t('confirmReservationAction')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={reservationAlertState.open} onHide={closeReservationAlert} centered>
        <Modal.Header closeButton>
          <Modal.Title>{reservationAlertState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="class-meta mb-0">{reservationAlertState.message}</p>
        </Modal.Body>
        <Modal.Footer>
          {reservationAlertState.success ? (
            <Button
              variant="dark"
              className="rounded-pill"
              onClick={() => {
                setClientViewSection('profile');
                closeReservationAlert();
              }}
            >
              {t('goToProfile')}
            </Button>
          ) : null}
          <Button variant="outline-dark" className="rounded-pill" onClick={closeReservationAlert}>
            {t('closeAction')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('authModalTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="class-meta mb-3">{t('authModalSubtitle')}</p>

          <div className="d-flex gap-2 mb-3">
            <Button
              variant={authMode === 'login' ? 'dark' : 'outline-dark'}
              className="flex-fill rounded-pill"
              onClick={() => setAuthMode('login')}
            >
              {t('login')}
            </Button>
            <Button
              variant={authMode === 'register' ? 'dark' : 'outline-dark'}
              className="flex-fill rounded-pill"
              onClick={() => setAuthMode('register')}
            >
              {t('register')}
            </Button>
          </div>

          <Form onSubmit={handleSubmit}>
            {authMode === 'register' ? (
              <Form.Group className="mb-3">
                <Form.Label>{t('authName')}</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t('authYourName')}
                />
              </Form.Group>
            ) : null}

            <Form.Group className="mb-3">
              <Form.Label>{t('authEmail')}</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>{t('authPassword')}</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={t('authPassword')}
              />
            </Form.Group>

            <Button type="submit" className="w-100 rounded-pill action-button" disabled={loading}>
              {loading ? t('authProcessing') : authMode === 'register' ? t('register') : t('login')}
              <FiArrowRight className="ms-2" />
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
