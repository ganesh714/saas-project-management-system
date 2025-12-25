# Multi-Tenancy Research & Technology Stack

## 1. Multi-Tenancy Approach Analysis

For this SaaS platform, we evaluated three common database isolation strategies:

### Option A: Database-per-Tenant
* **Pros:** Highest security/isolation. Easy backup/restore per tenant.
* **Cons:** High infrastructure cost. Difficult to maintain schema updates across thousands of DBs. Resource inefficient for small tenants.
* **Verdict:** Rejected. Overkill for this MVP scale.

### Option B: Schema-per-Tenant (Shared Database)
* **Pros:** Good logical isolation. Shared resources.
* **Cons:** difficult to query across tenants (Analytics). Migration complexity increases with tenant count.
* **Verdict:** Rejected. Adds complexity to ORM configuration without significant security gains over Row-Level logic for this use case.

### Option C: Shared Schema (Row-Level Security) - **CHOSEN**
* **Pros:** Easiest to scale. Simple schema management. Efficient resource usage.
* **Cons:** Risk of data leakage if application logic fails.
* **Mitigation:** We implemented a strict **Middleware-Level Isolation** strategy. Every API request passes through a `tenantHandler` which injects the `tenant_id` into the Sequelize query context. This ensures that developers cannot accidentally query data without a tenant scope.

## 2. Technology Stack Justification

### Backend: Node.js + Express
* **Why:** Non-blocking I/O is ideal for real-time SaaS applications.
* **Ecosystem:** Rich library support for JWT (jsonwebtoken) and Validation (Joi).

### Database: PostgreSQL
* **Why:** Mandatory requirement. Superior to MySQL for complex queries.
* **ORM:** Sequelize was chosen for its robust migration support and easy relationship handling (Tenant -> Projects -> Tasks).

### Frontend: React
* **Why:** Component-based architecture allows for reusable UI elements (Task Cards, Project Tables).
* **State Management:** Context API is sufficient for auth state without the overhead of Redux.

### Containerization: Docker
* **Why:** Ensures the "works on my machine" guarantee. Mandatory for the assignment.
* **Orchestration:** Docker Compose manages the startup order (DB -> Backend -> Frontend) automatically.