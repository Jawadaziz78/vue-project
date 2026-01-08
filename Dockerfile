# Stage 1: The Build Stage (The "Kitchen")
FROM node:20.19.6-alpine AS build-stage

# Set working directory inside the container
WORKDIR /app

# Install pnpm version 10.20.0 to match your server
RUN npm install -g pnpm@10.20.0

# Copy only package files first to optimize Docker caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of your source code
COPY . .

# Set the Environment Variable for the build
ARG VITE_BASE_URL=/vue/development/
ENV VITE_BASE_URL=$VITE_BASE_URL

# Build the project
RUN pnpm build

# Stage 2: The Production Stage (The "Waiter")
FROM nginx:stable-alpine

# Copy the built files from Stage 1 to Nginx's serving folder
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
