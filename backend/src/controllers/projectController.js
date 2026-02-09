const { pool } = require('../config/db');

// Create Project
exports.createProject = async (req, res) => {
    const { name, description, status } = req.body;

    try {
        // Auth Check
        // Regular users can create projects? Or just Admin?
        // Prompt says: "Create Project... Authorization: Required". Doesn't specify role.
        // Prompt API 12: "Get createdBy from JWT... Check current project count".
        // Usually any user can create projects unless restricted. Let's allow all authenticated users of the tenant.

        const tenantId = req.user.tenantId;
        if (!tenantId) { // Super admin restriction? Super admin shouldn't create projects normally? or can they?
            // Prompt says tenantId from JWT. Super admin has null.
            // If super admin wants to create project, they should probably impersonate or use specific API.
            // But for this requirement, let's assume Tenant Users only.
            return res.status(403).json({ success: false, message: 'Super Admin cannot create projects via this endpoint directly' });
        }

        // Check limits
        const tenantRes = await pool.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const maxProjects = tenantRes.rows[0].max_projects;

        const countRes = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const currentProjects = parseInt(countRes.rows[0].count);

        if (currentProjects >= maxProjects) {
            return res.status(403).json({ success: false, message: 'Subscription project limit reached' });
        }

        const newStatus = status || 'active';

        const projectRes = await pool.query(
            `INSERT INTO projects (tenant_id, name, description, status, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, tenant_id, name, description, status, created_by, created_at`,
            [tenantId, name, description, newStatus, req.user.userId]
        );

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'CREATE_PROJECT', 'project', $3)`,
            [tenantId, req.user.userId, projectRes.rows[0].id]
        );

        res.status(201).json({
            success: true,
            data: projectRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// List Projects
exports.getProjects = async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const tenantId = req.user.tenantId;

    try {
        if (!tenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // If super admin, do we return all projects? Or filter?
        // Prompt Q6: "If super_admin... SELECT * FROM projects".
        // But usually list is tenant specific or global.
        // API 13 says "Filter by user's tenantId automatically".
        // So even for Super Admin, if they use this endpoint without context, maybe list all?
        // Let's implement tenant filter if tenantId exists, else all (for super admin).

        // Wait, frontend usually calls this as a specific user.
        // Let's enforce tenant_id if present.

        let query = `
            SELECT p.*, u.full_name as creator_name,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
        `;
        let countQuery = 'SELECT COUNT(*) FROM projects p';

        const params = [];
        const conditions = [];

        if (tenantId) {
            params.push(tenantId);
            conditions.push(`p.tenant_id = $${params.length}`);
        } else if (req.user.role !== 'super_admin') {
            // Should be covered by !tenantId check above but safety first
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (status) {
            params.push(status);
            conditions.push(`p.status = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`p.name ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        // Count
        const countRes = await pool.query(countQuery, params); // params match based on push order, need to be careful?
        // Wait, if I push limit/offset to params later, they won't affect countQuery.
        // But params array is shared? No, I will copy it or simply use slicing?
        // I used `params.length + 1` logic.
        // So I must PASS `params` to countQuery.

        const total = parseInt(countRes.rows[0].count);

        // List
        const listParams = [...params, limit, offset];
        const projectsRes = await pool.query(query, listParams);

        // Map creator name to structure
        const projects = projectsRes.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            createdAt: p.created_at,
            createdBy: {
                id: p.created_by,
                fullName: p.creator_name
            },
            taskCount: parseInt(p.task_count),
            completedTaskCount: parseInt(p.completed_task_count)
        }));

        res.status(200).json({
            success: true,
            data: {
                projects,
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

// Get Single Project
exports.getProject = async (req, res) => {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;

    try {
        const projectRes = await pool.query(`
            SELECT p.*, u.full_name as creator_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = $1
        `, [projectId]);

        if (projectRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const project = projectRes.rows[0];

        // Authorization Check
        if (project.tenant_id !== tenantId && req.user.role !== 'super_admin') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update Project
exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const tenantId = req.user.tenantId;

    try {
        // Verify project exists and belongs to tenant
        const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== tenantId && req.user.role !== 'super_admin') {
            return res.status(404).json({ success: false, message: 'Project not found' }); // Hide existence
        }

        // Authorization: tenant_admin OR project creator
        const isCreator = req.user.userId === project.created_by;
        const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'super_admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let query = 'UPDATE projects SET updated_at = NOW()';
        const params = [projectId];
        let paramIdx = 2;
        const sets = [];

        if (name) { sets.push(`name = $${paramIdx++}`); params.push(name); }
        if (description) { sets.push(`description = $${paramIdx++}`); params.push(description); }
        if (status) { sets.push(`status = $${paramIdx++}`); params.push(status); }

        if (sets.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        query += ', ' + sets.join(', ');
        query += ' WHERE id = $1 RETURNING *';

        const updateRes = await pool.query(query, params);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'UPDATE_PROJECT', 'project', $3)`,
            [project.tenant_id, req.user.userId, projectId]
        );

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete Project
exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;

    try {
        const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== tenantId && req.user.role !== 'super_admin') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const isCreator = req.user.userId === project.created_by;
        const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'super_admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'DELETE_PROJECT', 'project', $3)`,
            [project.tenant_id, req.user.userId, projectId]
        );

        res.status(200).json({ success: true, message: 'Project deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
