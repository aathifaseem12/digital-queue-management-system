import useDashboard from "../api/useDashboard";
import { loadAdminDashboard, callNext as callNextApi, completeCustomer as completeApi, toggleService as toggleApi, createService } from "../api/queues";
import { logout } from "../api/auth";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const EMPTY = [];

function AdminDashboardPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const email = user.email || location.state?.email || "admin@queueless.com";

  const { data, error, loading, refresh } = useDashboard(loadAdminDashboard);
  const services = data?.services || EMPTY;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const queue = data?.queue || EMPTY;

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showAddService, setShowAddService] = useState(false);

  const [newService, setNewService] = useState({
    name: "",
    code: "", description: "", category: "General", averageWaitMinutes: 5,
  });

  const totalWaiting = data?.stats.waiting ?? 0;
  const totalServed = data?.stats.served ?? 0;
  const averageWait = data?.stats.averageWait ?? 0;
  const activeServices = data?.stats.activeServices ?? 0;

  const filteredQueue = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return queue;
    }

    return queue.filter(
      (entry) =>
        entry.ticket.toLowerCase().includes(value) ||
        entry.customer.toLowerCase().includes(value) ||
        entry.service.toLowerCase().includes(value) ||
        entry.status.toLowerCase().includes(value)
    );
  }, [queue, search]);

  const notify = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2800);
  };

  const handleLogout = async () => { try { await logout(); navigate("/login", { replace: true }); } catch (error) { notify(error.message); } };
  const perform = async (operation, success) => {
    if (busy) return;
    setBusy(true); setActionError("");
    try { const result = await operation(); await refresh(); notify(typeof success === "function" ? success(result) : success); return true; }
    catch (failure) { setActionError(failure.message); return false; }
    finally { setBusy(false); }
  };
  const callNext = () => perform(callNextApi, result => result ? "Now serving " + result.ticket : "No waiting customers in open services.");
  const completeCustomer = id => perform(() => completeApi(id), "Customer completed.");
  const toggleService = id => perform(() => toggleApi(id), "Service updated.");
  const addService = async event => {
    event.preventDefault();
    const ok = await perform(() => createService({ ...newService, averageWaitMinutes: Number(newService.averageWaitMinutes) }), "Service created.");
    if (ok) { setShowAddService(false); setNewService({ name: "", code: "", description: "", category: "General", averageWaitMinutes: 5 }); }
  };
  return (
    <main className="admin-page">
      {loading && <p role="status">Loading dashboard…</p>}
      {(error || actionError) && <p role="alert">{actionError || error} <button onClick={refresh}>Refresh</button></p>}
      {toast && (
        <div className="admin-toast">
          <span className="admin-toast-icon">✓</span>
          <span>{toast}</span>
        </div>
      )}

      <aside className="admin-sidebar">
        <button
          type="button"
          className="admin-brand"
          onClick={() => navigate("/admin")}
        >
          <span className="admin-logo">Q</span>

          <span className="admin-brand-name">
            Queue<strong>Less</strong>
          </span>
        </button>

        <p className="admin-label">MANAGEMENT</p>

        <nav className="admin-navigation">
          <button type="button" className="active">
            <span className="admin-nav-icon">⌂</span>
            Overview
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("queue-management")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="admin-nav-icon">◎</span>
            Queue Management
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("service-management")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="admin-nav-icon">▤</span>
            Services
          </button>
        </nav>

        <div className="admin-sidebar-status">
          <span className="sidebar-online-dot"></span>

          <div>
            <strong>System online</strong>
            <small>All services operational</small>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={handleLogout}
        >
          ← Sign out
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <p>QUEUELESS ADMIN</p>
            <h1>Operations Dashboard</h1>
          </div>

          <div className="admin-profile-wrapper">
            <button
              type="button"
              className="admin-profile"
              onClick={() =>
                setShowProfile((previous) => !previous)
              }
            >
              <span className="admin-avatar">A</span>

              <div>
                <strong>Administrator</strong>
                <small>{email}</small>
              </div>

              <span className="admin-profile-arrow">⌄</span>
            </button>

            {showProfile && (
              <div className="admin-profile-menu">
                <strong>QueueLess Administrator</strong>
                <span>{email}</span>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="admin-welcome">
          <div className="admin-welcome-content">
            <p>LIVE OPERATIONS</p>

            <h2>
              Manage queues.
              <span> Keep customers moving.</span>
            </h2>

            <div className="admin-system-live">
              <span className="system-live-dot"></span>

              <span className="system-live-text">
                Queue data refreshes every 5 seconds
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-hero-action"
            onClick={callNext} disabled={busy || loading}
          >
            Call next customer
            <span>→</span>
          </button>
        </section>

        <section className="admin-stats">
          <article>
            <div className="admin-stat-icon teal">◎</div>

            <div>
              <span>Currently waiting</span>
              <strong>{totalWaiting}</strong>
              <small>Across all queues</small>
            </div>
          </article>

          <article>
            <div className="admin-stat-icon blue">✓</div>

            <div>
              <span>Served today</span>
              <strong>{totalServed}</strong>
              <small>Completed customers</small>
            </div>
          </article>

          <article>
            <div className="admin-stat-icon purple">◷</div>

            <div>
              <span>Average wait</span>
              <strong>{averageWait} min</strong>
              <small>Across active services</small>
            </div>
          </article>

          <article>
            <div className="admin-stat-icon orange">▤</div>

            <div>
              <span>Active services</span>
              <strong>{activeServices}</strong>
              <small>Currently accepting queues</small>
            </div>
          </article>
        </section>

        <section
          className="admin-section"
          id="queue-management"
        >
          <div className="admin-section-heading">
            <div>
              <p>LIVE QUEUE</p>
              <h2>Queue management</h2>

              <span>
                Monitor customers and control queue progression.
              </span>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={callNext} disabled={busy || loading}
            >
              Call next
              <span>→</span>
            </button>
          </div>

          <div className="admin-queue-card">
            <div className="admin-table-tools">
              <div className="admin-search">
                <span className="admin-search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search ticket, customer, service or status..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>

              <span className="customer-count">
                {filteredQueue.length} customers
              </span>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Wait</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQueue.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong className="admin-ticket">
                          {entry.ticket}
                        </strong>
                      </td>

                      <td>{entry.customer}</td>

                      <td>{entry.service}</td>

                      <td>{entry.waiting} min</td>

                      <td>
                        <span
                          className={`admin-status admin-status-${entry.status.toLowerCase()}`}
                        >
                          <span className="admin-status-dot"></span>
                          <span className="admin-status-text">
                            {entry.status}
                          </span>
                        </span>
                      </td>

                      <td>
                        {entry.status === "SERVING" ? (
                          <button
                            type="button"
                            className="admin-complete-button" disabled={busy}
                            onClick={() =>
                              completeCustomer(entry.id)
                            }
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="admin-completed-text">
                            {entry.status === "COMPLETED" ? "Done" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredQueue.length === 0 && (
                <div className="admin-no-results">
                  <strong>No queue entries found</strong>

                  <span>
                    Try searching with another ticket,
                    customer or service.
                  </span>

                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className="admin-section"
          id="service-management"
        >
          <div className="admin-section-heading">
            <div>
              <p>SERVICES</p>
              <h2>Service management</h2>

              <span>
                Monitor queue load and control service
                availability.
              </span>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setShowAddService(true)}
            >
              + Add service
            </button>
          </div>

          <div className="admin-services-grid">
            {services.map((service) => (
              <article
                className="admin-service-card"
                key={service.id}
              >
                <div className="admin-service-top">
                  <span className="admin-service-code">
                    {service.code}
                  </span>

                  <span
                    className={`admin-service-status ${service.status.toLowerCase()}`}
                  >
                    {service.status}
                  </span>
                </div>

                <h3>{service.name}</h3>

                <div className="admin-service-data">
                  <div>
                    <span>Waiting</span>
                    <strong>{service.waiting}</strong>
                  </div>

                  <div>
                    <span>Served</span>
                    <strong>{service.served}</strong>
                  </div>

                  <div>
                    <span>Avg.</span>
                    <strong>{service.average}m</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className={
                    service.status === "CLOSED"
                      ? "open-service"
                      : ""
                  }
                  onClick={() =>
                    toggleService(service.id)
                  }
                >
                  {service.status === "CLOSED"
                    ? "Open service"
                    : "Close service"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer className="admin-footer">
          <span>© 2026 QueueLess Administration</span>
          <span>Digital Queue Management System</span>
        </footer>
      </section>

      {showAddService && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddService(false);
            }
          }}
        >
          <form
            className="admin-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}
            onSubmit={addService}
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setShowAddService(false)}
            >
              ×
            </button>

            {actionError && <p role="alert">{actionError}</p>}
            <div className="admin-modal-icon">+</div>

            <p>NEW SERVICE</p>

            <h2>Add queue service</h2>

            <span>
              Create another queue category for customers.
            </span>

            <label>
              Service name

              <input
                type="text"
                required maxLength={120} placeholder="Example: Consultation"
                value={newService.name}
                onChange={(event) =>
                  setNewService((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Queue code

              <input
                type="text"
                required maxLength="10" pattern="[A-Za-z0-9]+"
                placeholder="Example: F"
                value={newService.code}
                onChange={(event) =>
                  setNewService((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
              />
            </label>

            <label>Description<input required maxLength={255} value={newService.description} onChange={event => setNewService(current => ({...current, description: event.target.value}))} /></label>
            <label>Category<input required maxLength={60} value={newService.category} onChange={event => setNewService(current => ({...current, category: event.target.value}))} /></label>
            <label>Minutes per customer<input required type="number" min="1" max="120" value={newService.averageWaitMinutes} onChange={event => setNewService(current => ({...current, averageWaitMinutes: event.target.value}))} /></label>
            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setShowAddService(false)}
              >
                Cancel
              </button>

              <button type="submit" disabled={busy}>
                Add service
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default AdminDashboardPage;