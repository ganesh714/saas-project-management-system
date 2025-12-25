# Multi-Tenant SaaS Platform Research Document

## 1. Multi-Tenancy Architecture Analysis

Multi-tenancy is the foundational architecture where a single instance of a software application serves multiple customers (tenants). Each tenant's data must remain isolated and invisible to other tenants. Choosing the right multi-tenancy model is a critical architectural decision that impacts scalability, cost, and maintenance.

We have analyzed the three primary models for database multi-tenancy:

### 1.1 Approach 1: Separate Database per Tenant
In this model, each tenant is provisioned their own completely separate database instance. The application maintains a catalog of which database connection string belongs to which tenant.

**Pros:**
*   **Ultimate Isolation:** Data leakage between tenants is virtually impossible at the database layer.
*   **Security:** High-security compliance (e.g., HIPAA, GDPR) is easier to achieve.
*   **Backup/Restore:** Allows for "Point-in-Time" recovery for a specific tenant without affecting others.
*   **No "Noisy Neighbor" Effect:** Resource usage by one tenant does not impact the query performance of others.

**Cons:**
*   **Maintenance Nightmare:** Running migrations (schema updates) requires iterating through potentially thousands of databases. If a migration fails on DB #500, the system enters an inconsistent state.
*   **Infrastructure Cost:** High resource overhead. Each database consumes memory and connection pools, even for idle tenants.
*   **Scalability:** Connection pooling becomes a bottleneck on the database server as the number of tenants grows.

### 1.2 Approach 2: Shared Database, Separate Schema
Here, all tenants share a single database instance, but each tenant gets their own named **Schema** (namespace) within that database.

**Pros:**
*   **Good Isolation:** Logical separation is enforced at the schema level.
*   **Shared Resources:** More cost-effective than separate databases; connection pools are shared.
*   **Manageability:** Backups can still be somewhat granular (schema-level dumps).

**Cons:**
*   **Migration Complexity:** Similar to the separate database model, schema changes must be applied to every schema individually.
*   **Cross-Tenant Analytics:** Aggregating data across tenants (e.g., for a "Super Admin" dashboard) is difficult and often requires complex Union queries.

### 1.3 Approach 3: Shared Database, Shared Schema (Tenant Discriminator)
In this model, all tenants share the same database and the same tables. Every table containing tenant-specific data has a `tenant_id` column (the discriminator).

**Pros:**
*   **Lowest Cost:** Maximizes resource utilization. Best for "Freemium" models where many tenants might be small or inactive.
*   **Simplicity:** Only one database to maintain, back up, and migrate.
*   **Standard Tooling:** Works out-of-the-box with standard ORMs and reporting tools.
*   **Easy Analytics:** Cross-tenant reporting is as simple as running a query without the `tenant_id` filter (for Super Admins).

**Cons:**
*   **Isolation Risk:** Relies entirely on the application code to enforce security. A developer forgetting a `WHERE tenant_id = ?` clause causes data leakage.
*   **Backup Difficulty:** restoring a single tenant's data is complex; requires extracting specific rows.

### 1.4 Comparison Table

| Feature | Separate Database | Separate Schema | Shared Schema (Discriminator) |
| :--- | :--- | :--- | :--- |
| **Isolation Level** | Highest (Physical) | High (Logical) | Medium (Application Level) |
| **Infrastructure Cost** | High | Medium | **Low** |
| **Scalability (Tenants)** | Low (Resource intensive) | Medium | **High** |
| **Migration Complexity**| High | High | **Low** |
| **Development Speed** | Slow (Complex DevOps) | Medium | **Fast** |
| **Data Leakage Risk** | Near Zero | Low | Moderate (Requires safeguards) |

### 1.5 Chosen Approach & Justification
For this project, we have selected **Approach 3: Shared Database, Shared Schema**.

**Justification:**
1.  **Cost Efficiency:** As a SaaS platform offering a "Free Tier," we expect a high volume of low-activity tenants. Spinning up a database per free user is financially unviable.
2.  **MVP Velocity:** The shared schema approach simplifies the initial development and deployment pipeline. We only need to manage one set of migrations.
3.  **Modern Mitigation:** The main risk (Data Leakage) is mitigated by enforcing **Middleware-Level Isolation**. We do not rely on developers manually adding filters. Instead, a global interceptor in our ORM and API layer automatically injects the `tenant_id` into every query context, ensuring data safety.
4.  **Tech Stack Fit:** PostgreSQL handles large tables with millions of rows efficiently, especially when properly indexed on the `tenant_id` column.

---

## 2. Technology Stack Justification

