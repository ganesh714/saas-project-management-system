const { pool } = require('../config/db');

// Create Task
exports.createTask = async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const tenantId = req.user.tenantId;

    try {
        // Verify Project
        const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const project = projectRes.rows[0];

        if (project.tenant_id !== tenantId && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Project not found or access denied' });
        }

        // Verify Assigned User (if provided)
        if (assignedTo) {
            const userRes = await pool.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [assignedTo, project.tenant_id]);
            if (userRes.rowCount === 0) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
            }
        }

        const newPriority = priority || 'medium';
        const newStatus = 'todo';

        const taskRes = await pool.query(
            `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [projectId, project.tenant_id, title, description, newStatus, newPriority, assignedTo || null, dueDate || null]
        );

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
             VALUES ($1, $2, 'CREATE_TASK', 'task', $3)`,
            [project.tenant_id, req.user.userId, taskRes.rows[0].id]
        );

        res.status(201).json({
            success: true,
            data: taskRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// List Tasks (Project-scoped or Tenant-scoped)
exports.getTasks = async (req, res) => {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const tenantId = req.user.tenantId;

    try {
        let query = `
            SELECT t.*, u.full_name as assignee_name, u.email as assignee_email, u.id as assignee_id, p.name as project_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN projects p ON t.project_id = p.id
        `;
        let countQuery = 'SELECT COUNT(*) FROM tasks t';
        const params = [];
        const conditions = [];

        // Context Filter
        if (projectId) {
            // Verify Project exists
            const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
            if (projectRes.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }
            const project = projectRes.rows[0];
            if (tenantId && project.tenant_id !== tenantId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            params.push(projectId);
            conditions.push(`t.project_id = $${params.length}`);
        } else {
            // Global List - Must enforce Tenant ID
            if (!tenantId && req.user.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
            if (tenantId) {
                params.push(tenantId);
                conditions.push(`t.tenant_id = $${params.length}`);
            }
        }

        // Filters
        if (status) {
            params.push(status);
            conditions.push(`t.status = $${params.length}`);
        }
        if (assignedTo) {
            params.push(assignedTo);
            conditions.push(`t.assigned_to = $${params.length}`);
        }
        if (priority) {
            params.push(priority);
            conditions.push(`t.priority = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`t.title ILIKE $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        // Count
        // Re-construct params for count (exclude limit/offset)
        const countParams = [...params];
        const countRes = await pool.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0].count);

        // List
        const listParams = [...params, limit, offset];
        const tasksRes = await pool.query(query, listParams);

        // Format
        const tasks = tasksRes.rows.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date,
            assignedTo: t.assigned_to ? {
                id: t.assignee_id,
                fullName: t.assignee_name,
                email: t.assignee_email
            } : null,
            projectName: t.project_name,
            createdAt: t.created_at
        }));

        res.status(200).json({
            success: true,
            data: {
                tasks,
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

// Update Task Status (PATCH)
exports.updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    try {
        const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskRes.rows[0];

        if (tenantId && task.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const validStatuses = ['todo', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updateRes = await pool.query(
            'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at',
            [status, taskId]
        );

        res.status(200).json({
            success: true,
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update Task (PUT)
exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const tenantId = req.user.tenantId;

    try {
        const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskRes.rows[0];

        if (tenantId && task.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Validate assignedTo if changing
        if (assignedTo) {
            const userRes = await pool.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [assignedTo, task.tenant_id]);
            if (userRes.rowCount === 0) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
            }
        }

        let query = 'UPDATE tasks SET updated_at = NOW()';
        const params = [taskId];
        let paramIdx = 2;
        const sets = [];

        if (title) { sets.push(`title = $${paramIdx++}`); params.push(title); }
        if (description) { sets.push(`description = $${paramIdx++}`); params.push(description); }
        if (status) { sets.push(`status = $${paramIdx++}`); params.push(status); }
        if (priority) { sets.push(`priority = $${paramIdx++}`); params.push(priority); }
        if (assignedTo !== undefined) {
            // Handle explicit null/undefined for unassign
            sets.push(`assigned_to = $${paramIdx++}`);
            params.push(assignedTo || null);
        }
        if (dueDate !== undefined) {
            sets.push(`due_date = $${paramIdx++}`);
            params.push(dueDate || null);
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
             VALUES ($1, $2, 'UPDATE_TASK', 'task', $3)`,
            [task.tenant_id, req.user.userId, taskId]
        );

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete Task (Bonus/Gap filler)
exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const tenantId = req.user.tenantId;

    try {
        const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        const task = taskRes.rows[0];

        if (tenantId && task.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
              VALUES ($1, $2, 'DELETE_TASK', 'task', $3)`,
            [task.tenant_id, req.user.userId, taskId]
        );

        res.status(200).json({ success: true, message: 'Task deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
