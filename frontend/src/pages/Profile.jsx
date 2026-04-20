import { Badge, Button, Card, Col, ListGroup } from 'react-bootstrap';

export function Profile({ t, token, reservations, formatDateTime, onOpenAuthModal, onCancel }) {
  return (
    <Col xl={5}>
      <Card className="panel-card h-100 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="section-heading mb-3">{t('yourReservations')}</div>

          <ListGroup variant="flush" className="reservation-list">
            {reservations.length === 0 ? (
              <div className="empty-state">
                {token ? (
                  t('noReservations')
                ) : (
                  <>
                    <div>{t('signInManage')}</div>
                    <Button className="mt-3 rounded-pill" variant="dark" onClick={onOpenAuthModal}>
                      {t('signIn')}
                    </Button>
                  </>
                )}
              </div>
            ) : null}

            {reservations.map((reservation) => (
              <ListGroup.Item key={reservation.id} className="reservation-row">
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <div className="class-title mb-1">{reservation.slot?.title}</div>
                    <div className="class-meta">
                      {reservation.slot?.startsAt ? formatDateTime(reservation.slot.startsAt) : t('scheduled')}
                    </div>
                    {reservation.slot?.class?.name ? <div className="class-meta">{reservation.slot.class.name}</div> : null}
                    {reservation.slot?.bikeLabel ? (
                      <div className="class-meta">
                        {t('bikeLabel')}: {reservation.slot.bikeLabel}
                      </div>
                    ) : null}
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
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Col>
  );
}
