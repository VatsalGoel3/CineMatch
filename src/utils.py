#utils.py
import logging
from loguru import logger

def setup_logging(log_level):
    logger.remove()
    logger.add(
        "recommender-service.log",
        level=log_level,
        rotation="10 MB",
        retention="10 days",
        compression="zip"
    )
    logger.info("Logging is set up.")