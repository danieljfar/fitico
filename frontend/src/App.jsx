import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Container, Form, Modal, Row } from 'react-bootstrap';
import { FiArrowRight } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getTranslator } from './i18n/index.js';
import {
  apiAdminClasses,
  apiAdminCreateClass,
  apiAdminCreateInstructor,
  apiAdminCreateSlot,
  apiAdminDashboard,
  apiAdminInstructors,
  apiAdminSlots,
  apiCancelReservation,
  apiCreateReservation,
  apiLogin,
  apiMe,
  apiMyReservations,
  apiRegister,
  apiSlots,
} from './api.js';
import { Home } from './pages/Home.jsx';
import { Profile } from './pages/Profile.jsx';
import { Slots } from './pages/Slots.jsx';
import { Dashboard } from './pages/admin/Dashboard.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function countryCodeToFlag(code) {
  return String.fromCodePoint(...code.split('').map((x) => 127397 + x.charCodeAt()));
}

const COUNTRY_OPTIONS = [
  { code: 'CO', locale: 'es-CO', lang: 'es', labelKey: 'countryColombia', flag: countryCodeToFlag('CO') },
  { code: 'MX', locale: 'es-MX', lang: 'es', labelKey: 'countryMexico', flag: countryCodeToFlag('MX') },
  { code: 'US', locale: 'en-US', lang: 'en', labelKey: 'countryUnitedStates', flag: countryCodeToFlag('US') },
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
};

const emptyInstructorForm = {
  name: '',
  email: '',
  specialty: '',
  bio: '',
};

const emptyClassForm = {
  name: '',
  instructorId: '',
  level: 'beginner',
  durationMinutes: 45,
  description: '',
};

const emptySlotForm = {
  classId: '',
  bikeLabel: '',
  startsAt: '',
  capacity: 1,
  title: '',
};

