FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH=/app/src

# Copy requirements trước để tận dụng Docker layer cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

EXPOSE 8000

# Start FastAPI từ thư mục src
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
