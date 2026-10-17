import os
from celery import Celery
from app.config import REDIS_URL, TASK_ALWAYS_EAGER

celery_app = Celery(
    "string_art_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_track_started=True,
    task_always_eager=TASK_ALWAYS_EAGER,
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", "2")),
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_time_limit=1800,  # 30 minutes hard limit
    task_soft_time_limit=1740,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=0,
    task_publish_retry=False,
)
