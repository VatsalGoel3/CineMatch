import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset
from scipy.sparse import save_npz, load_npz

import pickle
import os
from.config import Config

class RecommenderModel:
    def __init__(self):
        self.config = Config()
        self.dataset = None
        self.model = None
        self.item_features = None
        self.user_id_map = None
        self.item_id_map = None

    def _build_features(self, item_features_data):
        """Build advanced item features (genres, decade bins, popularity bins)
            Returns a list of (itemId, [feature1, feature2, ...])
        """
        features = []
        for item in item_features_data:
            item_id = item['itemId']
            feats = []

            # Genre features
            for g in item.get('genres', []):
                feats.append(f'genre_{g}')

            # Release date => decade bin
            release_date = item.get('release_date')
            if release_date:
                year = int(release_date.split('-')[0])
                decade = (year // 10) * 10
                feats.append(f'decade_{decade}s')

            # Popularit binding
            popularity = item.get('popularity', 0)
            if popularity > 75:
                feats.append('popularity_high')
            elif popularity > 25:
                feats.append('popularity_mid')
            else:
                feats.append('popularity_low')

            features.append((item_id, feats))
        return features
    
    def _transform_rating(self, rating):
        """
        Convert raw rating (1.5) to a confidence-like weight using logistic curve.
        rating=1 => ~0.27
        rating=3 => ~0.50
        rating=5 => ~0.73
        Modify slope or offset as needed
        """
        return 1.0 / (1.0 + np.exp(-0.5 * (rating - 3.0)))
    
    def train(self, user_interactions, item_features_data):
        """
        Main training function:
        - Build the dataset
        - Build interactions
        - Build item features
        - Fit LightFM model
        """
        # 1) Build item features list
        item_features_list = self._build_features(item_features_data)

        # 2) Initialize the LightFM Dataset
        self.dataset = Dataset()

        # Unique users and items
        users = {ui['userId'] for ui in user_interactions}
        items = {ui['itemId'] for ui in user_interactions}.union(
            {it['itemId'] for it in item_features_data}
        )

        # Build the set of all possible item feature strings
        all_feature_strings = {
            feat
            for (_, feats) in item_features_list
            for feat in feats
        }

        self.dataset.fit(
            users=users,
            items=items,
            item_features=all_feature_strings
        )

        # 3) Build interactions
        interactions, weight = self.dataset.build_interactions(
            (
                ui['userId'],
                ui['itemId'],
                self._transform_rating(ui['rating'])
            )
            for ui in user_interactions
        )

        # 4) Build item feature matrix
        self.item_features = self.dataset.build_item_features(item_features_list)

        # 5) Initialize LightFM model
        self.model = LightFM(
            loss=self.config.MODEL_LOSS,
            no_components=self.config.MODEL_NO_COMPONENTS,
            learning_rate=self.config.MODEL_LEARNING_RATE,
            random_state=42
        )

        # 6) Train with partial fits
        for epoch in range(self.config.MODEL_EPOCHS):
            self.model.fit_partial(
                interactions,
                item_features=self.item_features,
                epochs=1,
                num_threads=4
            )
            print(f">>> Completed epoch {epoch+1}")

        # Store user/item mappding for predictin
        (self.user_id_map, self.item_id_map) = self.dataset.mapping()
    
    def recommend(self, user_id, num_items=20):
        """
        Recommend top N items for a given user.
        filtering out items the user has already interacted with.
        """
        if not self.model or not self.dataset:
            raise ValueError("Model not trained yet.")

        # Convert user_id to internal ID
        if user_id not in self.user_id_map[0]:
            raise ValueError("User not found in the dataset. Train again with this user data.")
        
        user_internal = self.dataset._user_id_mapping[user_id]
        n_items = len(self.dataset._item_id_mapping)

        # Predict scores for all items
        scores = self.model.predict(
            user_ids=user_internal,
            item_ids=np.arange(n_items),
            item_features=self.item_features
        )

        # Sort item indexeds by descending score
        ranked_items = np.argsort(-scores)

        # Map back to external IDs
        rev_item_map = {v: k for k, vi in self.dataset._item_id_mapping.items()}
        recommend = []
        for iidx in ranked_items:
            external_id = rev_item_map[iidx]
            recommend.append(external_id)
            if len(recommend) >= num_items:
                break
        
        return recommend
    
    def save(self, model_path=None, dataset_path=None, item_features_path=None):
        model_path = model_path or self.config.MODEL_FILE
        dataset_path = dataset_path or self.config.DATASET_FILE
        item_features_path = item_features_path or self.config.ITEM_FEATURES_FILE

        # Save model 
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save dataset
        with open(dataset_path, 'wb') as f:
            pickle.dump(self.dataset, f)

        # Save item_features
        save_npz(item_features_path, self.item_features)

    def load(self, model_path=None, dataset_path=None, item_features_path=None):
        model_path = model_path or self.config.MODEL_FILE
        dataset_path = dataset_path or self.config.DATASET_FILE
        item_features_path = item_features_path or self.config.ITEM_FEATURES_FILE

        # Load model
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)

        # Load dataset
        with open(dataset_path, 'rb') as f:
            self.dataset = pickle.load(f)

        # Load item_features
        self.item_features = load_npz(item_features_path)

        (self.user_id_map, self.item_id_map) = self.dataset.mapping()
    