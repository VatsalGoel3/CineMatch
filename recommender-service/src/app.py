from flask import Flask, request, jsonify
import traceback
from datetime import datetime, timedelta, timezone
from .model import RecommenderModel

app = Flask(__name__)

# Global (singleton) model instance
model = RecommenderModel()

# Lock/cooldown to prevent repeated training calls
training_in_progress = False
last_trained_time = datetime.min

# Simple cooldown: 2 minutes
TRAIN_COOLDOWN = timedelta(minutes=2)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "time": datetime.now(timezone.utc).isoformat()
    })

@app.route('/train', methods=['POST'])
def train():
    global training_in_progress, last_trained_time
    if training_in_progress:
        return jsonify({"error": "Training is already in progress"}), 423

    # Check cooldown
    now = datetime.now(timezone.utc)
    if now - last_trained_time < TRAIN_COOLDOWN:
        return jsonify({
            "error": "Training cooldown in effect",
            "remaining_seconds": int((TRAIN_COOLDOWN - (now - last_trained_time)).total_seconds())
        }), 429

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    user_interactions = data.get('userInteractions', [])
    item_features = data.get('itemFeatures', [])

    if not user_interactions or not item_features:
        return jsonify({"error": "Missing userInteractions or itemFeatures"}), 400

    try:
        training_in_progress = True
        # Transform interactions to the format expected by LightFM
        transformed_interactions = []
        for interaction in user_interactions:
            transformed_interactions.append({
                "userId": interaction['userId'],
                "itemId": interaction['itemId'],
                "rating": interaction['rating']
            })

        # Train the model
        model.train(transformed_interactions, item_features)
        last_trained_time = datetime.now(timezone.utc)

        return jsonify({
            "status": "trained",
            "trained_at": last_trained_time.isoformat()
        })

    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        training_in_progress = False

@app.route('/recommend/<string:user_id>', methods=['GET'])
def recommend(user_id):
    """
    GET /recommend/<user_id>?num=10
    """
    try:
        num_items = int(request.args.get('num', 20))
    except ValueError:
        return jsonify({"error": "Invalid 'num' parameter. It must be an integer"}), 400

    try:
        recs = model.recommend(user_id, num_items=num_items)
        return jsonify({
            "user_id": user_id,
            "recommendations": recs,
            "generated_at": datetime.now(timezone.utc).isoformat()
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
