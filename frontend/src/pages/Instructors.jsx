import { Badge, Button, ListGroup } from 'react-bootstrap';

export function Instructors({ t, instructors, onSelectInstructor }) {
  return (
    <>
      <div className="section-heading mb-2">{t('instructors')}</div>
      <ListGroup>
        {instructors.map((instructor) => (
          <ListGroup.Item key={instructor.id} className="d-flex justify-content-between align-items-center gap-3">
            <div className="min-w-0">
              <div className="class-title mb-0">{instructor.name}</div>
              <div className="class-meta">{instructor.specialty || t('noSpecialty')}</div>
              <div className="class-meta">{t('instructorOccupancy')}: {instructor.occupancyRate ?? 0}%</div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Badge bg={instructor.status === 'active' ? 'success' : 'secondary'}>{instructor.status}</Badge>
              <Button
                variant="outline-dark"
                size="sm"
                className="rounded-pill"
                onClick={() => onSelectInstructor?.(instructor)}
              >
                {t('viewProfile')}
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
}
