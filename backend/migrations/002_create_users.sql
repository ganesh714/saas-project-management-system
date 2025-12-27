-- UP
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- Note: email is NOT unique globaly, only per tenant.
-- But wait, how do we distinguish logins? The prompt says "Login requires tenantSubdomain".
-- So users are scoped to tenants.
-- For super_admin, tenant_id is NULL.
-- Constraint: If tenant_id IS NULL, email must be unique? 
-- Let's add partial unique index for super_admins (tenant_id is null)

CREATE UNIQUE INDEX IF NOT EXISTS unique_super_admin_email ON users (email) WHERE tenant_id IS NULL;

-- DOWN
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;
