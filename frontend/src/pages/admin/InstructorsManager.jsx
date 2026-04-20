import { Badge, Button, Card, Stack } from 'react-bootstrap';
import { FiEdit3, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

export function InstructorsManager({ t, instructors, onCreateInstructor, onEditInstructor, onDeleteInstructor }) {
  return (
    <Card className="admin-block h-100 border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div className="section-heading mb-2">{t('instructors')}</div>
            <div className="admin-block-title">{t('instructorsBlockTitle')}</div>
          </div>
          <Button className="rounded-pill action-button" size="sm" onClick={onCreateInstructor}>
            <FiPlus className="me-2" />
            {t('createInstructor')}
          </Button>
        </div>

        <div className="admin-list">
          {instructors.length === 0 ? (
            <div className="empty-state">{t('noInstructorsYet')}</div>
          ) : (
            instructors.map((instructor) => (
              <div key={instructor.id} className="admin-list-item">
                <Stack direction="horizontal" gap={3} className="align-items-start justify-content-between">
                  <div className="min-w-0">
                    <div className="admin-item-title">{instructor.name}</div>
                    <div className="class-meta">{instructor.specialty || t('noSpecialty')}</div>
                    <div className="admin-item-subtitle">{instructor.email || t('emailOptional')}</div>
                  </div>
                  <Badge bg={instructor.status === 'active' ? 'success' : 'secondary'}>{instructor.status}</Badge>
                </Stack>

                <div className="admin-item-actions">
                  <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={() => onEditInstructor(instructor)}>
                    <FiEdit3 className="me-1" />
                    {t('edit')}
                  </Button>
                  <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => onDeleteInstructor(instructor)}>
                    <FiTrash2 className="me-1" />
                    {t('delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
