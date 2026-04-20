import { Button, Form, Modal, Row } from 'react-bootstrap';

export function AdminModals({
  t,
  adminModalState,
  closeAdminModal,
  instructorForm,
  setInstructorForm,
  classForm,
  setClassForm,
  adminInstructors,
  handleSaveInstructor,
  handleSaveClass,
  reservationModalState,
  closeReservationModal,
  setReservationModalState,
  handleCreateReservationForUser,
}) {
  return (
    <>
      <Modal show={adminModalState.open} onHide={closeAdminModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {adminModalState.entity === 'instructor'
              ? adminModalState.mode === 'edit'
                ? t('editInstructor')
                : t('createInstructor')
              : adminModalState.mode === 'edit'
                ? t('editClass')
                : t('createClass')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {adminModalState.entity === 'instructor' ? (
            <Form onSubmit={handleSaveInstructor}>
              <Form.Group className="mb-3">
                <Form.Label>{t('authName')}</Form.Label>
                <Form.Control
                  value={instructorForm.name}
                  onChange={(event) => setInstructorForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('emailOptional')}</Form.Label>
                <Form.Control
                  type="email"
                  value={instructorForm.email}
                  onChange={(event) => setInstructorForm((current) => ({ ...current, email: event.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('specialty')}</Form.Label>
                <Form.Control
                  value={instructorForm.specialty}
                  onChange={(event) => setInstructorForm((current) => ({ ...current, specialty: event.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('bio')}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={instructorForm.bio}
                  onChange={(event) => setInstructorForm((current) => ({ ...current, bio: event.target.value }))}
                />
              </Form.Group>
              <Button type="submit" className="w-100 rounded-pill action-button">
                {adminModalState.mode === 'edit' ? t('saveChanges') : t('saveInstructor')}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleSaveClass}>
              <Form.Group className="mb-3">
                <Form.Label>{t('className')}</Form.Label>
                <Form.Control
                  value={classForm.name}
                  onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('selectInstructor')}</Form.Label>
                <Form.Select
                  value={classForm.instructorId}
                  onChange={(event) => setClassForm((current) => ({ ...current, instructorId: event.target.value }))}
                >
                  <option value="">{t('selectInstructor')}</option>
                  {adminInstructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Row className="g-2 mb-3">
                <div className="col">
                  <Form.Select
                    value={classForm.level}
                    onChange={(event) => setClassForm((current) => ({ ...current, level: event.target.value }))}
                  >
                    <option value="beginner">{t('beginner')}</option>
                    <option value="intermediate">{t('intermediate')}</option>
                    <option value="advanced">{t('advanced')}</option>
                  </Form.Select>
                </div>
                <div className="col">
                  <Form.Control
                    type="number"
                    min={15}
                    value={classForm.durationMinutes}
                    onChange={(event) => setClassForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                  />
                </div>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>{t('description')}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={classForm.description}
                  onChange={(event) => setClassForm((current) => ({ ...current, description: event.target.value }))}
                />
              </Form.Group>
              <Button type="submit" className="w-100 rounded-pill action-button">
                {adminModalState.mode === 'edit' ? t('saveChanges') : t('saveClass')}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={reservationModalState.open} onHide={closeReservationModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {t('createReservation')} · {reservationModalState.classItem?.name || t('className')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="class-meta mb-3">{t('searchUsersHint')}</p>
          <Form.Group className="mb-3">
            <Form.Control
              placeholder={t('searchUsers')}
              value={reservationModalState.query}
              onChange={(event) =>
                setReservationModalState((current) => ({
                  ...current,
                  query: event.target.value,
                  selectedUser: null,
                }))
              }
            />
          </Form.Group>

          <div className="reservation-search-results mb-3">
            {reservationModalState.loading ? (
              <div className="empty-state admin-empty-tight">{t('authProcessing')}</div>
            ) : reservationModalState.users.length === 0 ? (
              <div className="empty-state admin-empty-tight">{t('searchUsersEmpty')}</div>
            ) : (
              reservationModalState.users.map((userItem) => (
                <Button
                  key={userItem.id}
                  variant={reservationModalState.selectedUser?.id === userItem.id ? 'dark' : 'outline-dark'}
                  className="reservation-user-item"
                  onClick={() => setReservationModalState((current) => ({ ...current, selectedUser: userItem }))}
                >
                  <span>{userItem.name}</span>
                  <span className="class-meta">{userItem.email}</span>
                </Button>
              ))
            )}
          </div>

          <Button
            className="w-100 rounded-pill action-button"
            disabled={!reservationModalState.selectedUser}
            onClick={handleCreateReservationForUser}
          >
            {t('createReservation')}
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
}
