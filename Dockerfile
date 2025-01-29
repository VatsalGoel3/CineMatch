# Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src
COPY models/ ./models

ENV PORT=8000

CMD [ "python", "src/app.py" ]