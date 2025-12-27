#!/bin/sh

# Wait for database to be ready (rudimentary check or rely on docker depends_on)
# But depends_on only waits for the container to start, not the DB to be ready for connections.
# Ideally we use a wait-for-it script, but for simplicity we'll retry in the node script or just sleep.

echo "Running migrations..."
npm run migrate

echo "Running seeds..."
npm run seed

echo "Starting server..."
npm start
