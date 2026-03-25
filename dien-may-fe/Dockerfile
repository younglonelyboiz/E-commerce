FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Mở cổng cho Vite
EXPOSE 5173

# Tham số --host để Vite có thể truy cập từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host"]