function getCountryFromStorage() {
  const saved = localStorage.getItem('fitness-country') || 'CO';
  return COUNTRY_OPTIONS.find((country) => country.code === saved)?.code || COUNTRY_OPTIONS[0].code;
}

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
  const [country, setCountry] = useState(getCountryFromStorage);
  const [form, setForm] = useState(emptyForm);
  const [token, setToken] = useState(() => localStorage.getItem('fitness-token') || '');
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminInstructors, setAdminInstructors] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminSlots, setAdminSlots] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [instructorForm, setInstructorForm] = useState(emptyInstructorForm);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [slotForm, setSlotForm] = useState(emptySlotForm);
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
    localStorage.setItem('fitness-country', country);
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
        const [slotsPayload, reservationsPayload] = await Promise.all([
          apiSlots(),
          currentToken ? apiMyReservations(currentToken) : Promise.resolve({ reservations: [] }),
        ]);

        if (!active) {
          return;
        }

        setSlots(slotsPayload.slots || []);
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
        localStorage.removeItem('fitness-token');
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
        const slotsPayload = await apiSlots();
        if (active) {
          setSlots(slotsPayload.slots || []);
        }

        if (token) {
          const reservationsPayload = await apiMyReservations(token);
          if (active) {
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
        setAdminSlots([]);
        return;
      }

      setAdminLoading(true);

      try {
        const [metricsPayload, instructorsPayload, classesPayload, slotsPayload] = await Promise.all([
          apiAdminDashboard(token),
          apiAdminInstructors(token),
          apiAdminClasses(token),
          apiAdminSlots(token),
        ]);

        setAdminMetrics(metricsPayload.metrics || null);
        setAdminInstructors(instructorsPayload.instructors || []);
        setAdminClasses(classesPayload.classes || []);
        setAdminSlots(slotsPayload.slots || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setAdminLoading(false);
      }
    }

    loadAdminData();
  }, [token, user?.role]);

  async function refreshAdminData() {
    if (!token || user?.role !== 'admin') {
      return;
    }

    const [metricsPayload, instructorsPayload, classesPayload, slotsPayload] = await Promise.all([
      apiAdminDashboard(token),
      apiAdminInstructors(token),
      apiAdminClasses(token),
      apiAdminSlots(token),
    ]);

    setAdminMetrics(metricsPayload.metrics || null);
    setAdminInstructors(instructorsPayload.instructors || []);
    setAdminClasses(classesPayload.classes || []);
    setAdminSlots(slotsPayload.slots || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload =
        authMode === 'register'
          ? await apiRegister(form)
          : await apiLogin({ email: form.email, password: form.password });

      localStorage.setItem('fitness-token', payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setForm(emptyForm);
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

  async function handleReserve(slotId) {
    if (!token) {
      setAuthMode('login');
      setShowAuthModal(true);
      toast.error(t('signInFirst'));
      return;
    }

    try {
      await apiCreateReservation(token, slotId);
      toast.success(t('reservationCreated'));
      const reservationsPayload = await apiMyReservations(token);
      setReservations(reservationsPayload.reservations || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCancel(reservationId) {
    try {
      await apiCancelReservation(token, reservationId);
      toast.success(t('reservationCancelled'));
      const reservationsPayload = await apiMyReservations(token);
      setReservations(reservationsPayload.reservations || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateInstructor(event) {
    event.preventDefault();

    try {
      await apiAdminCreateInstructor(token, instructorForm);
      setInstructorForm(emptyInstructorForm);
      await refreshAdminData();
      toast.success(t('instructorCreated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateClass(event) {
    event.preventDefault();

    try {
      await apiAdminCreateClass(token, {
        ...classForm,
        instructorId: Number(classForm.instructorId),
        durationMinutes: Number(classForm.durationMinutes),
      });
      setClassForm(emptyClassForm);
      await refreshAdminData();
      toast.success(t('classCreated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateSlot(event) {
    event.preventDefault();

    try {
      await apiAdminCreateSlot(token, {
        ...slotForm,
        classId: Number(slotForm.classId),
        capacity: Number(slotForm.capacity),
      });
      setSlotForm(emptySlotForm);
      const [slotsPayload, reservationsPayload] = await Promise.all([
        apiSlots(),
        token ? apiMyReservations(token) : Promise.resolve({ reservations: [] }),
      ]);
      setSlots(slotsPayload.slots || []);
      setReservations(reservationsPayload.reservations || []);
      await refreshAdminData();
      toast.success(t('slotCreated'));
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleCountrySelect(nextCountryCode) {
    setCountry(nextCountryCode);
    setIsCountrySelectorOpen(false);
  }

  function logout() {
    localStorage.removeItem('fitness-token');
    setToken('');
    setUser(null);
    setReservations([]);
    setAdminMetrics(null);
    setAdminInstructors([]);
    setAdminClasses([]);
    setAdminSlots([]);
    toast.success(t('authSignedOut'));
  }

  const totalSeats = slots.reduce((sum, slot) => sum + slot.availableSeats, 0);
  const totalReservations = reservations.length;
  const liveSlots = slots.filter((slot) => slot.availableSeats > 0).length;

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <Container className="py-4 py-lg-5 position-relative" ref={countrySelectorRef}>
        <Home
          t={t}
          user={user}
          slotsCount={slots.length}
          totalSeats={totalSeats}
          liveSlots={liveSlots}
          totalReservations={totalReservations}
          booting={booting}
          selectedCountry={selectedCountry}
          countryOptions={COUNTRY_OPTIONS}
          isCountrySelectorOpen={isCountrySelectorOpen}
          onToggleCountrySelector={() => setIsCountrySelectorOpen((value) => !value)}
          onSelectCountry={handleCountrySelect}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onLogout={logout}
        />

        <Row className="g-4">
          <Slots
            t={t}
            slots={slots}
            reservations={reservations}
            formatDateTime={formatDateTime}
            onReserve={handleReserve}
          />
          <Profile
            t={t}
            token={token}
            reservations={reservations}
            formatDateTime={formatDateTime}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onCancel={handleCancel}
          />
        </Row>

        {user?.role === 'admin' ? (
          <Dashboard
            t={t}
            adminLoading={adminLoading}
            adminMetrics={adminMetrics}
            instructorForm={instructorForm}
            setInstructorForm={setInstructorForm}
            classForm={classForm}
            setClassForm={setClassForm}
            slotForm={slotForm}
            setSlotForm={setSlotForm}
            adminInstructors={adminInstructors}
            adminClasses={adminClasses}
            adminSlots={adminSlots}
            formatDateTime={formatDateTime}
            onCreateInstructor={handleCreateInstructor}
            onCreateClass={handleCreateClass}
            onCreateSlot={handleCreateSlot}
          />
        ) : null}
      </Container>

      <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('authModalTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="slot-meta mb-3">{t('authModalSubtitle')}</p>

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
