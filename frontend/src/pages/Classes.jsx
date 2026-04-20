import { Badge, Button, Card, Col } from 'react-bootstrap';

export function Classes({ t, classes, reservations, formatDateTime, onReserve }) {
  return (
    <Col xl={7}>
      <Card className="panel-card h-100 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="section-heading mb-3">{t('sessionClasses')}</div>
          <div className="class-grid">
            {classes.map((classSession) => {
              const isMine = reservations.some(
                (reservation) => reservation.slotId === classSession.id && reservation.status === 'active'
              );

              return (
                <div key={classSession.id} className={`class-item ${classSession.isFull ? 'full' : ''}`}>
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                    <div>
                      <div className="class-title">{classSession.title}</div>
                      <div className="class-meta">{formatDateTime(classSession.startsAt)}</div>
                      {classSession.class?.name ? (
                        <div className="class-meta">
                          {t('classLabel')}: {classSession.class.name}
                        </div>
                      ) : null}
                      {classSession.bikeLabel ? (
                        <div className="class-meta">
                          {t('bikeLabel')}: {classSession.bikeLabel}
                        </div>
                      ) : null}
                    </div>
                    <Badge bg={classSession.isFull ? 'danger' : 'success'}>{classSession.isFull ? t('full') : t('open')}</Badge>
                  </div>

                  <div className="class-stats mb-3">
                    <span>
                      {classSession.availableSeats} {t('seatsLeft')}
                    </span>
                    <span>
                      {classSession.bookedCount}/{classSession.capacity}
                    </span>
                  </div>

                  <Button
                    variant={isMine ? 'outline-secondary' : 'dark'}
                    className="w-100 rounded-pill"
                    disabled={classSession.isFull || isMine}
                    onClick={() => onReserve(classSession.id)}
                  >
                    {isMine ? t('reserved') : classSession.isFull ? t('soldOut') : t('reserveNow')}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
