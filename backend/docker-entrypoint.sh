#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Wait for Database
echo "Waiting for database connection at $DB_HOST:$DB_PORT..."
# Loop until nc returns success
# If nc is not available, we can use a small node script or just rely on 'command -v' check
if command -v nc >/dev/null 2>&1; then
    while ! nc -z $DB_HOST $DB_PORT; do   
      sleep 1
    done
else
    echo "Netcat not found, sleeping 10s as fallback..."
    sleep 10
fi

echo "Database is up!"

# Run Migrations & Seeds (Handled in server.js via sync() and seedData())
# If we were using sequelize-cli, we would do:
# npx sequelize-cli db:migrate
# npm run seed

echo "Starting Server..."
exec "$@"
