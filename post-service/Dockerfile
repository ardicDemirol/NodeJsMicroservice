# Use the official Node.js version 18 image based on Alpine Linux, which is lightweight and efficient.
FROM node:18-alpine

# Set the working directory inside the container to '/use/src/app'. All subsequent commands will be run from this directory.
WORKDIR /use/src/app

# Copy both 'package.json' and 'package-lock.json' files from the local machine to the container's current directory.
COPY package*.json ./

# Install the production dependencies listed in 'package-lock.json' using 'npm ci' for a clean install, ignoring dev dependencies.
RUN npm ci --only=production

# Copy all files from the current directory (including source code and assets) into the container's working directory.
COPY . .

# Expose port 3002 to allow access to the application running on this port inside the container.
EXPOSE 3002

# Set the default command to run when the container starts, launching the 'server.js' file using Node.js.
CMD [ "node","src/server.js" ]

