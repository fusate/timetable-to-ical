FROM node

RUN mkdir /app/

WORKDIR /app/

COPY src/frontend/ ./frontend/
COPY src/index.js .
COPY src/package.json .
COPY src/package-lock.json .

RUN npm install
RUN npm prune --production
CMD ["node", "index.js"]
