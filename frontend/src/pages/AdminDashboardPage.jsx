import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const initialServices = [
  {
    id: 1,
    code: "A",
    name: "General Service",
    waiting: 4,
    served: 28,
    average: 8,
    status: "OPEN",
  },
  {
    id: 2,
    code: "B",
    name: "Document Verification",
    waiting: 7,
    served: 19,
    average: 14,
    status: "OPEN",
  },
  {
    id: 3,
    code: "C",
    name: "Payment Counter",
    waiting: 2,
    served: 34,
    average: 5,
    status: "OPEN",
  },
  {
    id: 4,
    code: "D",
    name: "Registration Desk",
    waiting: 10,
    served: 16,
    average: 20,
    status: "BUSY",
  },
];

const initialQueue = [
  {
    id: 1,
    ticket: "A-17",
    customer: "Mohamed Rizwan",
    service: "General Service",
    waiting: 7,
    status: "WAITING",
  },
  {
    id: 2,
    ticket: "B-23",
    customer: "Nimal Perera",
    service: "Document Verification",
    waiting: 12,
    status: "WAITING",
  },
  {
    id: 3,
    ticket: "C-11",
    customer: "Fathima Azeez",
    service: "Payment Counter",
    waiting: 4,
    status: "SERVING",
  },
  {
    id: 4,
    ticket: "D-31",
    customer: "Kasun Silva",
    service: "Registration Desk",
    waiting: 18,
    status: "WAITING",
  },
];

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "admin@queueless.com";

  const [services, setServices] = useState(initialServices);
  const [queue, setQueue] = useState(initialQueue);

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showAddService, setShowAddService] = useState(false);

  const [newService, setNewService] = useState({
    name: "",
    code: "",
  });

  const totalWaiting = useMemo(
    () =>
      queue.filter((entry) => entry.status === "WAITING").length,
    [queue]
  );

  const totalServed = useMemo(
    () => services.reduce((total, item) => total + item.served, 0),
    [services]
  );

  const averageWait = useMemo(() => {
    if (services.length === 0) {
      return 0;
    }

    const total = services.reduce(
      (sum, service) => sum + service.average,
      0
    );

    return Math.round(total / services.length);
  }, [services]);

  const activeServices = useMemo(
    () =>
      services.filter((service) => service.status !== "CLOSED").length,
    [services]
  );

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

  const callNext = () => {
    const nextCustomer = queue.find(
      (entry) => entry.status === "WAITING"
    );

    if (!nextCustomer) {
      notify("There are no waiting customers.");
      return;
    }

    setQueue((current) =>
      current.map((entry) => {
        if (entry.status === "SERVING") {
          return {
            ...entry,
            status: "COMPLETED",
          };
        }

        if (entry.id === nextCustomer.id) {
          return {
            ...entry,
            status: "SERVING",
          };
        }

        return entry;
      })
    );

    notify(`Now serving ${nextCustomer.ticket}`);
  };

  const completeCustomer = (id) => {
    setQueue((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: "COMPLETED",
            }
          : entry
      )
    );

    notify("Customer marked as completed.");
  };

  const toggleService = (id) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id
          ? {
              ...service,
              status:
                service.status === "CLOSED"
                  ? "OPEN"
                  : "CLOSED",
            }
          : service
      )
    );
  };

  const addService = (event) => {
    event.preventDefault();

    if (!newService.name.trim() || !newService.code.trim()) {
      notify("Enter a service name and queue code.");
      return;
    }

    setServices((current) => [
      ...current,
      {
        id: Date.now(),
        code: newService.code
          .trim()
          .toUpperCase()
          .slice(0, 2),
        name: newService.name.trim(),
        waiting: 0,
        served: 0,
        average: 0,
        status: "OPEN",
      },
    ]);

    setNewService({
      name: "",
      code: "",
    });

    setShowAddService(false);

    notify("New queue service added.");
  };

  return (
    <main className="admin-page">
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
          onClick={() => navigate("/login")}
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
                  onClick={() => navigate("/login")}
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
                Real-time queue monitoring active
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-hero-action"
            onClick={callNext}
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
              onClick={callNext}
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
                        {entry.status !== "COMPLETED" ? (
                          <button
                            type="button"
                            className="admin-complete-button"
                            onClick={() =>
                              completeCustomer(entry.id)
                            }
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="admin-completed-text">
                            Done
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
            className="admin-modal"
            onSubmit={addService}
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setShowAddService(false)}
            >
              ×
            </button>

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
                placeholder="Example: Consultation"
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
                maxLength="2"
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

            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setShowAddService(false)}
              >
                Cancel
              </button>

              <button type="submit">
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