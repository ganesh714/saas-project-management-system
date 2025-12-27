const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function runSeeds() {
    const client = await pool.connect();
    try {
        console.log('Running seeds...');
        await client.query('BEGIN');

        // 1. Super Admin
        const superAdminRes = await client.query("SELECT * FROM users WHERE email = 'superadmin@system.com'");
        if (superAdminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, tenant_id)
        VALUES ($1, $2, $3, 'super_admin', NULL)
      `, ['superadmin@system.com', hashedPassword, 'Super Admin']);
            console.log('Created Super Admin');
        }

        // 2. Demo Tenant
        let tenantId;
        const tenantRes = await client.query("SELECT id FROM tenants WHERE subdomain = 'demo'");
        if (tenantRes.rowCount === 0) {
            const res = await client.query(`
        INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
        VALUES ($1, $2, 'active', 'pro', 25, 15)
        RETURNING id
      `, ['Demo Company', 'demo']);
            tenantId = res.rows[0].id;
            console.log('Created Demo Tenant');
        } else {
            tenantId = tenantRes.rows[0].id;
        }

        // 3. Tenant Admin
        const adminRes = await client.query("SELECT * FROM users WHERE email = 'admin@demo.com'");
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('Demo@123', 10);
            await client.query(`
            INSERT INTO users (email, password_hash, full_name, role, tenant_id)
            VALUES ($1, $2, $3, 'tenant_admin', $4)
        `, ['admin@demo.com', hashedPassword, 'Demo Admin', tenantId]);
            console.log('Created Tenant Admin');
        }

        // 4. Regular Users
        const users = [
            { email: 'user1@demo.com', name: 'User One', pass: 'User@123' },
            { email: 'user2@demo.com', name: 'User Two', pass: 'User@123' }
        ];

        for (const u of users) {
            const uRes = await client.query("SELECT * FROM users WHERE email = $1 AND tenant_id = $2", [u.email, tenantId]);
            if (uRes.rowCount === 0) {
                const hashedPassword = await bcrypt.hash(u.pass, 10);
                await client.query(`
                INSERT INTO users (email, password_hash, full_name, role, tenant_id)
                VALUES ($1, $2, $3, 'user', $4)
            `, [u.email, hashedPassword, u.name, tenantId]);
                console.log(`Created User: ${u.email}`);
            }
        }

        // 5. Projects
        let projectId;
        const projectRes = await client.query("SELECT id FROM projects WHERE tenant_id = $1 LIMIT 1", [tenantId]);
        if (projectRes.rowCount === 0) {
            // Get admin id for created_by
            const adminUser = await client.query("SELECT id FROM users WHERE email = 'admin@demo.com'");
            const adminId = adminUser.rows[0].id;

            const pRes = await client.query(`
            INSERT INTO projects (tenant_id, name, description, status, created_by)
            VALUES ($1, 'Project Alpha', 'First demo project', 'active', $2)
            RETURNING id
        `, [tenantId, adminId]);
            projectId = pRes.rows[0].id;
            console.log('Created Project Alpha');

            // Create second project (Project Beta)
            await client.query(`
            INSERT INTO projects (tenant_id, name, description, status, created_by)
            VALUES ($1, 'Project Beta', 'Second demo project', 'active', $2)
        `, [tenantId, adminId]);
            console.log('Created Project Beta');

        } else {
            projectId = projectRes.rows[0].id;
        }

        // 6. Tasks
        const taskRes = await client.query("SELECT * FROM tasks WHERE project_id = $1", [projectId]);
        if (taskRes.rowCount === 0) {
            // Get a user to assign
            const user = await client.query("SELECT id FROM users WHERE email = 'user1@demo.com'");
            const assigneeId = user.rows[0]?.id || null;

            await client.query(`
            INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
            VALUES ($1, $2, 'Design Homepage', 'Create mockup', 'todo', 'high', $3, CURRENT_DATE + 7)
         `, [projectId, tenantId, assigneeId]);
            console.log('Created Sample Task');
        }

        await client.query('COMMIT');
        console.log('Seeds completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seed execution failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

runSeeds();
