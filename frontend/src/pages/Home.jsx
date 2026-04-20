import { Button, Card, Col, Row } from 'react-bootstrap';
import { FiActivity, FiArrowRight, FiClock, FiRefreshCw, FiUsers } from 'react-icons/fi';

export function Home({
	t,
	user,
	totalSeats,
	liveClasses,
	totalReservations,
	booting,
	highlightedInstructors,
	onSelectInstructor,
	onViewAllInstructors,
}) {
	const homeHighlights = [t('homeBadgeCuratedClasses'), t('homeBadgeFastBooking'), t('homeBadgeRealtimeSync')];

	const homeFocus = [
		{ icon: <FiUsers />, label: t('availableSeats'), value: booting ? '...' : totalSeats },
		{ icon: <FiRefreshCw />, label: t('liveClasses'), value: booting ? '...' : liveClasses },
		{ icon: <FiClock />, label: t('yourReservations'), value: user ? totalReservations : t('signIn') },
	];

	return (
		<section className="customer-home-shell mb-4 mb-lg-5">
			<Row className="g-4 align-items-stretch mb-4">
				<Col lg={7}>
					<Card className="panel-card border-0 customer-hero-card h-100">
						<Card.Body className="p-4 p-lg-5">
							<div className="eyebrow mb-2">
								<FiActivity className="me-2" />
								{t('eyebrow')}
							</div>
							<h1 className="hero-title mb-3">Fitico</h1>
							<p className="hero-copy mb-4">{t('heroCopy')}</p>

							<div className="home-feature-pills mb-4">
								{homeHighlights.map((item) => (
									<span key={item} className="home-feature-pill">
										{item}
									</span>
								))}
							</div>

							<div className="home-hero-actions">
								<Button className="rounded-pill action-button" onClick={onViewAllInstructors}>
									{t('homeCtaInstructors')}
									<FiArrowRight className="ms-2" />
								</Button>
								<p className="hero-support-copy mb-0">{t('homeTrustLine')}</p>
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col lg={5}>
					<Card className="panel-card border-0 customer-pulse-card h-100">
						<Card.Body className="p-4 p-lg-4">
							<div className="section-heading mb-2">{t('homeFocusTitle')}</div>
							<div className="customer-panel-title mb-3">{t('homeFocusSubtitle')}</div>
							<div className="customer-focus-list">
								{homeFocus.map((item, index) => (
									<div key={item.label} className="customer-focus-item">
										<div className="customer-focus-label">
											{item.icon}
											<span>{item.label}</span>
										</div>
										<div className="customer-focus-value-wrap">
											<div className="customer-focus-value">{item.value}</div>
										</div>
									</div>
								))}
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row className="g-4">
				<Col lg={12}>
					<Card className="panel-card border-0 customer-instructors-card h-100">
						<Card.Body className="p-4">
							<div className="section-heading mb-1">{t('featuredInstructors')}</div>
							<div className="class-meta mb-3">{t('homeFeaturedInstructorsSubtitle')}</div>
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
											<div className="instructor-highlight-top">
												<div className="instructor-avatar">
													{(instructor.name || t('coachLabel'))
														.split(' ')
														.slice(0, 2)
														.map((part) => part.charAt(0).toUpperCase())
														.join('')}
												</div>
												<div className="min-w-0">
													<div className="class-title mb-1">{instructor.name}</div>
													<div className="class-meta text-truncate">{instructor.specialty || t('noSpecialty')}</div>
												</div>
											</div>

											<div className="instructor-highlight-metrics mt-3">
												<span className="instructor-mini-kpi">
													{Math.max(0, Number(instructor.classes?.length) || 0)} {t('classes')}
												</span>
												<span className="instructor-mini-kpi">
													{Math.max(0, Number(instructor.sessions?.length) || 0)} {t('classSessions')}
												</span>
											</div>
										</button>
									))
								)}
							</div>
							<div className="d-flex align-items-center justify-content-between gap-2 mt-3">
								<button
									type="button"
									className="instructors-view-all"
									onClick={onViewAllInstructors}
								>
									{t('viewAllInstructors')}
								</button>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</section>
	);
}
