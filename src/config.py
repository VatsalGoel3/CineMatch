#config.py
import os

class Config:
    """ Global config for the recommender."""
    MODEL_FILE = os.getenv('MODEL_FILE', 'lightfm_model.pkl')
    DATASET_FILE = os.getenv('DATASET_FILE', 'dataset.pkl')
    ITEM_FEATURES_FILE = os.getenv('ITEM_FEATURE_FILE', 'item_features.npz')

    MODEL_LOSS = os.getenv('MODEL_LOSS', 'warp')
    MODEL_NO_COMPONENTS = int(os.getenv('MODEL_NO_COMPONENTS', 64))
    MODEL_EPOCHS = int(os.getenv('MODEL_EPOCHS', 20))
    MODEL_LEARNING_RATE = float(os.getenv('MODEL_LEARNING_RATE', 0.05))

    PORT = int(os.environ.get("PORT", 8000))
    DEBUG = os.environ.get("DEBUG", "True") == "True"
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    MODEL_PATH = os.environ.get("MODEL_PATH", "models/lightfm_model.joblib")