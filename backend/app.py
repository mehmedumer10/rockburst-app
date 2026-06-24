# backend/app.py

import os
import json
import logging
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore

from predictor import RockburstPredictor

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s"
)
logger = logging.getLogger(__name__)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGIN", "*")}})

# ── Firebase Admin SDK ────────────────────────────────────────────────────────
FIREBASE_CRED_PATH = os.environ.get(
    "FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json"
)
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", "models/production_model.pkl")
predictor  = RockburstPredictor(model_path=MODEL_PATH)
logger.info("Predictor ready: %s", predictor.model_info)


# ── Auth decorator ────────────────────────────────────────────────────────────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing Authorization header"}), 401
        id_token = auth_header.split("Bearer ")[1]
        try:
            decoded = auth.verify_id_token(id_token)
            request.uid  = decoded["uid"]
            request.user = decoded
        except Exception as e:
            logger.warning("Token verification failed: %s", e)
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
    return decorated


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":     "healthy",
        "model":      predictor.model_info["name"],
        "model_R2":   predictor.model_info["test_r2"],
        "model_RMSE": predictor.model_info["test_rmse"],
        "timestamp":  datetime.now(timezone.utc).isoformat()
    })


# ── Prediction endpoint ───────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
@require_auth
def predict():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    required = [
        "density_kg_m3", "diameter_mm", "youngs_modulus_GPa",
        "static_TS_MPa", "loading_rate_GPa_s", "is_Direct"
    ]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        result = predictor.predict(
            density_kg_m3      = float(data["density_kg_m3"]),
            diameter_mm        = float(data["diameter_mm"]),
            youngs_modulus_GPa = float(data["youngs_modulus_GPa"]),
            static_TS_MPa      = float(data["static_TS_MPa"]),
            loading_rate_GPa_s = float(data["loading_rate_GPa_s"]),
            is_Direct          = int(data["is_Direct"])
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        logger.error("Prediction error: %s", e, exc_info=True)
        return jsonify({"error": "Internal prediction error"}), 500

    # Save to Firestore
    record = {
        "uid":       request.uid,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "inputs": {
            "density_kg_m3":      float(data["density_kg_m3"]),
            "diameter_mm":        float(data["diameter_mm"]),
            "youngs_modulus_GPa": float(data["youngs_modulus_GPa"]),
            "static_TS_MPa":      float(data["static_TS_MPa"]),
            "loading_rate_GPa_s": float(data["loading_rate_GPa_s"]),
            "is_Direct":          int(data["is_Direct"]),
            "rock_type":          data.get("rock_type", "Unknown"),
            "notes":              data.get("notes", "")
        },
        "outputs": result
    }
    try:
        doc_ref = db.collection("predictions").add(record)
        pred_id = doc_ref[1].id
    except Exception as e:
        logger.warning("Firestore write failed: %s", e)
        pred_id = "local"

    return jsonify({
        "success":       True,
        "prediction_id": pred_id,
        "result":        result
    })


# ── History endpoint ──────────────────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
@require_auth
def history():
    limit = min(int(request.args.get("limit", 50)), 200)
    try:
        docs = (
            db.collection("predictions")
              .where("uid", "==", request.uid)
              .order_by("timestamp", direction=firestore.Query.DESCENDING)
              .limit(limit)
              .stream()
        )
        records = []
        for doc in docs:
            d = doc.to_dict()
            ts = d.get("timestamp")
            records.append({
                "id":        doc.id,
                "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
                "inputs":    d.get("inputs", {}),
                "outputs":   d.get("outputs", {})
            })
        return jsonify({"success": True, "records": records, "count": len(records)})
    except Exception as e:
        logger.error("History fetch error: %s", e, exc_info=True)
        return jsonify({"error": "Failed to fetch history"}), 500


# ── Delete history record ─────────────────────────────────────────────────────
@app.route("/api/history/<pred_id>", methods=["DELETE"])
@require_auth
def delete_history(pred_id):
    try:
        doc_ref = db.collection("predictions").document(pred_id)
        doc     = doc_ref.get()
        if not doc.exists:
            return jsonify({"error": "Record not found"}), 404
        if doc.to_dict().get("uid") != request.uid:
            return jsonify({"error": "Forbidden"}), 403
        doc_ref.delete()
        return jsonify({"success": True, "deleted_id": pred_id})
    except Exception as e:
        logger.error("Delete error: %s", e, exc_info=True)
        return jsonify({"error": "Delete failed"}), 500


# ── Update user profile ───────────────────────────────────────────────────────
@app.route("/api/profile", methods=["PUT"])
@require_auth
def update_profile():
    data = request.get_json(force=True) or {}
    allowed = {"displayName", "photoURL", "organization", "country", "bio"}
    update  = {k: v for k, v in data.items() if k in allowed}
    if not update:
        return jsonify({"error": "No valid fields to update"}), 400
    try:
        db.collection("users").document(request.uid).set(update, merge=True)
        # Update Firebase Auth display name/photo if provided
        auth_update = {}
        if "displayName" in update:
            auth_update["display_name"] = update["displayName"]
        if "photoURL" in update:
            auth_update["photo_url"] = update["photoURL"]
        if auth_update:
            auth.update_user(request.uid, **auth_update)
        return jsonify({"success": True, "updated": list(update.keys())})
    except Exception as e:
        logger.error("Profile update error: %s", e, exc_info=True)
        return jsonify({"error": "Profile update failed"}), 500


# ── Delete account ────────────────────────────────────────────────────────────
@app.route("/api/account", methods=["DELETE"])
@require_auth
def delete_account():
    try:
        # Delete user's prediction history
        docs = db.collection("predictions").where(
            "uid", "==", request.uid
        ).stream()
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        # Delete user profile
        db.collection("users").document(request.uid).delete()
        # Delete Firebase Auth user
        auth.delete_user(request.uid)
        return jsonify({"success": True, "message": "Account deleted"})
    except Exception as e:
        logger.error("Account delete error: %s", e, exc_info=True)
        return jsonify({"error": "Account deletion failed"}), 500


# ── Model info ────────────────────────────────────────────────────────────────
@app.route("/api/model-info", methods=["GET"])
def model_info():
    return jsonify({
        "success": True,
        "info": {
            **predictor.model_info,
            "features":    predictor._package["features"],
            "architecture": (
                "Stacking Ensemble: 0.9125×LightGBM + 0.0875×CatBoost "
                "(Combo_alpha0.5 from Step 6)"
            ),
            "training_samples":   196,
            "augmented_samples":  predictor._package["model_info"]["n_augmented"],
            "validation_scheme":  "5-fold × 10 repeats + LOLO",
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)