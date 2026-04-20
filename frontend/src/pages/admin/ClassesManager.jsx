import { Badge, Button, Card, Collapse, Stack } from 'react-bootstrap';
import { FiChevronDown, FiEdit3, FiPlus, FiPlusCircle, FiTrash2 } from 'react-icons/fi';

function ReservationRow({ t, reservation, onDeleteReservation }) {
  return (
    <div className="reservation-admin-row">
      <div>
        <div className="admin-item-title">{reservation.user?.name || reservation.userName || reservation.customerName || t('guestReservation')}</div>
        <div className="admin-item-subtitle">{reservation.user?.email || reservation.userEmail || t('emailOptional')}</div>
      </div>
      <div className="admin-item-actions">
        <Badge bg={reservation.status === 'active' ? 'primary' : 'secondary'}>
          {reservation.status === 'active' ? t('statusActive') : t('statusCancelled')}
        </Badge>
        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => onDeleteReservation(reservation)}>
          <FiTrash2 className="me-1" />
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}

export function ClassesManager({
  t,
  classes,
  reservationsByClass,
  expandedClassId,
  onCreateClass,
  onEditClass,
  onDeleteClass,
  onToggleReservations,
  onCreateReservation,
  onDeleteReservation,
}) {
  return (
    <Card className="admin-block h-100 border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div className="section-heading mb-2">{t('classes')}</div>
            <div className="admin-block-title">{t('classesBlockTitle')}</div>
          </div>
          <Button className="rounded-pill action-button" size="sm" onClick={onCreateClass}>
            <FiPlus className="me-2" />
            {t('createClass')}
          </Button>
        </div>

        <div className="admin-list">
          {classes.length === 0 ? (
            <div className="empty-state">{t('noClassesYet')}</div>
          ) : (
            classes.map((classItem) => {
              const isExpanded = expandedClassId === classItem.id;
              const classReservations = reservationsByClass[classItem.id] || [];

              return (
                <div key={classItem.id} className="admin-list-item admin-class-item">
                  <Stack direction="horizontal" gap={3} className="align-items-start justify-content-between">
                    <div className="min-w-0">
                      <div className="admin-item-title">{classItem.name}</div>
                      <div className="class-meta">
                        {classItem.level} · {classItem.durationMinutes} min
                      </div>
                      <div className="admin-item-subtitle">{classItem.instructor?.name || t('selectInstructor')}</div>
                    </div>
                    <Badge bg={classItem.status === 'active' ? 'success' : 'secondary'}>{classItem.status}</Badge>
                  </Stack>

                  <div className="admin-item-actions">
                    <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={() => onEditClass(classItem)}>
                      <FiEdit3 className="me-1" />
                      {t('edit')}
                    </Button>
                    <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => onDeleteClass(classItem)}>
                      <FiTrash2 className="me-1" />
                      {t('delete')}
                    </Button>
                    <Button variant="dark" size="sm" className="rounded-pill" onClick={() => onToggleReservations(classItem)}>
                      <FiChevronDown className="me-1" />
                      {isExpanded ? t('hideReservations') : t('showReservations')}
                    </Button>
                    <Button variant="outline-primary" size="sm" className="rounded-pill" onClick={() => onCreateReservation(classItem)}>
                      <FiPlusCircle className="me-1" />
                      {t('createReservation')}
                    </Button>
                  </div>

                  <Collapse in={isExpanded}>
                    <div className="admin-reservations-panel mt-3">
                      {classReservations.length === 0 ? (
                        <div className="empty-state admin-empty-tight">{t('noReservationsYet')}</div>
                      ) : (
                        <div className="admin-reservations-list">
                          {classReservations.map((reservation) => (
                            <ReservationRow
                              key={reservation.id}
                              t={t}
                              reservation={reservation}
                              onDeleteReservation={onDeleteReservation}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Collapse>
                </div>
              );
            })
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
