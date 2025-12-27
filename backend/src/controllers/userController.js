const { pool } = require('../config/db');

// Update User
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    try {
        // Get user to update
        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const targetUser = userRes.rows[0];

        // Auth Check
        const isSelf = req.user.userId === userId;
        const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === targetUser.tenant_id;
        // Super admin can theoretically update anyone, but requirements focus on tenant_admin.
        // Let's allow super_admin too if needed, but primary is tenant_admin.
        const isSuperAdmin = req.user.role === 'super_admin';

        if (!isSelf && !isTenantAdmin && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Logic
        // Tenant Admin can update Role, IsActive, FullName
        // Self can update FullName Only

        let query = 'UPDATE users SET updated_at = NOW()';
        const params = [userId];
        let paramIdx = 2;
        const sets = [];

        if (fullName) {
            sets.push(`full_name = $${paramIdx++}`);
            params.push(fullName);
        }

        if (role || isActive !== undefined) {
            if (!isTenantAdmin && !isSuperAdmin) {
                return res.status(403).json({ success: false, message: 'Not authorized to update role or status' });
            }
            if (role) {
                if (role !== 'user' && role !== 'tenant_admin') {
                    return res.status(400).json({ success: false, message: 'Invalid role' });
                }
                sets.push(`role = $${paramIdx++}`);
                params.push(role);
            }
            if (isActive !== undefined) {
                sets.push(`is_active = $${paramIdx++}`);
                params.push(isActive);
            }
        }

        if (sets.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        query += ', ' + sets.join(', ');
        query += ' WHERE id = $1 RETURNING id, full_name, role, is_active, updated_at';

        const updateRes = await pool.query(query, params);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'UPDATE_USER', 'user', $3)`,
            [targetUser.tenant_id, req.user.userId, userId]
        );

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Get user to delete
        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const targetUser = userRes.rows[0];

        // Auth Check
        const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === targetUser.tenant_id;
        const isSuperAdmin = req.user.role === 'super_admin';

        if (!isTenantAdmin && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Prevent self-deletion
        if (req.user.userId === userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'DELETE_USER', 'user', $3)`,
            [targetUser.tenant_id, req.user.userId, userId]
        );

        res.status(200).json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
