FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
# Use NEXT_PUBLIC_API_URL for client side fetches (browser exposed)
# Use BACKEND_URL for server side Next.js proxying (internal docker network)
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV BACKEND_URL=http://backend:8000

RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
