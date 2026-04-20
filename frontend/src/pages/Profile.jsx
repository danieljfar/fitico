import { Badge, Button, Card, Col, ListGroup, Row } from 'react-bootstrap';

export function Profile({ t, user, token, reservations, formatDateTime, onOpenAuthModal, onCancel }) {
  function buildReservationDetails(reservation) {
    const slot = reservation?.slot || {};
    const classItem = slot.class || {};
    const instructor = classItem.instructor || slot.instructor || {};

    const className = classItem.name || slot.title || t('scheduled');
    const sessionTitle = slot.title && slot.title !== className ? slot.title : null;
    const startsAt = slot.startsAt ? formatDateTime(slot.startsAt) : t('scheduled');
    const instructorName = instructor.name || t('coachAssignedSoon');
    const level = classItem.level ? t(classItem.level) : t('statusUnknown');
    const durationMinutes = Number(classItem.durationMinutes) || Number(slot.durationMinutes) || null;
    const bikeLabel = slot.bikeLabel || null;

    return {
      className,
      sessionTitle,
      startsAt,
      instructorName,
      level,
      durationMinutes,
      bikeLabel,
    };
  }

  if (!token) {
    return (
      <section className="panel-card border-0 p-4 p-lg-5 mb-4">
        <div className="section-heading mb-1">{t('profileSection')}</div>
        <div className="customer-panel-title customer-panel-title-sm mb-3">{t('profileTitle')}</div>
        <div className="class-meta mb-3">{t('signInManage')}</div>
        <Button className="rounded-pill action-button" onClick={onOpenAuthModal}>
          {t('signIn')}
        </Button>
      </section>
    );
  }

  return (
    <section className="profile-page mb-4">
      <Row className="g-4">
        <Col lg={4}>
          <Card className="panel-card h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="section-heading mb-1">{t('profileSection')}</div>
              <div className="customer-panel-title customer-panel-title-sm mb-3">{t('profileTitle')}</div>

              <ListGroup variant="flush" className="reservation-list">
                <ListGroup.Item className="reservation-row">
                  <div className="class-meta">{t('authName')}</div>
                  <div className="class-title mt-1">{user?.name || '-'}</div>
                </ListGroup.Item>

                <ListGroup.Item className="reservation-row">
                  <div className="class-meta">{t('authEmail')}</div>
                  <div className="class-title mt-1">{user?.email || '-'}</div>
                </ListGroup.Item>

                <ListGroup.Item className="reservation-row">
                  <div className="class-meta">{t('creditsBalance')}</div>
                  <div className="class-title mt-1">{user?.credits ?? 0}</div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="panel-card h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="section-heading mb-3">{t('yourReservations')}</div>

              <ListGroup variant="flush" className="reservation-list">
                {reservations.length === 0 ? <div className="empty-state">{t('noReservations')}</div> : null}

                {reservations.map((reservation) => {
                  const details = buildReservationDetails(reservation);

                  return (
                    <ListGroup.Item key={reservation.id} className="reservation-row">
                      <div className="d-flex justify-content-between gap-3">
                        <div className="min-w-0">
                          <div className="class-title mb-1">{details.className}</div>

                          {details.sessionTitle ? <div className="class-meta mb-1">{details.sessionTitle}</div> : null}

                          <div className="class-meta mb-2">{details.startsAt}</div>

                          <div className="class-stats flex-wrap">
                            <span>{t('instructorLabel')}: {details.instructorName}</span>
                            <span>{t('levelLabel')}: {details.level}</span>
                            {details.durationMinutes ? <span>{t('durationLabel')}: {details.durationMinutes} min</span> : null}
                            {details.bikeLabel ? <span>{t('bikeLabel')}: {details.bikeLabel}</span> : null}
                          </div>
                        </div>

                        <Badge bg={reservation.status === 'active' ? 'primary' : 'secondary'}>
                          {reservation.status === 'active' ? t('statusActive') : t('statusCancelled')}
                        </Badge>
                      </div>

                      {reservation.status === 'active' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="mt-3 rounded-pill"
                          onClick={() => onCancel(reservation.id)}
                        >
                          {t('cancelReservation')}
                        </Button>
                      ) : null}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  );
}
