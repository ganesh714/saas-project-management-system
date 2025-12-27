FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk --no-cache add curl
RUN npm install

COPY . .

# Add a script to handle migrations and seed before starting
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 5000

# Use the entrypoint script
CMD ["/app/entrypoint.sh"]
