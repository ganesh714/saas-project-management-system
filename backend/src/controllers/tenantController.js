const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Get Tenant Details
exports.getTenant = async (req, res) => {
    const { tenantId } = req.params;

    try {
        // Authorization: User must belong to this tenant OR be super_admin
        if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this tenant' });
        }

        const tenantRes = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);

        if (tenantRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        // Calculate Stats
        // Count Users
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        // Count Projects
        const projectCountRes = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        // Count Tasks
        const taskCountRes = await pool.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

        const tenant = tenantRes.rows[0];
        const stats = {
            totalUsers: parseInt(userCountRes.rows[0].count),
            totalProjects: parseInt(projectCountRes.rows[0].count),
            totalTasks: parseInt(taskCountRes.rows[0].count)
        };

        res.status(200).json({
            success: true,
            data: {
                ...tenant,
                stats
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// List All Tenants (Super Admin)
exports.getAllTenants = async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM tenants';
        let countQuery = 'SELECT COUNT(*) FROM tenants';
        const params = [];
        const conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (subscriptionPlan) {
            params.push(subscriptionPlan);
            conditions.push(`subscription_plan = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        // Execute count
        const countRes = await pool.query(countQuery, params); // Params match conditions only
        const totalTenants = parseInt(countRes.rows[0].count);

        // Execute list
        const listParams = [...params, limit, offset];
        const tenantsRes = await pool.query(query, listParams);

        // For each tenant, get stats? That might be N+1.
        // Spec says: "Calculate totalUsers and totalProjects for each tenant"
        // We can do a subquery or JOIN. JOIN is better.
        // SELECT t.*, (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users ...
        // Rewriting query for efficiency:

        let complexQuery = `
      SELECT t.*,
      (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_users,
      (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) as total_projects
      FROM tenants t
    `;

        if (conditions.length > 0) {
            complexQuery += ' WHERE ' + conditions.join(' AND ');
        }
        complexQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const enrichedRes = await pool.query(complexQuery, listParams);

        // Format numbers
        const formatted = enrichedRes.rows.map(t => ({
            ...t,
            totalUsers: parseInt(t.total_users),
            totalProjects: parseInt(t.total_projects)
        }));

        res.status(200).json({
            success: true,
            data: {
                tenants: formatted,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTenants / limit),
                    totalTenants,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update Tenant
exports.updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    try {
        // Check Auth
        // Only tenant_admin (of this tenant) OR super_admin
        const isSuperAdmin = req.user.role === 'super_admin';
        const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === tenantId;

        if (!isSuperAdmin && !isTenantAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Retrieve current tenant
        const tenantRes = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const currentTenant = tenantRes.rows[0]; // Not used but good to verify existence

        let query = 'UPDATE tenants SET updated_at = NOW()';
        const params = [tenantId];
        let paramIdx = 2; // $1 is tenantId for WHERE clause (Wait, I construct SET clause first)

        // Helper to add set
        const sets = [];

        // Name: Allowed for both
        if (name) {
            sets.push(`name = $${paramIdx++}`);
            params.push(name);
        }

        // Restricted fields: Only Super Admin
        if (status || subscriptionPlan || maxUsers || maxProjects) {
            if (!isSuperAdmin) {
                return res.status(403).json({ success: false, message: 'Not authorized to update restricted fields' });
            }
            if (status) { sets.push(`status = $${paramIdx++}`); params.push(status); }
            if (subscriptionPlan) { sets.push(`subscription_plan = $${paramIdx++}`); params.push(subscriptionPlan); }
            if (maxUsers) { sets.push(`max_users = $${paramIdx++}`); params.push(maxUsers); }
            if (maxProjects) { sets.push(`max_projects = $${paramIdx++}`); params.push(maxProjects); }
        }

        if (sets.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        query += ', ' + sets.join(', ');
        query += ' WHERE id = $1 RETURNING *';

        const updateRes = await pool.query(query, params);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
         VALUES ($1, $2, 'UPDATE_TENANT', 'tenant', $1)`,
            [tenantId, req.user.userId]
        );

        res.status(200).json({
            success: true,
            message: 'Tenant updated successfully',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Add User to Tenant
exports.createTenantUser = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;

    try {
        // Auth: tenant_admin only (and must match tenantId)
        if (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check Subscription Limits
        const tenantRes = await pool.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        const maxUsers = tenantRes.rows[0].max_users;

        const countRes = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const currentUsers = parseInt(countRes.rows[0].count);

        if (currentUsers >= maxUsers) {
            return res.status(403).json({ success: false, message: 'Subscription user limit reached' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        // Role defaults to 'user' if not provided
        const userRole = role || 'user';
        if (userRole !== 'user' && userRole !== 'tenant_admin') {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const newUserRes = await pool.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, full_name, role, tenant_id, is_active, created_at`,
            [tenantId, email, hashedPassword, fullName, userRole]
        );
        const newUser = newUserRes.rows[0];

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'CREATE_USER', 'user', $3)`,
            [tenantId, req.user.userId, newUser.id]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// List Tenant Users
exports.getTenantUsers = async (req, res) => {
    const { tenantId } = req.params;
    const { search, role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Auth: User must belong to this tenant
        // If super_admin, they can access too (implicit?) logic says "User must belong to this tenant".
        // But super_admin has access to everything.
        if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM users WHERE tenant_id = $1';
        const params = [tenantId];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
            countQuery += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
        }
        if (role) {
            params.push(role);
            query += ` AND role = $${params.length}`;
            countQuery += ` AND role = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        // Count
        const countRes = await pool.query(countQuery, params); // only filter params
        const total = parseInt(countRes.rows[0].count);

        // List
        // Note: We need to be careful with params length.
        // The LIMIT and OFFSET params are added at end.
        const listParams = [...params, limit, offset];
        const usersRes = await pool.query(query, listParams);

        res.status(200).json({
            success: true,
            data: {
                users: usersRes.rows,
                total,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
