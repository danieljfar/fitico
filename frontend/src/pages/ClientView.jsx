import { useMemo, useState } from 'react';
import { Row } from 'react-bootstrap';
import { Home } from './Home.jsx';
import { Classes } from './Classes.jsx';
import { Profile } from './Profile.jsx';
import { InstructorProfile } from './InstructorProfile.jsx';
import { Instructors } from './Instructors.jsx';

export function ClientView({
  t,
  user,
  classes,
  reservations,
  totalSeats,
  liveClasses,
  totalReservations,
  booting,
  highlightedInstructors,
  instructors,
  formatDateTime,
  token,
  clientViewSection,
  onReserve,
  onCancel,
  onOpenAuthModal,
}) {
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);
  const [showAllInstructors, setShowAllInstructors] = useState(false);

  const selectedInstructor = useMemo(
    () => instructors.find((instructor) => instructor.id === selectedInstructorId) || null,
    [instructors, selectedInstructorId]
  );

  function handleSelectInstructor(instructor) {
    if (!instructor?.id) {
      return;
    }
    setShowAllInstructors(false);
    setSelectedInstructorId(instructor.id);
  }

  function handleBackToClient() {
    setSelectedInstructorId(null);
    setShowAllInstructors(false);
  }

  function handleOpenAllInstructors() {
    setSelectedInstructorId(null);
    setShowAllInstructors(true);
  }

  if (selectedInstructor) {
    return (
      <InstructorProfile
        t={t}
        instructor={selectedInstructor}
        formatDateTime={formatDateTime}
        onBack={handleBackToClient}
      />
    );
  }

  if (showAllInstructors) {
    return (
      <section className="panel-card border-0 p-4 p-lg-5 mb-4">
        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
          <div>
            <div className="section-heading mb-1">{t('instructors')}</div>
            <div className="customer-panel-title customer-panel-title-sm">{t('viewAllInstructors')}</div>
          </div>
          <button type="button" className="instructors-view-all" onClick={handleBackToClient}>
            {t('backToClientView')}
          </button>
        </div>

        <Instructors t={t} instructors={instructors} onSelectInstructor={handleSelectInstructor} />
      </section>
    );
  }

  if (clientViewSection === 'profile') {
    return (
      <Profile
        t={t}
        user={user}
        token={token}
        reservations={reservations}
        formatDateTime={formatDateTime}
        onOpenAuthModal={onOpenAuthModal}
        onCancel={onCancel}
      />
    );
  }

  return (
    <>
      <Home
        t={t}
        user={user}
        totalSeats={totalSeats}
        liveClasses={liveClasses}
        totalReservations={totalReservations}
        booting={booting}
        highlightedInstructors={highlightedInstructors}
        onSelectInstructor={handleSelectInstructor}
        onViewAllInstructors={handleOpenAllInstructors}
      />

      <Row className="g-4 client-content-grid">
        <Classes t={t} classes={classes} reservations={reservations} formatDateTime={formatDateTime} onReserve={onReserve} />
      </Row>
    </>
  );
}
