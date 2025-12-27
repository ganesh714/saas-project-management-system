const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        await client.query('BEGIN');

        // Create migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Get list of migration files
        const files = fs.readdirSync(MIGRATIONS_DIR).sort();

        // Get executed migrations
        const { rows: executed } = await client.query('SELECT name FROM migrations');
        const executedNames = new Set(executed.map(row => row.name));

        for (const file of files) {
            if (!executedNames.has(file) && file.endsWith('.sql')) {
                console.log(`Executing migration: ${file}`);
                const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

                // Split UP and DOWN (rudimentary check, assume whole file is UP for now or split by -- UP comment)
                // The implementation assumes the file starts with UP logic or just executes the whole file.
                // My migration files have -- UP and -- DOWN. I should execute only UP part?
                // Actually, conventionally in raw sql migrations, we might execute the whole file if it's "up".
                // But my files have both. I should parse it.

                const upContent = content.split('-- DOWN')[0]; // Simple split

                await client.query(upContent);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
            }
        }

        await client.query('COMMIT');
        console.log('Migrations completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        // pool.end() is handled by the script runner or we can close it here if this is a standalone script
        // It is called via 'npm run migrate'.
        pool.end();
    }
}

runMigrations();
