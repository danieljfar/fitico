import { Badge, ListGroup } from 'react-bootstrap';

export function Instructors({ t, instructors }) {
  return (
    <>
      <div className="section-heading mb-2">{t('instructors')}</div>
      <ListGroup>
        {instructors.map((instructor) => (
          <ListGroup.Item key={instructor.id} className="d-flex justify-content-between align-items-center">
            <div>
              <div className="class-title mb-0">{instructor.name}</div>
              <div className="class-meta">{instructor.specialty || t('noSpecialty')}</div>
            </div>
            <Badge bg={instructor.status === 'active' ? 'success' : 'secondary'}>{instructor.status}</Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
}
