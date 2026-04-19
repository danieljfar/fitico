import { Badge, Button, Card, Col, Row, Stack } from 'react-bootstrap';
import { FiActivity, FiClock, FiGlobe, FiLock, FiRefreshCw, FiUsers } from 'react-icons/fi';

function StatCard({ icon, label, value }) {
	return (
		<Card className="stat-card h-100">
			<Card.Body>
				<Stack direction="horizontal" gap={3}>
					<div className="stat-icon">{icon}</div>
					<div>
						<div className="stat-label">{label}</div>
						<div className="stat-value">{value}</div>
					</div>
				</Stack>
			</Card.Body>
		</Card>
	);
}

export function Home({
	t,
	user,
	slotsCount,
	totalSeats,
	liveSlots,
	totalReservations,
	booting,
	selectedCountry,
	countryOptions,
	isCountrySelectorOpen,
	onToggleCountrySelector,
	onSelectCountry,
	onOpenAuthModal,
	onLogout,
}) {
	return (
		<>
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
						</div>

						<div className="auth-control">
							{user ? (
								<>
									<span className="welcome-line">
										{t('signedAs')} {user.name}
									</span>
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

			<Row className="align-items-center g-4 mb-4 mb-lg-5">
				<Col lg={10}>
					<div className="eyebrow mb-2">
						<FiActivity className="me-2" />
						{t('eyebrow')}
					</div>
					<h1 className="hero-title mb-3">Fitness Flow</h1>
					<p className="hero-copy mb-4">{t('heroCopy')}</p>
					<Stack direction="horizontal" gap={3} className="flex-wrap">
						<Badge bg="light" text="dark" className="pill">
							<FiUsers className="me-2" />
							{slotsCount} {t('slotsBadge')}
						</Badge>
						<Badge bg="light" text="dark" className="pill">
							<FiClock className="me-2" />
							{totalSeats} {t('openSeatsBadge')}
						</Badge>
						<Badge bg="light" text="dark" className="pill">
							<FiLock className="me-2" />
							{t('txBadge')}
						</Badge>
					</Stack>
				</Col>
			</Row>

			<Row className="g-3 g-lg-4 mb-4">
				<Col md={4}>
					<StatCard icon={<FiUsers />} label={t('availableSeats')} value={booting ? '...' : totalSeats} />
				</Col>
				<Col md={4}>
					<StatCard icon={<FiRefreshCw />} label={t('liveSlots')} value={booting ? '...' : liveSlots} />
				</Col>
				<Col md={4}>
					<StatCard icon={<FiClock />} label={t('yourReservations')} value={user ? totalReservations : t('signIn')} />
				</Col>
			</Row>
		</>
	);
}
