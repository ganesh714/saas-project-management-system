const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// Register Tenant
exports.registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if subdomain exists
        const subCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (subCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // Check if email exists in any tenant? No, email is unique per tenant.
        // BUT since we are creating a NEW tenant, the email cannot duplicate WITHIN that tenant (which is empty).
        // However, if we want to enforce global uniqueness for admins, we could, but spec says "unique per tenant".
        // So this is fine.

        // Create Tenant
        const tenantRes = await client.query(
            `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3)
       RETURNING id, name, subdomain, subscription_plan`,
            [tenantName, subdomain]
        );
        const tenant = tenantRes.rows[0];

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create Admin User
        const userRes = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'tenant_admin')
       RETURNING id, email, full_name, role`,
            [tenant.id, adminEmail, hashedPassword, adminFullName]
        );
        const user = userRes.rows[0];

        // Audit Log
        await client.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'REGISTER_TENANT', 'tenant', $3)`,
            [tenant.id, user.id, tenant.id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId: tenant.id,
                subdomain: tenant.subdomain,
                adminUser: user
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        // Check for unique constraint violation explicitly if needed
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, message: 'Subdomain or Email collision' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    } finally {
        client.release();
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password, tenantSubdomain, tenantId } = req.body; // Support both subdomain or tenantId? Spec says "tenantSubdomain OR tenantId"

    if (!email || !password || (!tenantSubdomain && !tenantId)) {
        return res.status(400).json({ success: false, message: 'Please provide email, password and tenant identifier' });
    }

    // Handle Super Admin Login (Special Case: no tenant, or login to "system")
    // Spec says: "Super Admin Exception: Super admin users have tenant_id as NULL"
    // If user provides tenantSubdomain, we look up that tenant. If user is super admin, do they log in VIA a tenant subdomain?
    // Usually super admins have a special portal or just log in without tenant context initially?
    // User Prompt Example: superadmin@system.com credentials provided.
    // We should likely support login without tenant for super admin if they don't provide one?
    // But spec says: "Request Body Fields: ... tenantSubdomain (string, required) OR tenantId (string)"
    // So they MUST provide one. 
    // Maybe "system" subdomain? Or just check if email is superadmin?
    // Let's assume for Super Admin they might pass "system" or empty?
    // The requirements say "Verify tenant exists... Verify user belongs to that tenant". 
    // Exception: Super Admin doesn't belong to tenant.
    // So logic:
    // 1. Find Tenant (if provided)
    // 2. Find User in that Tenant.
    // 3. User might be Super Admin (tenant_id IS NULL) -> special check?

    // Clarification Q1 answer: "When a super_admin makes API calls, their JWT token will have tenantId: null".
    // So for login, if they are super admin, they might not need tenantSubdomain?
    // But requirements say "tenantSubdomain (string, required)".
    // Maybe super admins log in via ANY tenant page, but their record is global?
    // Or maybe there is a 'system' tenant?
    // Let's implement robust check.

    try {
        let targetTenantId = null;
        let targetTenantSubdomain = tenantSubdomain;

        if (tenantSubdomain) {
            // Special Case: System/Super Admin Login
            if (tenantSubdomain === 'system') {
                targetTenantId = null;
            } else {
                const tenantRes = await pool.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
                if (tenantRes.rowCount === 0) {
                    return res.status(404).json({ success: false, message: 'Tenant not found' });
                }
                if (tenantRes.rows[0].status === 'suspended') {
                    return res.status(403).json({ success: false, message: 'Tenant is suspended' });
                }
                targetTenantId = tenantRes.rows[0].id;
            }
        } else if (tenantId) {
            // ... find tenant by ID
            targetTenantId = tenantId;
        }

        // Find user
        // Look for user in this tenant OR user is super_admin (tenant_id is NULL)
        // Constraint: UNIQUE(tenant_id, email). Super admins have tenant_id NULL.
        // So we query: WHERE email = $1 AND (tenant_id = $2 OR tenant_id IS NULL)

        // Correction: Validating user belongs to THAT tenant.
        // Super admins can technically login to "any" tenant context?
        // If I am super admin, I can login.

        const userRes = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND (tenant_id = $2 OR tenant_id IS NULL)',
            [email, targetTenantId]
        );

        if (userRes.rowCount === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check Active
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is inactive' });
        }

        // Generate Token
        const payload = {
            userId: user.id,
            tenantId: user.tenant_id, // This will be null for super_admin
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400 // 24 hours
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Me
exports.getMe = async (req, res) => {
    try {
        const userRes = await pool.query('SELECT id, email, full_name, role, is_active, tenant_id FROM users WHERE id = $1', [req.user.userId]);

        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userRes.rows[0];
        let tenant = null;

        if (user.tenant_id) {
            const tenantRes = await pool.query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1', [user.tenant_id]);
            tenant = tenantRes.rows[0];
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                isActive: user.is_active,
                tenantId: user.tenant_id,
                tenant
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Logout
exports.logout = async (req, res) => {
    // JWT is stateless, so we just return success.
    // Client should delete the token.

    // Audit log
    try {
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
            VALUES ($1, $2, 'LOGOUT', 'user', $2)`,
            [req.user.tenantId, req.user.userId]
        );
    } catch (err) {
        console.error("Audit log failed for logout", err);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
};
