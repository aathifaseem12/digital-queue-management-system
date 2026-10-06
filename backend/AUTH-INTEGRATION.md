# Member 2 authentication integration
Existing Member 1 code was a Spring Boot starter only. Authentication is isolated in com.group2.backend.auth and auth_accounts; queue/service modules can build independently.

## Local setup
Use JDK 21 and MySQL 8. Create database queueless and a dedicated database user with migration permissions. Set DB_PASSWORD, optionally DB_URL and DB_USERNAME, in the backend process environment. No secrets belong in Git.
Run .\mvnw.cmd spring-boot:run from backend. Flyway creates auth_accounts; Hibernate validates it.
From frontend run npm run dev. VITE_API_URL defaults to http://localhost:8080; FRONTEND_ORIGIN defaults to http://localhost:5173. Match both origins to your environment.
For HTTPS deployments set COOKIE_SECURE=true. This session configuration assumes frontend/API are same-site. Remember-me persistence is not implemented.

## API contract
GET /api/auth/csrf returns token and headerName. Send that header and credentials: include for all POST requests.
POST /api/auth/register accepts fullName, email, password; creates USER only and returns 201 with id/fullName/email/role.
POST /api/auth/login accepts email/password; establishes an HttpOnly session and returns database role.
GET /api/auth/me returns the authenticated profile; anonymous requests return 401.
POST /api/auth/logout invalidates the session, returns 204. Fetch a fresh CSRF token after login/logout.
Duplicate normalized emails return 409; invalid credentials return 401; validation returns 400.
Passwords use BCrypt, limited to 72 UTF-8 bytes. Password hashes never appear in responses.
Public registration cannot grant ADMIN. Provision admins by an authorized database operation on a registered account. No default admin password is shipped.
All /api/admin/** endpoints require ADMIN on the server. All other new endpoints require authentication by default.

## Verification
Run .\mvnw.cmd test and npm run build. With MySQL running: register, retry with case-varied email (409), log in with a wrong password (401), log in correctly, reload dashboard, verify /me, log out, then verify /me returns 401. Verify USER cannot access admin endpoints.
Dashboard queue/service APIs are integrated. See DASHBOARD-INTEGRATION.md for the implemented contract and verification results.

## Team Git rule
Pull before work: git switch main, git pull --ff-only origin main, git fetch --all --prune.
Work on a feature branch; after meaningful work run tests/build, review git diff, then commit and push the feature branch. Merge through team review.
The existing local admin dashboard commit was ahead of origin/main when integration started; preserve it when reviewing/merging this branch.

### MySQL setup example
Run these as an authorized MySQL administrator, choosing your own local password:

```sql
CREATE DATABASE queueless CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'queueless'@'localhost' IDENTIFIED BY '<your-local-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON queueless.* TO 'queueless'@'localhost';
```

In the same PowerShell window that starts the backend:

```powershell
$env:JAVA_HOME = '<path-to-JDK-21>'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:DB_PASSWORD = '<your-local-password>'
cd backend
.\mvnw.cmd spring-boot:run
```

Registration returns to login only after the database write succeeds. Login uses the database role regardless of the visual role selector. Remember-me is disabled until persistent sessions are implemented.
The test profile uses an isolated H2 database in MySQL mode and runs the same Flyway migration. Live MySQL verification was completed on 2026-10-06; see the results below.
Session persistence explicitly saves Spring Security's context, following https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html.
## Verification completed
Java 21 backend package passed: 6 tests, 0 failures/errors, against real MySQL 8.4 on 2026-10-06. The Flyway migration applied and Hibernate validated the schema. Live HTTP checks passed for registration, validation, duplicate emails, password hashing in MySQL, login, session restoration, USER admin restrictions, database ADMIN roles, and logout. Browser preflight allows the configured React origin and credentials; other origins are rejected. Frontend lint and production build passed on the unchanged React implementation.
A compatible Java 21 compiler is available in C:\Users\malha\.vscode\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64 (set JAVA_HOME to that directory for this machine).

## Repeating real MySQL tests
Use a dedicated disposable test database. The test suite deletes accounts in the configured database before each test.

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:mysql://127.0.0.1:3307/queueless_test'
$env:SPRING_DATASOURCE_USERNAME = 'queueless'
$env:SPRING_DATASOURCE_PASSWORD = $env:DB_PASSWORD
.\mvnw.cmd test
Remove-Item Env:SPRING_DATASOURCE_URL, Env:SPRING_DATASOURCE_USERNAME, Env:SPRING_DATASOURCE_PASSWORD
```

Use your own server port and credentials. Default tests continue to use H2 unless datasource environment variables override them.

## This computer's local setup
A separate MySQL 8.4 instance runs on 127.0.0.1:3307. The existing MySQL80 service on its original port was preserved. Databases: queueless (application) and queueless_test (automated tests).
Credentials and data are outside this Git repository; credentials are encrypted for the current Windows user. No database passwords were committed.
The local startup helper is C:\Users\malha\.codex\.chatgpt-projects\g-p-6ab8c962f8c08191a05f3aecf711026a\start-queueless-backend.ps1. Run it in PowerShell to start the database and API using the saved credentials, then run npm run dev from frontend.
For another machine, follow the normal MySQL setup above. No test account remains in the application database after the live checks.