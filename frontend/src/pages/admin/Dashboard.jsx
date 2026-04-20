import { Card, Col, Row, Stack } from 'react-bootstrap';
import { FiActivity, FiArrowRight, FiClock, FiLock, FiUsers } from 'react-icons/fi';
import { InstructorsManager } from './InstructorsManager.jsx';
import { ClassesManager } from './ClassesManager.jsx';

function StatCard({ icon, label, value }) {
  return (
    <Card className="stat-card admin-metric-card h-100">
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

export function Dashboard({
  t,
  adminLoading,
  adminMetrics,
  adminInstructors,
  adminClasses,
  adminClassSessions,
  reservationsByClass,
  expandedClassId,
  onCreateInstructor,
  onEditInstructor,
  onDeleteInstructor,
  onCreateClass,
  onEditClass,
  onDeleteClass,
  onToggleReservations,
  onCreateReservation,
  onDeleteReservation,
}) {
  return (
    <Card className="panel-card border-0 shadow-sm">
      <Card.Body className="p-4">
        <Row className="g-3 mb-4">
          <Col md={6} lg={4} xl={3}>
            <StatCard icon={<FiUsers />} label={t('users')} value={adminLoading ? '...' : adminMetrics?.users ?? 0} />
          </Col>
          <Col md={6} lg={4} xl={3}>
            <StatCard icon={<FiActivity />} label={t('instructors')} value={adminLoading ? '...' : adminMetrics?.instructors ?? 0} />
          </Col>
          <Col md={6} lg={4} xl={2}>
            <StatCard icon={<FiClock />} label={t('classes')} value={adminLoading ? '...' : adminMetrics?.classes ?? 0} />
          </Col>
          <Col md={6} lg={6} xl={2}>
            <StatCard
              icon={<FiLock />}
              label={t('activeBookings')}
              value={adminLoading ? '...' : adminMetrics?.activeBookings ?? 0}
            />
          </Col>
          <Col md={6} lg={6} xl={2}>
            <StatCard
              icon={<FiArrowRight />}
              label={t('occupancy')}
              value={adminLoading ? '...' : `${adminMetrics?.occupancyRate ?? 0}%`}
            />
          </Col>
        </Row>

        <Row className="g-4">
          <Col xs={12}>
            <InstructorsManager
              t={t}
              instructors={adminInstructors}
              classes={adminClasses}
              classSessions={adminClassSessions}
              onCreateInstructor={onCreateInstructor}
              onEditInstructor={onEditInstructor}
              onDeleteInstructor={onDeleteInstructor}
            />
          </Col>

          <Col xs={12}>
            <ClassesManager
              t={t}
              classes={adminClasses}
              reservationsByClass={reservationsByClass}
              expandedClassId={expandedClassId}
              onCreateClass={onCreateClass}
              onEditClass={onEditClass}
              onDeleteClass={onDeleteClass}
              onToggleReservations={onToggleReservations}
              onCreateReservation={onCreateReservation}
              onDeleteReservation={onDeleteReservation}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
