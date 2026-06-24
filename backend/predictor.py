# backend/predictor.py

import pickle
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

class RockburstPredictor:
    """
    Production predictor for rate-dependent tensile strength.
    Implements Combo_alpha0.5 stacking ensemble from Step 6.
    """

    def __init__(self, model_path: str = "models/production_model.pkl"):
        self.model_path = model_path
        self._package   = None
        self._load()

    def _load(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                "Run save_production_model.py first."
            )
        with open(self.model_path, "rb") as f:
            self._package = pickle.load(f)

        # Support both native lgb object and version-agnostic string format.
        # If the pickle contains a text string, reconstruct the booster from it.
        # This allows the model trained on lgb 4.1.0 to run on lgb 3.3.5.
        import lightgbm as lgb
        if "lgb_model_str" in self._package and not hasattr(
            self._package.get("lgb_model"), "predict"
        ):
            booster = lgb.Booster(model_str=self._package["lgb_model_str"])
            # Wrap in a minimal object with a .predict() method
            class _BoosterWrapper:
                def __init__(self, b): self._b = b
                def predict(self, X): return self._b.predict(X)
            self._package["lgb_model"] = _BoosterWrapper(booster)
            logger.info("LightGBM model loaded from text string (version-agnostic)")
        else:
            logger.info("LightGBM model loaded from pickle directly")

        logger.info("Model loaded successfully")
        logger.info(f"  LightGBM weight : {self._package['w_lgb']:.4f}")
        logger.info(f"  CatBoost weight : {self._package['w_cat']:.4f}")

    def predict(
        self,
        density_kg_m3:      float,
        diameter_mm:        float,
        youngs_modulus_GPa: float,
        static_TS_MPa:      float,
        loading_rate_GPa_s: float,
        is_Direct:          int
    ) -> dict:
        self._validate(
            density_kg_m3, diameter_mm, youngs_modulus_GPa,
            static_TS_MPa, loading_rate_GPa_s, is_Direct
        )

        log1p_rate = np.log1p(float(loading_rate_GPa_s))

        X = np.array([[
            float(density_kg_m3),
            float(diameter_mm),
            float(youngs_modulus_GPa),
            float(static_TS_MPa),
            log1p_rate,
            float(is_Direct)
        ]], dtype=np.float32)

        X_scaled = self._package["scaler"].transform(X)

        lgb_log = self._package["lgb_model"].predict(X_scaled)[0]
        cat_log = self._package["cat_model"].predict(X_scaled)[0]

        lgb_raw = float(np.expm1(lgb_log))
        cat_raw = float(np.expm1(cat_log))

        w_lgb = self._package["w_lgb"]
        w_cat = self._package["w_cat"]
        td_pred = w_lgb * lgb_raw + w_cat * cat_raw

        mape = self._package["model_info"]["test_mape"] / 100
        ci_lower = max(0.0, td_pred * (1 - 1.96 * mape))
        ci_upper = td_pred * (1 + 1.96 * mape)

        dif = td_pred / float(static_TS_MPa) if static_TS_MPa > 0 else None

        return {
            "Td_MPa":              round(td_pred, 3),
            "Td_LightGBM_MPa":    round(lgb_raw, 3),
            "Td_CatBoost_MPa":    round(cat_raw, 3),
            "DIF":                 round(dif, 4) if dif else None,
            "CI_lower_95":        round(ci_lower, 3),
            "CI_upper_95":        round(ci_upper, 3),
            "log1p_loading_rate": round(log1p_rate, 4),
            "model_name":         "Stacking Ensemble (Combo_alpha0.5)",
            "model_R2":           self._package["model_info"]["test_r2"],
            "model_RMSE_MPa":     self._package["model_info"]["test_rmse"],
        }

    def _validate(self, density, diameter, youngs, static_ts, loading_rate, is_direct):
        errors = []
        if not (1500 <= density <= 4000):
            errors.append(f"density_kg_m3={density} outside safe range [1500, 4000]")
        if not (10 <= diameter <= 150):
            errors.append(f"diameter_mm={diameter} outside safe range [10, 150]")
        if not (1 <= youngs <= 200):
            errors.append(f"youngs_modulus_GPa={youngs} outside safe range [1, 200]")
        if not (0.1 <= static_ts <= 50):
            errors.append(f"static_TS_MPa={static_ts} outside safe range [0.1, 50]")
        if not (0 <= loading_rate <= 5000):
            errors.append(f"loading_rate_GPa_s={loading_rate} outside safe range [0, 5000]")
        if is_direct not in (0, 1):
            errors.append(f"is_Direct must be 0 or 1, got {is_direct}")
        if errors:
            raise ValueError("; ".join(errors))

    @property
    def model_info(self) -> dict:
        return self._package["model_info"]