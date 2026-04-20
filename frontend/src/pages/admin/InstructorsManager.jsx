import { useMemo, useState } from 'react';
import { Badge, Button, Card, Collapse, ProgressBar, Stack } from 'react-bootstrap';
import { FiChevronDown, FiEdit3, FiPlus, FiTrash2 } from 'react-icons/fi';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getClassIdFromSession(classSession) {
  return classSession.class?.id ?? classSession.classId ?? null;
}

function getInstructorIdFromClass(classItem) {
  return classItem.instructor?.id ?? classItem.instructorId ?? null;
}

function getClassOccupancy(classItem, classSessions) {
  const sessionsForClass = classSessions.filter((session) => getClassIdFromSession(session) === classItem.id);
  const totalCapacity = sessionsForClass.reduce((sum, session) => sum + toNumber(session.capacity), 0);
  const totalBooked = sessionsForClass.reduce((sum, session) => sum + toNumber(session.bookedCount), 0);
  const occupancy = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  return {
    occupancy,
    hasSessions: sessionsForClass.length > 0,
  };
}

export function InstructorsManager({
  t,
  instructors,
  classes,
  classSessions,
  onCreateInstructor,
  onEditInstructor,
  onDeleteInstructor,
}) {
  const [expandedInstructorId, setExpandedInstructorId] = useState(null);

  const classesByInstructor = useMemo(() => {
    const byInstructor = new Map();

    classes.forEach((classItem) => {
      const instructorId = getInstructorIdFromClass(classItem);
      if (!instructorId) {
        return;
      }

      const key = String(instructorId);
      if (!byInstructor.has(key)) {
        byInstructor.set(key, []);
      }

      byInstructor.get(key).push(classItem);
    });

    return byInstructor;
  }, [classes]);

  return (
    <Card className="admin-block admin-block-wide border-0 shadow-sm">
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
            instructors.map((instructor) => {
              const instructorClasses = classesByInstructor.get(String(instructor.id)) || [];
              const expanded = expandedInstructorId === instructor.id;

              return (
                <div key={instructor.id} className="admin-list-item admin-instructor-item">
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
                    <Button
                      variant={expanded ? 'dark' : 'outline-dark'}
                      size="sm"
                      className="rounded-pill"
                      onClick={() => setExpandedInstructorId((current) => (current === instructor.id ? null : instructor.id))}
                    >
                      <FiChevronDown className="me-1" />
                      {expanded ? t('hideInstructorStats') : t('viewInstructorStats')}
                    </Button>
                  </div>

                  <Collapse in={expanded}>
                    <div className="admin-instructor-details mt-3">
                      <div className="section-heading mb-2">{t('instructorClasses')}</div>
                      {instructorClasses.length === 0 ? (
                        <div className="empty-state admin-empty-tight">{t('noClassesForInstructor')}</div>
                      ) : (
                        <div className="admin-instructor-classes-list">
                          {instructorClasses.map((classItem) => {
                            const occupancy = getClassOccupancy(classItem, classSessions);
                            return (
                              <div key={classItem.id} className="admin-instructor-class-row">
                                <div className="admin-item-title">{classItem.name}</div>
                                <div className="class-meta mb-2">
                                  {t('instructorOccupancy')}: {occupancy.hasSessions ? `${occupancy.occupancy}%` : '--'}
                                </div>
                                <ProgressBar now={occupancy.occupancy} className="admin-occupancy-bar" />
                              </div>
                            );
                          })}
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
