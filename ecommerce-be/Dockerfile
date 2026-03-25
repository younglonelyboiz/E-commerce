FROM node:20-alpine

# Cài thêm thư viện để build các package đặc thù như bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json trước để Docker cache lại node_modules
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]