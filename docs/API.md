# API Documentation

This document details the API endpoints for the Multi-Tenant SaaS Platform.

## Authentication

### 1. Tenant Registration
*   **Endpoint**: `POST /api/auth/register-tenant`
*   **Auth**: Public
*   **Description**: Registers a new tenant and creates the initial tenant admin user.
*   **Request Body**:
    ```json
    {
      "tenantName": "New Company",
      "subdomain": "newco",
      "adminEmail": "admin@newco.com",
      "adminPassword": "Password123!",
      "adminFullName": "Admin User"
    }
    ```
*   **Response (201)**:
    ```json
    {
      "success": true,
      "data": { "tenantId": "...", "subdomain": "newco", ... }
    }
    ```

### 2. User Login
*   **Endpoint**: `POST /api/auth/login`
*   **Auth**: Public
*   **Description**: Authenticates a user within a specific tenant context.
*   **Request Body**:
    ```json
    {
      "email": "admin@newco.com",
      "password": "Password123!",
      "tenantSubdomain": "newco"
    }
    ```
*   **Response (200)**: returns JWT token.

### 3. Get Current User
*   **Endpoint**: `GET /api/auth/me`
*   **Auth**: Bearer Token
*   **Description**: Returns the currently authenticated user's profile and tenant info.

### 4. Logout
*   **Endpoint**: `POST /api/auth/logout`
*   **Auth**: Bearer Token
*   **Description**: Logs out the user (client-side token removal).

## Tenant Management

### 5. Get Tenant Details
*   **Endpoint**: `GET /api/tenants/:tenantId`
*   **Auth**: Tenant Admin or Super Admin
*   **Description**: GET details and statistics for a tenant.

### 6. Update Tenant
*   **Endpoint**: `PUT /api/tenants/:tenantId`
*   **Auth**: Tenant Admin (Name only) or Super Admin (All fields)

### 7. List All Tenants
*   **Endpoint**: `GET /api/tenants`
*   **Auth**: Super Admin Only
*   **Description**: Lists all tenants with pagination.

## User Management

### 8. Add User
*   **Endpoint**: `POST /api/tenants/:tenantId/users`
*   **Auth**: Tenant Admin
*   **Request Body**:
    ```json
    {
      "email": "user@newco.com",
      "password": "UserPass123",
      "fullName": "Regular User",
      "role": "user"
    }
    ```

### 9. List Users
*   **Endpoint**: `GET /api/tenants/:tenantId/users`
*   **Auth**: Tenant Member

### 10. Update User
*   **Endpoint**: `PUT /api/users/:userId`
*   **Auth**: Tenant Admin

### 11. Delete User
*   **Endpoint**: `DELETE /api/users/:userId`
*   **Auth**: Tenant Admin

## Project Management

### 12. Create Project
*   **Endpoint**: `POST /api/projects`
*   **Auth**: Tenant Member
*   **Request Body**:
    ```json
    {
      "name": "Project X",
      "description": "Top secret"
    }
    ```

### 13. List Projects
*   **Endpoint**: `GET /api/projects`
*   **Auth**: Tenant Member

### 14. Update Project
*   **Endpoint**: `PUT /api/projects/:projectId`
*   **Auth**: Project Creator or Tenant Admin

### 15. Delete Project
*   **Endpoint**: `DELETE /api/projects/:projectId`
*   **Auth**: Project Creator or Tenant Admin

## Task Management

### 16. Create Task
*   **Endpoint**: `POST /api/projects/:projectId/tasks`
*   **Auth**: Tenant Member
*   **Request Body**:
    ```json
    {
      "title": "Design Logo",
      "priority": "high",
      "dueDate": "2024-12-31"
    }
    ```

### 17. List Tasks
*   **Endpoint**: `GET /api/projects/:projectId/tasks`
*   **Auth**: Tenant Member

### 18. Update Task Status
*   **Endpoint**: `PATCH /api/tasks/:taskId/status`
*   **Auth**: Tenant Member

### 19. Update Task
*   **Endpoint**: `PUT /api/tasks/:taskId`
*   **Auth**: Tenant Member

## System

### 20. Health Check
*   **Endpoint**: `GET /api/health`
*   **Auth**: Public
*   **Response**: `{"status": "ok", "database": "connected"}`
