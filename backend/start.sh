#!/bin/bash

# Start Redis (if not using Docker)
# redis-server &

# Start Celery worker for ML processing (high priority)
celery -A celery_app worker --loglevel=info --queues=ml_processing --concurrency=2 --hostname=ml_worker@%h &

# Start Celery worker for analytics (normal priority)  
celery -A celery_app worker --loglevel=info --queues=analytics --concurrency=4 --hostname=analytics_worker@%h &

# Start Celery worker for default tasks
celery -A celery_app worker --loglevel=info --queues=default --concurrency=2 --hostname=default_worker@%h &

# Start Flower monitoring (optional)
celery -A celery_app flower --port=5555 &

# Start Flask app
python api.py

echo "AMEP Backend started with async processing"