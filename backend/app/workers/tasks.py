import logging
import threading
from app.config import TASK_ALWAYS_EAGER
from app.workers.celery_app import celery_app
from app.services.job_service import execute_job

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="process_string_art_job")
def process_string_art_task(self, job_id: str):
    logger.info("Starting string art generation task for job_id=%s", job_id)
    return execute_job(job_id)

def dispatch_job(job_id: str):
    """
    Submits job to Celery. If TASK_ALWAYS_EAGER is set, executes synchronously.
    If Redis broker is unavailable, falls back to a background daemon thread
    so local development without Redis works smoothly.
    """
    if TASK_ALWAYS_EAGER:
        logger.info("Executing job %s synchronously (TASK_ALWAYS_EAGER=True)", job_id)
        execute_job(job_id)
        return

    try:
        process_string_art_task.delay(job_id)
        logger.info("Successfully queued job %s in Celery", job_id)
    except Exception as e:
        logger.warning(
            "Celery broker unavailable (%s). Dispatching job %s via local background thread.",
            e,
            job_id
        )
        t = threading.Thread(target=execute_job, args=(job_id,), daemon=True)
        t.start()
