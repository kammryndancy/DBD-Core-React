# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Create data directory for PVX files
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Volume for PVX data
VOLUME ["/app/data"]

EXPOSE 3001

CMD ["node", "dist/index.js"]
