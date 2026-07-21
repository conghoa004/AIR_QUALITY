FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy project files
COPY app.py /app/

# Cài Flask
RUN pip install --no-cache-dir flask

# Expose port 3000
EXPOSE 3000

# Chạy Flask (kích hoạt HTTPS)
CMD ["python", "app.py"]