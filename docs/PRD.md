# Product Requirements Document (PRD)

## 1. User Personas

### 1.1 Super Admin
-   **Description:** System-level administrator with improved privileges.
-   **Key Responsibilities:** Manage tenants, oversee system health, manage subscription plans.
-   **Goals:** Ensure platform stability, manage billing/subscriptions, support tenants.
-   **Pain Points:** Lack of visibility into tenant usage, manual onboarding processes.

### 1.2 Tenant Admin
-   **Description:** Administrator for a specific organization (Tenant).
-   **Key Responsibilities:** Manage users within their organization, configure project settings, billing.
-   **Goals:** Efficiently manage team access, track organization productivity.
-   **Pain Points:** Difficulty in managing user roles, data leaks to other teams.

### 1.3 End User
-   **Description:** Regular team member working on projects.
-   **Key Responsibilities:** Create and complete tasks, collaborate on projects.
-   **Goals:** Complete assigned work, track progress, communicate with team.
-   **Pain Points:** Clunky interface, unclear priorities, difficult to find tasks.

## 2. Functional Requirements

### Authentication & Tenant Management
-   **FR-001:** The system shall allow new organizations to register as tenants with a unique subdomain.
-   **FR-002:** The system shall allow users to login using email, password, and tenant subdomain/ID.
-   **FR-003:** The system shall support JWT-based stateless authentication with 24-hour expiry.
-   **FR-004:** The system shall allow Super Admins to view and manage all registered tenants.
-   **FR-005:** The system shall enforce subscription plan limits (Users/Projects) during resource creation.

### User Management
-   **FR-006:** The system shall allow Tenant Admins to invite/create new users within their tenant.
-   **FR-007:** The system shall support three roles: Super Admin, Tenant Admin, and User.
-   **FR-008:** The system shall prevent users from accessing data outside their assigned tenant.
-   **FR-009:** The system shall allow users to view their own profile details.

### Project Management
-   **FR-010:** The system shall allow users to create new projects with name, description, and status.
-   **FR-011:** The system shall list all projects belonging to the user's tenant.
-   **FR-012:** The system shall allow updating project details and status (Active, Archived, Completed).
-   **FR-013:** The system shall allow soft-deletion or archiving of projects.

### Task Management
-   **FR-014:** The system shall allow users to create tasks within a project.
-   **FR-015:** The system shall allow assigning tasks to users within the same tenant.
-   **FR-016:** The system shall allow updating task status (Todo, In Progress, Completed) and priority.
-   **FR-017:** The system shall provide a filtered view of tasks based on status, assignee, or priority.

### Audit & Security
-   **FR-018:** The system shall log critical actions (Create, Update, Delete) to an audit log.

## 3. Non-Functional Requirements

-   **NFR-001 (Performance):** API response time should be under 200ms for 90% of requests.
-   **NFR-002 (Security):** All passwords must be hashed using robust algorithms (e.g., bcrypt).
-   **NFR-003 (Scalability):** The system must support at least 100 concurrent users per tenant.
-   **NFR-004 (Availability):** The system should aim for 99.9% uptime during business hours.
-   **NFR-005 (Usability):** The application must be responsive and usable on mobile devices.
-   **NFR-006 (Compliance):** Data isolation must be strictly enforced at the database query level.
