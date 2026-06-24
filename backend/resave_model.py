"""
Run this ONCE on your Windows machine (where lightgbm 4.1.0 is installed)
to re-save the LightGBM model in a version-agnostic format.

Usage: python resave_model.py
Output: models/production_model_v2.pkl (same structure, lgb model as text)
"""
import pickle
import lightgbm as lgb
import os

MODEL_PATH = "models/production_model.pkl"
OUTPUT_PATH = "models/production_model_v2.pkl"

print(f"Loading model from {MODEL_PATH}...")
with open(MODEL_PATH, "rb") as f:
    package = pickle.load(f)

print(f"LightGBM version: {lgb.__version__}")
print(f"Package keys: {list(package.keys())}")

# Save LightGBM model as text string (version-agnostic)
lgb_model = package["lgb_model"]
lgb_model_str = lgb_model.booster_.model_to_string()
package["lgb_model_str"] = lgb_model_str
print(f"LightGBM model serialized to string ({len(lgb_model_str):,} chars)")

# Save the updated package
with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(package, f, protocol=4)

print(f"Saved to {OUTPUT_PATH}")
print("Done! Now update predictor.py to load lgb_model_str if lgb_model fails.")
