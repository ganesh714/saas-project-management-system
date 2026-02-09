# Research & Requirements Analysis

## 1. Multi-Tenancy Analysis

### Approaches to Multi-Tenancy

Multi-tenancy is a software architecture where a single instance of software serves multiple tenants. In our case, a "tenant" is an organization. There are three main approaches:

1.  **Shared Database, Shared Schema (Discriminator Column)**
    *   **Description:** All tenants share the same database and tables. A `tenant_id` column acts as a discriminator to segregate data.
    *   **Pros:** Lowest cost, easiest to maintain, easiest to enable cross-tenant analytics (if needed by super admin), simple deployment.
    *   **Cons:** Strict application-level security required (risk of data leakage if `WHERE tenant_id` is missed), harder to backup/restore single tenant data.

2.  **Shared Database, Separate Schemas**
    *   **Description:** All tenants share the same database, but each tenant has their own schema (namespace).
    *   **Pros:** Better isolation than shared schema, easier to backup/restore single tenant.
    *   **Cons:** Higher complexity in migration management (must migrate N schemas), potential overhead with many schemas.

3.  **Separate Databases**
    *   **Description:** Each tenant has their own dedicated database instance.
    *   **Pros:** Highest isolation (physical separation), best security.
    *   **Cons:** Highest cost (infrastructure), complex management and maintenance, difficult to scale to thousands of small tenants efficiently.

### Comparison Table

| Feature | Shared Schema | Separate Schema | Separate Database |
| :--- | :--- | :--- | :--- |
| **Isolation** | Low (Logical) | Medium (Schema) | High (Physical) |
| **Cost** | Low | Low/Medium | High |
| **Complexity** | Low | Medium | High |
| **scalability** | High (for many small tenants) | Medium | Low (limit on DB connections) |
| **Development** | Easy (Standard SQL) | Moderate (Schema switching) | Hard (Connection management) |

### Chosen Approach: Shared Database + Shared Schema

**Justification:**
For this project, we are choosing **Shared Database with Shared Schema** (Approach 1).
*   **Reason 1: Complexity vs. Time:** This approach is the most feasible to implement firmly within the scope of a single-developer project while still meeting the strict "Data Isolation" requirement via careful application logic (Middleware).
*   **Reason 2: Docker Constraints:** Running multiple databases or managing dynamic schema creation inside a Docker container setup for a submission is cleaner with a single schema structure.
*   **Reason 3: Modern ORM/SQL support:** Modern tools make it easy to enforce `tenant_id` checks.
*   **Implementation:** We will use a `tenant_id` foreign key on every table (users, projects, tasks) and enforce it via middleware and repository patterns.

## 2. Technology Stack Justification

### Backend: Node.js + Express
*   **Why:** Non-blocking I/O is excellent for API servers handling many concurrent requests. Express is the industry standard for Node.js, offering a vast ecosystem of middleware (CORS, Auth, Logging).
*   **Alternatives:** Python/Django (too heavy), Go (higher learning curve for this specific timeframe).

### Frontend: React + Vite
*   **Why:** React is component-based, making it perfect for the interactive dashboard requirements. Vite is chosen for its superior build speed compared to Create React App.
*   **Alternatives:** Vue (less community resources), Angular (too much boilerplate).

### Database: PostgreSQL
*   **Why:** robust relational database with strong ACID compliance, crucial for multi-tenant data integrity. Supports JSONB if we need flexible data later.
*   **Alternatives:** MySQL (less strict), MongoDB (NoSQL not ideal for the relational nature of Tenants -> Users -> Projects).

### Authentication: JWT (JSON Web Tokens)
*   **Why:** Stateless authentication scales well. It fits the "Restful API" requirement perfectly without needing server-side session storage (Redis/DB).
*   **Mechanism:** Token contains `userId`, `tenantId`, and `role`.

### Deployment: Docker
*   **Why:** Mandatory requirement. Ensures the application runs identically on the evaluator's machine.

## 3. Security Considerations

1.  **Row-Level Isolation (Application Side):**
    *   Every SQL query MUST include `WHERE tenant_id = $1`. We will implement a wrapper/middleware that injects this automatically where possible, or rigorous code reviews to ensure it's never missed.
    *   **Critical:** Super Admins are the only exception.

2.  **Authentication & Authorization:**
    *   **JWT:** Signed with a strong secret. 24h expiry as requested.
    *   **Passwords:** Hashed using `bcrypt` or `argon2`. Never stored in plain text.
    *   **RBAC:** Middleware will check `req.user.role` before allowing access to sensitive routes (e.g., only `tenant_admin` can add users).

3.  **Data Isolation Strategy:**
    *   Logical isolation using `tenant_id`.
    *   Foreign Key constraints to ensure no orphaned data.
    *   API Input Validation: Ensure users cannot pass a `tenant_id` in the body to spoof another tenant; the `tenant_id` should effectively come from the authenticated token (or the URL for Super Admins).

4.  **API Security:**
    *   **Rate Limiting:** Prevent abuse.
    *   **CORS:** Configured to allow only the specific frontend domain/port.
    *   **Input Sanitization:** Prevent SQL injection using parameterized queries (pg library handles this).

5.  **Environment Security:**
    *   Secrets (DB passwords, JWT keys) are strictly kept in Environment Variables, not hardcoded.
