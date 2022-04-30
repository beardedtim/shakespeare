# Step 1: Create a Docker Image for our
# build artifacts
FROM node:16 as BUILDER

# all of our relative Image paths will
# be relative to `/app`
WORKDIR /app

# COPY everything from my <host location>
# into my <Image location>
COPY . .

# RUN <command> inside of Image
RUN npm i && npm run build

# Step 2: Create a Docker Image for our
# code runner
FROM node:16 as RUNNER

WORKDIR /app

# Copy over just what I need
COPY package.json package-lock.json tsconfig.json .npmrc ./

# COPY from my BUILDER Image above
# the /app/dist folder and put it
# inside of the location /app/dist
COPY --from=BUILDER /app/dist ./dist

RUN npm ci

CMD ["node", "-r", "tsconfig-paths/register", "dist/start.js"]