import { Col, Row } from 'react-bootstrap';
import { Dashboard } from './Dashboard.jsx';

export function AdminView({
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
    <Row className="g-4 mt-1">
      <Col xs={12}>
        <div className="admin-hero">
          <div className="section-heading mb-2">{t('adminDashboard')}</div>
          <h2 className="admin-hero-title">{t('adminView')}</h2>
          <p className="class-meta mb-0">{t('adminWorkspaceSubtitle')}</p>
        </div>
      </Col>
      <Col xs={12}>
        <Dashboard
          t={t}
          adminLoading={adminLoading}
          adminMetrics={adminMetrics}
          adminInstructors={adminInstructors}
          adminClasses={adminClasses}
          adminClassSessions={adminClassSessions}
          reservationsByClass={reservationsByClass}
          expandedClassId={expandedClassId}
          onCreateInstructor={onCreateInstructor}
          onEditInstructor={onEditInstructor}
          onDeleteInstructor={onDeleteInstructor}
          onCreateClass={onCreateClass}
          onEditClass={onEditClass}
          onDeleteClass={onDeleteClass}
          onToggleReservations={onToggleReservations}
          onCreateReservation={onCreateReservation}
          onDeleteReservation={onDeleteReservation}
        />
      </Col>
    </Row>
  );
}