### 2.1 Backend: Node.js & Express
We chose **Node.js** over alternatives like Python (Django/Flask) or Java (Spring Boot).
*   **Non-Blocking I/O:** Node's event-driven architecture handles high concurrency with low overhead, making it ideal for the I/O-heavy nature of a project management tool (many small read/write requests).
*   **Unified Language:** Using JavaScript/TypeScript on both frontend and backend reduces context switching for developers and allows code sharing (e.g., validation schemas, types).
*   **Ecosystem:** The NPM ecosystem provides robust, battle-tested libraries for multi-tenancy requirements, such as `jsonwebtoken` for auth, `sequelize` for ORM, and `winston` for logging.

### 2.2 Frontend: React
We chose **React** (via Vite) over Angular or Vue.
*   **Component Architecture:** The UI requirements (Kanban boards, project lists, dashboards) are highly interactive and component-driven. React's reusable component model speeds up development.
*   **Performance:** The Virtual DOM ensures that real-time updates (e.g., dragging a task ticket) are rendered efficiently without repainting the entire page.
*   **State Management:** React's Context API provides a lightweight solution for managing global state like "Current Tenant" and "User Profile," avoiding the complexity of Redux for this scope.

### 2.3 Database: PostgreSQL
We chose **PostgreSQL** over MySQL or NoSQL (MongoDB).
*   **Relational Integrity:** A Project Management System relies on strict relationships (Tenants → Users → Projects → Tasks). Relational databases enforce these constraints (Foreign Keys, CASCADE deletes) natively, ensuring data consistency.
*   **JSONB Support:** PostgreSQL offers best-in-class support for storing unstructured data (e.g., flexible task metadata or logs) alongside structured relational data.
*   **Row-Level Security (RLS):** While we are implementing isolation at the application layer, Postgres has native RLS capabilities that can be leveraged in the future for "Defense in Depth."

### 2.4 DevOps: Docker & Docker Compose
*   **Reproducibility:** Docker ensures the application runs exactly the same on a developer's Localhost as it does in production. This eliminates "it works on my machine" issues.
*   **Isolation:** Each service (Backend, Frontend, DB) runs in its own container, preventing dependency conflicts.
*   **Orchestration:** Docker Compose is mandatory for this project to ensure the complex multi-service architecture can be spun up with a single command (`docker-compose up -d`), greatly simplifying the evaluation and deployment process.

---

## 3. Security Considerations

Building a multi-tenant platform requires a "Security First" mindset. Failure here leads to the worst possible outcome: data co-mingling.

### 3.1 Data Isolation Strategy
This is the most critical security requirement.
*   **Tenant Context:** Upon every request, a middleware intercepts the JWT token, verifies it, extracts the `tenant_id`, and attaches it to the request object (`req.tenantId`).
*   **Query Injection:** All database Service layers are designed to require `tenantId` as a mandatory argument. The ORM configuration is set to reject queries that do not have a `where: { tenantId }` clause (where applicable), acting as a fail-safe.
*   **Validation:** Input validation (via Joi) ensures that a user cannot spoof a `tenant_id` in the request body. We implicitly trust the token, not the user input.

### 3.2 Authentication & Authorization (RBAC)
*   **JWT (JSON Web Tokens):** We use stateless authentication. The token payload contains `{ userId, tenantId, role }`. This avoids database lookups for every request to check session validity.
*   **Role-Based Access Control:**
    *   **Super Admin:** Has global access (tenantId is null). Can manage subscriptions.
    *   **Tenant Admin:** Can manage users and projects within their tenant.
    *   **User:** Can only manage tasks assigned to them to view projects they are part of.
    *   *Implementation:* Middleware checks `req.user.role` against allowed roles for each endpoint.

### 3.3 Data Protection
*   **Password Hashing:** Passwords are never stored in plain text. We use **Bcrypt** with a salt round of 10. This makes rainbow table attacks infeasible.
*   **HTTPS/TLS:** In production, all traffic must be encrypted.
*   **Environment Variables:** Sensitive secrets (DB passwords, JWT secrets) are injected via Docker environment variables, never hardcoded in the source.

### 3.4 API Security (Hardening)
*   **Rate Limiting:** We implement `express-rate-limit` to prevent brute-force attacks on login endpoints and DDoS attacks on public APIs.
*   **Helmet:** We use the `helmet` middleware to set secure HTTP headers (e.g., HSTS, X-Frame-Options, X-XSS-Protection) to prevent common browser vulnerabilities like Clickjacking.
*   **CORS (Cross-Origin Resource Sharing):** Strictly configured to allow requests only from the trusted frontend domain/container, blocking malicious scripts from other sites.