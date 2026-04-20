import { Button, Col, Row } from 'react-bootstrap';

export function AppTopBar({
  t,
  user,
  selectedCountry,
  countryOptions,
  isCountrySelectorOpen,
  onToggleCountrySelector,
  onSelectCountry,
  isAdmin,
  adminViewMode,
  onToggleAdminViewMode,
  clientViewSection,
  onSelectClientViewSection,
  onOpenAuthModal,
  onLogout,
}) {
  const canShowProfileButton = Boolean(user) && (!isAdmin || adminViewMode === 'client');
  const canShowCredits = Boolean(user) && (!isAdmin || adminViewMode === 'client');

  return (
    <Row className="mb-4">
      <Col>
        <div className="top-controls">
          <div className="country-control country-dropdown-wrap">
            <Button
              variant="light"
              className="country-button rounded-pill"
              onClick={onToggleCountrySelector}
              aria-label={t('country')}
              aria-expanded={isCountrySelectorOpen}
            >
              <span className="country-flag">{selectedCountry.flag}</span>
              <span>{t(selectedCountry.labelKey)}</span>
            </Button>

            <div className={`country-menu ${isCountrySelectorOpen ? 'open' : ''}`}>
              {countryOptions.map((option) => (
                <Button
                  key={option.code}
                  variant={option.code === selectedCountry.code ? 'dark' : 'light'}
                  className="country-menu-item"
                  onClick={() => onSelectCountry(option.code)}
                >
                  <span className="country-flag">{option.flag}</span>
                  <span>{t(option.labelKey)}</span>
                </Button>
              ))}
            </div>
            {user ? (
              <span className="welcome-line">
                {t('signedAs')} {user.name}
              </span>
            ) : null}
          </div>

          <div className="auth-control">
            {isAdmin ? (
              <Button
                variant={adminViewMode === 'admin' ? 'dark' : 'outline-dark'}
                className="rounded-pill admin-view-toggle"
                onClick={onToggleAdminViewMode}
              >
                {adminViewMode === 'admin' ? t('clientView') : t('adminView')}
              </Button>
            ) : null}

            {user ? (
              <>
                {canShowCredits ? (
                  <span className="credits-pill">
                    {t('creditsBalance')}: {Number(user.credits ?? 0)}
                  </span>
                ) : null}
                {canShowProfileButton ? (
                  <Button
                    variant="outline-dark"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => onSelectClientViewSection(clientViewSection === 'profile' ? 'home' : 'profile')}
                  >
                    {clientViewSection === 'profile' ? t('homeSection') : t('profileSection')}
                  </Button>
                ) : null}
                <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={onLogout}>
                  {t('logout')}
                </Button>
              </>
            ) : (
              <Button className="rounded-pill action-button" onClick={onOpenAuthModal}>
                {t('openAuthModal')}
              </Button>
            )}
          </div>
        </div>
      </Col>
    </Row>
  );
}
