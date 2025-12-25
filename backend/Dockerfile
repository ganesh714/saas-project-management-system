FROM node:18-alpine

WORKDIR /app

# Install Netcat for DB wait check
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN npm install

COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
