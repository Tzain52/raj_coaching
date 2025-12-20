FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (this will run prisma generate via postinstall)
RUN npm ci

# Copy application code
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose port
EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
