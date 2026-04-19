import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, ListGroup, Row, Stack } from 'react-bootstrap';
import { FiActivity, FiArrowRight, FiClock, FiLock, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  apiCancelReservation,
  apiCreateReservation,
  apiLogin,
  apiMe,
  apiMyReservations,
  apiRegister,
  apiSlots,
} from './api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const emptyForm = {
  name: '',
  email: '',
  password: '',
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StatCard({ icon, label, value }) {
  return (
    <Card className="stat-card h-100">
      <Card.Body>
        <Stack direction="horizontal" gap={3}>
          <div className="stat-icon">{icon}</div>
          <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        </Stack>
      </Card.Body>
    </Card>
  );
}

export function App() {
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [token, setToken] = useState(() => localStorage.getItem('fitness-token') || '');
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

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
      toast.success(authMode === 'register' ? 'Account created' : 'Welcome back');

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
      toast.error('Sign in first');
      return;
    }

    try {
      await apiCreateReservation(token, slotId);
      toast.success('Reservation created');
      const reservationsPayload = await apiMyReservations(token);
      setReservations(reservationsPayload.reservations || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCancel(reservationId) {
    try {
      await apiCancelReservation(token, reservationId);
      toast.success('Reservation cancelled');
      const reservationsPayload = await apiMyReservations(token);
      setReservations(reservationsPayload.reservations || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function logout() {
    localStorage.removeItem('fitness-token');
    setToken('');
    setUser(null);
    setReservations([]);
    toast.success('Signed out');
  }

  const totalSeats = slots.reduce((sum, slot) => sum + slot.availableSeats, 0);
  const totalReservations = reservations.length;
  const liveSlots = slots.filter((slot) => slot.availableSeats > 0).length;

  return (
    <div className="page-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />

      <Container className="py-4 py-lg-5 position-relative">
        <Row className="align-items-center g-4 mb-4 mb-lg-5">
          <Col lg={8}>
            <div className="eyebrow mb-2">
              <FiActivity className="me-2" />
              Node.js v24, MySQL, Sequelize, Socket.IO
            </div>
            <h1 className="hero-title mb-3">Fitness Flow</h1>
            <p className="hero-copy mb-4">
              High-concurrency reservation demo with JWT auth, transactional booking, and live slot updates.
            </p>
            <Stack direction="horizontal" gap={3} className="flex-wrap">
              <Badge bg="light" text="dark" className="pill">
                <FiUsers className="me-2" />
                {slots.length} slots
              </Badge>
              <Badge bg="light" text="dark" className="pill">
                <FiClock className="me-2" />
                {totalSeats} open seats
              </Badge>
              <Badge bg="light" text="dark" className="pill">
                <FiLock className="me-2" />
                Transactions + row locks
              </Badge>
            </Stack>
          </Col>
          <Col lg={4}>
            <Card className="auth-card shadow-lg border-0">
              <Card.Body className="p-4">
                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant={authMode === 'login' ? 'dark' : 'outline-dark'}
                    className="flex-fill rounded-pill"
                    onClick={() => setAuthMode('login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant={authMode === 'register' ? 'dark' : 'outline-dark'}
                    className="flex-fill rounded-pill"
                    onClick={() => setAuthMode('register')}
                  >
                    Register
                  </Button>
                </div>

                <Form onSubmit={handleSubmit}>
                  {authMode === 'register' ? (
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Your name"
                      />
                    </Form.Group>
                  ) : null}

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="name@example.com"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Your password"
                    />
                  </Form.Group>

                  <Button type="submit" className="w-100 rounded-pill action-button" disabled={loading}>
                    {loading ? 'Processing...' : authMode === 'register' ? 'Create account' : 'Sign in'}
                    <FiArrowRight className="ms-2" />
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 g-lg-4 mb-4">
          <Col md={4}>
            <StatCard icon={<FiUsers />} label="Available seats" value={booting ? '...' : totalSeats} />
          </Col>
          <Col md={4}>
            <StatCard icon={<FiRefreshCw />} label="Live slots" value={booting ? '...' : liveSlots} />
          </Col>
          <Col md={4}>
            <StatCard icon={<FiClock />} label="Your reservations" value={token ? totalReservations : 'Sign in'} />
          </Col>
        </Row>

        <Row className="g-4">
          <Col xl={7}>
            <Card className="panel-card h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="section-heading mb-3">Session slots</div>
                <div className="slot-grid">
                  {slots.map((slot) => {
                    const isMine = reservations.some((reservation) => reservation.slotId === slot.id && reservation.status === 'active');

                    return (
                      <div key={slot.id} className={`slot-item ${slot.isFull ? 'full' : ''}`}>
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                          <div>
                            <div className="slot-title">{slot.title}</div>
                            <div className="slot-meta">{slot.startsAtLabel}</div>
                          </div>
                          <Badge bg={slot.isFull ? 'danger' : 'success'}>{slot.isFull ? 'Full' : 'Open'}</Badge>
                        </div>

                        <div className="slot-stats mb-3">
                          <span>{slot.availableSeats} seats left</span>
                          <span>{slot.bookedCount}/{slot.capacity}</span>
                        </div>

                        <Button
                          variant={isMine ? 'outline-secondary' : 'dark'}
                          className="w-100 rounded-pill"
                          disabled={slot.isFull || isMine || !token}
                          onClick={() => handleReserve(slot.id)}
                        >
                          {isMine ? 'Reserved' : slot.isFull ? 'Sold out' : 'Reserve now'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={5}>
            <Card className="panel-card h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="section-heading">Your reservations</div>
                  {user ? (
                    <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={logout}>
                      Logout
                    </Button>
                  ) : null}
                </div>

                {user ? <div className="welcome-line mb-3">Signed in as {user.name}</div> : null}

                <ListGroup variant="flush" className="reservation-list">
                  {reservations.length === 0 ? (
                    <div className="empty-state">
                      {token ? 'No reservations yet. Pick a slot on the left.' : 'Sign in to book and manage sessions.'}
                    </div>
                  ) : null}

                  {reservations.map((reservation) => (
                    <ListGroup.Item key={reservation.id} className="reservation-row">
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <div className="slot-title mb-1">{reservation.slot?.title}</div>
                          <div className="slot-meta">{reservation.slot?.startsAt ? formatDateTime(reservation.slot.startsAt) : 'Scheduled'}</div>
                        </div>
                        <Badge bg={reservation.status === 'active' ? 'primary' : 'secondary'}>{reservation.status}</Badge>
                      </div>

                      {reservation.status === 'active' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="mt-3 rounded-pill"
                          onClick={() => handleCancel(reservation.id)}
                        >
                          Cancel reservation
                        </Button>
                      ) : null}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}