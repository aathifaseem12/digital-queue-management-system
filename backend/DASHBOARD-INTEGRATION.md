# Member 2 dashboard API integration

Both existing React dashboards now read and mutate real Spring Boot/MySQL data. Their layouts and CSS are preserved. Authentication remains session based; all requests include credentials and every POST fetches a fresh CSRF token through the shared client.

## API flow

User dashboard loads `GET /api/services` and `GET /api/queues/me`, then refreshes every five seconds. Joining uses `POST /api/queues/join` with `serviceId`; leaving uses `POST /api/queues/leave`. A missing current queue returns 204. Tickets, positions, people ahead and estimated waits come from the server. Closed services remain visible but cannot be joined. One user can have only one WAITING or SERVING entry.

Admin dashboard loads `GET /api/admin/services`, `/api/admin/queues` and `/api/admin/stats`. It calls `POST /api/admin/queues/call-next`, `/api/admin/queues/{id}/complete`, `/api/admin/services`, and `/api/admin/services/{id}/toggle`. Creating a service requires an alphanumeric code (maximum 10 characters), name, description, category and minutes per customer (1–120). Empty call-next returns 204. Queue conflicts return JSON with a useful `message` and 409 status.

## Database and queue rules

Flyway V2 creates `queue_services` and `queue_entries` and seeds six services. V1 `auth_accounts` is unchanged. A nullable unique active-user email prevents duplicate active tickets. Ticket numbers combine the service code and globally increasing entry ID; IDs are not daily counters.

Queue mutations acquire service rows in a consistent order within transactions. The current design has one serving customer across the whole dashboard. Call-next selects the oldest waiting ticket in an open service and refuses to proceed until the serving customer is completed or leaves. Completed and cancelled entries remain in admin history. Closing a service pauses its waiting customers; reopening makes them eligible again.

Position and people ahead are calculated within a service. Wait estimates use the service's configured minutes per customer, not a learned prediction. Dashboard average wait is the mean estimated wait of current WAITING customers; service-card average is the configured minutes per customer. Served-today counts use Asia/Colombo midnight.

## Files

- Backend queue package: entities, repositories, operations, user/admin controllers and queue error handler.
- `V2__queue_services_and_entries.sql` and `QueueIntegrationTests.java`.
- Frontend `api/client.js`, `api/queues.js`, `api/useDashboard.js`; auth helper delegates to the shared client.
- Existing `DashboardPage.jsx` and `AdminDashboardPage.jsx`: mock arrays removed, real operations, loading/error states and polling added.

## Verification completed — 2026-10-06

- Full backend suite: 15 tests, zero failures/errors, against isolated H2 and real MySQL 8.4 `queueless_test` on port 3307. Includes duplicate-join and call-next concurrency, queue lifecycle, closed services, stats, validation, ownership, roles and CSRF. Existing auth tests include public registration creating USER only.
- Backend executable package built successfully. Stop a running process using the target JAR before packaging on Windows.
- Flyway V2 applied successfully to both `queueless_test` and application database `queueless`.
- Frontend lint and production build passed without warnings.
- Live browser: registration/login, database services, joining, disabled second join, ticket persistence after reload, leaving, USER admin-route redirect, database ADMIN login, queue list, call-next, serving conflict message, completion, service creation and close/reopen.
- Live HTTP: USER admin APIs return 403; a second active queue returns 409. Temporary browser accounts/entries/service were removed after verification.

Default backend tests use the test profile with H2: `./mvnw test`. To repeat MySQL tests use the dedicated disposable test database and datasource environment variables described in `AUTH-INTEGRATION.md`. Tests delete their test data; never point them at the application database. Credentials stay outside Git.

## Team handoff

Member 1 and Member 2 should pull the latest main before starting clean work, inspect the queue package and these API contracts, and coordinate before changing shared authentication or migrations. Preserve existing uncommitted changes before pulling or switching branches. Test, review, commit and push feature branches after meaningful work; merge through team review. Do not recreate V2 or modify it after it has been applied; use a new migration.

Future work: team review/merge, multi-counter support if required, pagination for growing queue history, notification delivery, persistent remember-me, password recovery and deployment configuration. The current dashboards use five-second polling.
