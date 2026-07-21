# Use official Node.js image as the base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose port 4000
EXPOSE 4000

# Start the application
CMD ["node", "app.js"]