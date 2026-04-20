import { Card, Col, Row, Stack } from 'react-bootstrap';
import { FiActivity, FiArrowRight, FiClock, FiLock, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { InstructorsManager } from './InstructorsManager.jsx';
import { ClassesManager } from './ClassesManager.jsx';

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

export function Dashboard({
  t,
  adminLoading,
  adminMetrics,
  instructorForm,
  classForm,
  classSessions,
  adminInstructors,
  adminClasses,
  adminClassSessions,
  reservationsByClass,
  expandedClassId,
  formatDateTime,
  onCreateInstructor,
  onEditInstructor,
  onDeleteInstructor,
  onCreateClass,
  onEditClass,
  onDeleteClass,
  onToggleReservations,
  onCreateReservation,
  onDeleteReservation,
  onCreateClassSession,
}) {
  return (
    <Row className="g-4 mt-1">
      <Col xs={12}>
        <Card className="panel-card border-0 shadow-sm">
          <Card.Body className="p-4">
            <div className="section-heading mb-3">{t('adminDashboard')}</div>
            <Row className="g-3 mb-4">
              <Col md={4} lg={2}>
                <StatCard icon={<FiUsers />} label={t('users')} value={adminLoading ? '...' : adminMetrics?.users ?? 0} />
              </Col>
              <Col md={4} lg={2}>
                <StatCard icon={<FiActivity />} label={t('instructors')} value={adminLoading ? '...' : adminMetrics?.instructors ?? 0} />
              </Col>
              <Col md={4} lg={2}>
                <StatCard icon={<FiClock />} label={t('classes')} value={adminLoading ? '...' : adminMetrics?.classes ?? 0} />
              </Col>
              <Col md={4} lg={2}>
                <StatCard
                  icon={<FiRefreshCw />}
                  label={t('classSessions')}
                  value={adminLoading ? '...' : adminMetrics?.slots ?? 0}
                />
              </Col>
              <Col md={4} lg={2}>
                <StatCard
                  icon={<FiLock />}
                  label={t('activeBookings')}
                  value={adminLoading ? '...' : adminMetrics?.activeBookings ?? 0}
                />
              </Col>
              <Col md={4} lg={2}>
                <StatCard
                  icon={<FiArrowRight />}
                  label={t('occupancy')}
                  value={adminLoading ? '...' : `${adminMetrics?.occupancyRate ?? 0}%`}
                />
              </Col>
            </Row>

            <Row className="g-4">
              <Col lg={4}>
                <InstructorsManager
                  t={t}
                  instructors={adminInstructors}
                  onCreateInstructor={onCreateInstructor}
                  onEditInstructor={onEditInstructor}
                  onDeleteInstructor={onDeleteInstructor}
                />
              </Col>

              <ClassesManager
                t={t}
                classes={adminClasses}
                classSessions={classSessions || adminClassSessions}
                reservationsByClass={reservationsByClass}
                expandedClassId={expandedClassId}
                onCreateClass={onCreateClass}
                onEditClass={onEditClass}
                onDeleteClass={onDeleteClass}
                onToggleReservations={onToggleReservations}
                onCreateReservation={onCreateReservation}
                onDeleteReservation={onDeleteReservation}
              />
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
