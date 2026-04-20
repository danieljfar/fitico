import { Badge, Card, Col, Row, Stack } from 'react-bootstrap';
import { FiActivity, FiClock, FiLock, FiRefreshCw, FiStar, FiUsers } from 'react-icons/fi';

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
	classesCount,
	totalSeats,
	liveClasses,
	totalReservations,
	booting,
	featuredClasses,
	highlightedInstructors,
	formatDateTime,
	onSelectInstructor,
}) {
	return (
		<>
			<Row className="align-items-center g-4 mb-4 mb-lg-5">
				<Col lg={8}>
					<div className="eyebrow mb-2">
						<FiActivity className="me-2" />
						{t('eyebrow')}
					</div>
					<h1 className="hero-title mb-3">Fitico</h1>
					<p className="hero-copy mb-4">{t('heroCopy')}</p>
					<Stack direction="horizontal" gap={3} className="flex-wrap">
						<Badge bg="light" text="dark" className="pill">
							<FiUsers className="me-2" />
							{classesCount} {t('classesBadge')}
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
				<Col lg={4}>
					<Card className="panel-card h-100 border-0 hero-side-panel">
						<Card.Body className="p-3 p-lg-4">
							<div className="section-heading mb-2">{t('instructors')}</div>
							<div className="hero-side-title mb-3">{t('heroInstructorPanel')}</div>
							<div className="instructor-chip-grid">
								{highlightedInstructors.map((instructor) => (
									<button
										type="button"
										key={instructor.id || instructor.name}
										className="instructor-chip instructor-chip-button"
										onClick={() => onSelectInstructor?.(instructor)}
									>
										<FiStar />
										<span>{instructor.name}</span>
									</button>
								))}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="g-3 g-lg-4 mb-4">
				<Col md={4}>
					<StatCard icon={<FiUsers />} label={t('availableSeats')} value={booting ? '...' : totalSeats} />
				</Col>
				<Col md={4}>
					<StatCard icon={<FiRefreshCw />} label={t('liveClasses')} value={booting ? '...' : liveClasses} />
				</Col>
				<Col md={4}>
					<StatCard icon={<FiClock />} label={t('yourReservations')} value={user ? totalReservations : t('signIn')} />
				</Col>
			</Row>

			<Row className="g-3 g-lg-4 mb-4 mb-lg-5">
				<Col lg={8}>
					<Card className="panel-card border-0">
						<Card.Body className="p-4">
							<div className="section-heading mb-3">{t('sessionClasses')}</div>
							<div className="featured-class-grid">
								{featuredClasses.length === 0 ? (
									<div className="empty-state">{t('noClassesYet')}</div>
								) : (
									featuredClasses.map((classSession) => (
										<div key={classSession.id} className="featured-class-card">
											<div className="class-title mb-1">{classSession.class?.name || classSession.title}</div>
											<div className="class-meta mb-2">
												{classSession.startsAt ? formatDateTime(classSession.startsAt) : t('scheduled')}
											</div>
											<div className="d-flex justify-content-between class-meta gap-2">
												<span>{classSession.class?.instructor?.name || t('coachAssignedSoon')}</span>
												<span>
													{classSession.availableSeats} {t('seatsLeft')}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</Card.Body>
					</Card>
				</Col>
				<Col lg={4}>
					<Card className="panel-card border-0 h-100">
						<Card.Body className="p-4">
							<div className="section-heading mb-3">{t('instructors')}</div>
							<div className="instructor-highlight-list">
								{highlightedInstructors.length === 0 ? (
									<div className="empty-state">{t('noInstructorsYet')}</div>
								) : (
									highlightedInstructors.map((instructor) => (
										<button
											type="button"
											key={`${instructor.id || instructor.name}-${instructor.specialty}`}
											className="instructor-highlight-item instructor-highlight-button"
											onClick={() => onSelectInstructor?.(instructor)}
										>
											<div className="class-title mb-1">{instructor.name}</div>
											<div className="class-meta">{instructor.specialty || t('noSpecialty')}</div>
										</button>
									))
								)}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);
}
