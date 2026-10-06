import useDashboard from "../api/useDashboard";
import { loadUserDashboard, joinQueue, leaveQueue as leaveApiQueue } from "../api/queues";
import { logout } from "../api/auth";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DashboardPage.css";

const EMPTY = [];

function DashboardPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const email = user.email || location.state?.email || "user@queueless.com";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedService, setSelectedService] = useState(null);
  const { data, error, loading, refresh } = useDashboard(loadUserDashboard);
  const services = data?.services || EMPTY;
  const currentQueue = data?.currentQueue || null;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notification, setNotification] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const categories = [
    "All",
    "General",
    "Documents",
    "Payments",
    "Registration",
    "Priority",
  ];

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || service.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

  const showNotification = (message) => {
    setNotification(message);

    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const confirmJoinQueue = async () => {
    if (!selectedService || busy) return;
    setBusy(true); setActionError("");
    try {
      const queue = await joinQueue(selectedService.id);
      setSelectedService(null);
      await refresh();
      showNotification("Joined queue " + queue.ticketNumber);
    } catch (failure) { setActionError(failure.message); }
    finally { setBusy(false); }
  };
  const leaveQueue = async () => {
    if (busy) return;
    setBusy(true); setActionError("");
    try { await leaveApiQueue(); await refresh(); showNotification("You have left the queue."); }
    catch (failure) { setActionError(failure.message); }
    finally { setBusy(false); }
  };
  const handleLogout = async () => {
    try { await logout(); navigate("/login", { replace: true }); } catch (error) { showNotification(error.message); }
  };

  return (
    <main className="dashboard-page">
      {loading && <p role="status">Loading services and your queue…</p>}
      {(error || actionError) && <p role="alert">{actionError || error} <button onClick={refresh}>Refresh</button></p>}
      {notification && (
        <div className="dashboard-toast">
          <span className="toast-check">✓</span>
          {notification}
        </div>
      )}

      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <button
            className="dashboard-brand"
            onClick={() => navigate("/dashboard")}
          >
            <span className="dashboard-logo">Q</span>

            <span className="dashboard-brand-text">
              Queue<span>Less</span>
            </span>
          </button>

          <nav className="dashboard-nav">
            <button className="active">Dashboard</button>

            <button
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Services
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("current-queue")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              My Queue
            </button>
          </nav>

          <div className="profile-wrapper">
            <button
              className="profile-button"
              onClick={() => setShowProfile((previous) => !previous)}
            >
              <div className="profile-avatar">
                {email.charAt(0).toUpperCase()}
              </div>

              <div className="profile-info">
                <span>User</span>
                <small>{email}</small>
              </div>

              <span className="profile-arrow">⌄</span>
            </button>

            {showProfile && (
              <div className="profile-menu">
                <div>
                  <strong>QueueLess User</strong>
                  <span>{email}</span>
                </div>

                <button onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard-content">
        <section className="dashboard-hero">
          <div>
            <p className="dashboard-eyebrow">
              SMART QUEUE MANAGEMENT
            </p>

            <h1>
              Good to see you.
              <span> What would you like to do?</span>
            </h1>

            <p>
              Find an available service, join a queue digitally and monitor
              your position without standing in line.
            </p>
          </div>

          <div className="dashboard-status-card">
            <div className="status-indicator">
              <span></span>
              SYSTEM ONLINE
            </div>

            <strong>{services.length}</strong>

            <p>Queue services available</p>

            <small>Live service information</small>
          </div>
        </section>

        {currentQueue ? (
          <section
            className="active-queue-section"
            id="current-queue"
          >
            <div className="section-title-row">
              <div>
                <p className="section-eyebrow">CURRENT QUEUE</p>
                <h2>Your active queue</h2>
              </div>

              <span className="active-status">
                <span></span>
                LIVE
              </span>
            </div>

            <div className="active-queue-card">
              <div className="active-queue-main">
                <div className="queue-service-icon">
                  {currentQueue.icon}
                </div>

                <div>
                  <span>{currentQueue.status === "SERVING" ? "Now serving" : "Currently waiting for"}</span>
                  <h3>{currentQueue.name}</h3>
                  <p>
                    You can continue using QueueLess while your position
                    updates.
                  </p>
                </div>
              </div>

              <div className="queue-stat queue-ticket">
                <span>Your number</span>
                <strong>{currentQueue.queueNumber}</strong>
              </div>

              <div className="queue-stat">
                <span>Your position</span>
                <strong>{currentQueue.status === "SERVING" ? "Your turn" : "#" + currentQueue.position}</strong>
              </div>

              <div className="queue-stat">
                <span>People ahead</span>
                <strong>{currentQueue.people}</strong>
              </div>

              <div className="queue-stat">
                <span>Estimated wait</span>
                <strong>~{currentQueue.waiting} min</strong>
              </div>

              <button
                className="leave-queue-button" disabled={busy}
                onClick={leaveQueue}
              >
                Leave queue
              </button>
            </div>
          </section>
        ) : (
          <section className="empty-queue-banner" id="current-queue">
            <div className="empty-queue-icon">◎</div>

            <div>
              <strong>You are not currently in a queue</strong>
              <p>Select a service below to reserve your position.</p>
            </div>

            <button
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Browse services
            </button>
          </section>
        )}

        <section className="services-section" id="services">
          <div className="section-title-row services-heading">
            <div>
              <p className="section-eyebrow">AVAILABLE SERVICES</p>
              <h2>Choose a queue</h2>
              <span>
                Select the service you need and join digitally.
              </span>
            </div>
          </div>

          <div className="service-controls">
            <div className="service-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button onClick={() => setSearch("")}>×</button>
              )}
            </div>

            <div className="category-list">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredServices.length > 0 ? (
            <div className="services-grid">
              {filteredServices.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-card-top">
                    <div className="service-card-icon">
                      {service.icon}
                    </div>

                    <span
                      className={`service-status ${
                        service.status === "Busy" ? "busy" : ""
                      }`}
                    >
                      <span></span>
                      {service.status}
                    </span>
                  </div>

                  <div className="service-card-content">
                    <span className="service-category">
                      {service.category}
                    </span>

                    <h3>{service.name}</h3>

                    <p>{service.description}</p>
                  </div>

                  <div className="service-meta">
                    <div>
                      <span>Waiting</span>
                      <strong>{service.people}</strong>
                    </div>

                    <div>
                      <span>Est. wait</span>
                      <strong>~{service.waiting} min</strong>
                    </div>
                  </div>

                  <button
                    className="join-queue-button"
                    disabled={loading || busy || Boolean(currentQueue) || service.status === "Closed"}
                    onClick={() => { setActionError(""); setSelectedService(service); }}
                  >
                    {currentQueue
                      ? "Queue already active"
                      : service.status === "Closed" ? "Service closed" : "Join queue"}

                    {!currentQueue && <span>→</span>}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-services">
              <span>⌕</span>
              <h3>No services found</h3>
              <p>Try another search or category.</p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="dashboard-help">
          <div>
            <span className="help-icon">?</span>

            <div>
              <strong>Need help using QueueLess?</strong>
              <p>
                Choose a service, join its queue and track your live
                position from this dashboard.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              showNotification(
                "Support functionality will be connected later."
              )
            }
          >
            Get support
          </button>
        </section>

        <footer className="dashboard-footer">
          <div className="dashboard-brand footer-brand">
            <span className="dashboard-logo small">Q</span>

            <span className="dashboard-brand-text dark">
              Queue<span>Less</span>
            </span>
          </div>

          <p>
            © 2026 QueueLess. Digital Queue Management System.
          </p>

          <span>Secure queue management</span>
        </footer>
      </section>

      {selectedService && (
        <div
          className="queue-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          <div className="queue-modal">
            <button
              className="modal-close"
              onClick={() => setSelectedService(null)}
            >
              ×
            </button>

            <div className="modal-service-icon">
              {selectedService.icon}
            </div>

            <p className="modal-eyebrow">JOIN QUEUE</p>

            <h2>{selectedService.name}</h2>

            <p className="modal-description">
              You are about to reserve your place in this queue.
            </p>

            <div className="modal-stats">
              <div>
                <span>People waiting</span>
                <strong>{selectedService.people}</strong>
              </div>

              <div>
                <span>Estimated wait</span>
                <strong>~{selectedService.waiting} min</strong>
              </div>
            </div>

            <div className="modal-notice">
              <span>i</span>

              <p>
                Keep this dashboard open to monitor your queue position.
              </p>
            </div>

            {actionError && <p role="alert">{actionError}</p>}
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setSelectedService(null)}
              >
                Cancel
              </button>

              <button
                className="modal-confirm"
                onClick={confirmJoinQueue} disabled={busy}
              >
                Confirm & join
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default DashboardPage;