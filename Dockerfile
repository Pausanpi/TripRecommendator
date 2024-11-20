# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Set the working directory
WORKDIR /usr/src/script

# Copy application files
COPY public ./public

# Install a simple HTTP server for serving static files
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 5000

# Serve the static files
CMD ["serve", "-s", "public", "-l", "5000", "index.html"]
