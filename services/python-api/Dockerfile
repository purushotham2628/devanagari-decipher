FROM python:3.12-slim
WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
 && rm -rf /var/lib/apt/lists/*

# Copy project metadata and install in editable mode so dependencies from pyproject are satisfied
COPY pyproject.toml /app/pyproject.toml
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -e .

# Copy backend sources
COPY services/python-api /app/services/python-api

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn","services.python-api.main:app","--host","0.0.0.0","--port","8000"]
