// frontend/src/pages/PredictPage.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  FiZap, FiInfo, FiCheckCircle,
  FiAlertTriangle, FiRefreshCw
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./PredictPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Validation schema
const schema = yup.object({
  density_kg_m3:      yup.number().min(1500).max(4000).required("Required"),
  diameter_mm:        yup.number().min(10).max(150).required("Required"),
  youngs_modulus_GPa: yup.number().min(1).max(200).required("Required"),
  static_TS_MPa:      yup.number().min(0.1).max(50).required("Required"),
  loading_rate_GPa_s: yup.number().min(0).max(5000).required("Required"),
  is_Direct:          yup.number().oneOf([0,1]).required("Required"),
  rock_type:          yup.string().optional(),
  notes:              yup.string().optional(),
});

const FIELD_CONFIG = [
  {
    name:        "density_kg_m3",
    label:       "Rock Density",
    unit:        "kg/m³",
    placeholder: "e.g. 2660",
    min: 1500, max: 4000, step: 1,
    hint: "Training range: 2150 – 3097 kg/m³",
    tooltip: "Bulk density of the rock specimen"
  },
  {
    name:        "diameter_mm",
    label:       "Specimen Diameter",
    unit:        "mm",
    placeholder: "e.g. 40",
    min: 10, max: 150, step: 0.01,
    hint: "Training range: 20 – 85 mm",
    tooltip: "Diameter of the cylindrical specimen"
  },
  {
    name:        "youngs_modulus_GPa",
    label:       "Young's Modulus",
    unit:        "GPa",
    placeholder: "e.g. 41.69",
    min: 1, max: 200, step: 0.01,
    hint: "Training range: 6.2 – 92 GPa",
    tooltip: "Elastic modulus of the rock"
  },
  {
    name:        "static_TS_MPa",
    label:       "Static Tensile Strength (T₀)",
    unit:        "MPa",
    placeholder: "e.g. 9.5",
    min: 0.1, max: 50, step: 0.01,
    hint: "Training range: 0.39 – 24.5 MPa",
    tooltip: "Quasi-static Brazilian tensile strength"
  },
  {
    name:        "loading_rate_GPa_s",
    label:       "Loading Rate",
    unit:        "GPa/s",
    placeholder: "e.g. 239.6",
    min: 0, max: 5000, step: 0.01,
    hint: "Training range: 0 – 1866 GPa/s  |  0 = quasi-static",
    tooltip: "Stress rate applied to the specimen"
  },
];

function ResultCard({ result, inputs }) {
  const td    = result.Td_MPa;
  const dif   = result.DIF;
  const r2    = result.model_R2;
  const rmse  = result.model_RMSE_MPa;

  const severity =
    td > 100 ? "extreme" :
    td > 40  ? "high"    :
    td > 15  ? "moderate": "low";

  const severityConfig = {
    extreme:  { color: "#ef4444", label: "Extreme Risk",   icon: "🔴" },
    high:     { color: "#f59e0b", label: "High Risk",      icon: "🟠" },
    moderate: { color: "#3b82f6", label: "Moderate Risk",  icon: "🔵" },
    low:      { color: "#10b981", label: "Low Risk",       icon: "🟢" },
  };

  const cfg = severityConfig[severity];

  return (
    <motion.div
      className="result-card"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="result-card__header">
        <FiCheckCircle size={20} color="#10b981" />
        <span>Prediction Complete</span>
        <span className="result-card__badge" style={{ background: cfg.color }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      <div className="result-card__main">
        <div className="result-main__td">
          <div className="result-main__label">
            Dynamic Tensile Strength T<sub>d</sub>
          </div>
          <div className="result-main__value" style={{ color: cfg.color }}>
            {td.toFixed(2)}
            <span className="result-main__unit"> MPa</span>
          </div>
          <div className="result-main__ci">
            95% CI: [{result.CI_lower_95.toFixed(1)}, {result.CI_upper_95.toFixed(1)}] MPa
          </div>
        </div>

        <div className="result-main__metrics">
          <div className="result-metric">
            <span className="result-metric__label">DIF = T<sub>d</sub>/T₀</span>
            <span className="result-metric__value">
              {dif ? dif.toFixed(3) : "N/A"}
            </span>
          </div>
          <div className="result-metric">
            <span className="result-metric__label">LightGBM</span>
            <span className="result-metric__value">
              {result.Td_LightGBM_MPa.toFixed(2)} MPa
            </span>
          </div>
          <div className="result-metric">
            <span className="result-metric__label">CatBoost</span>
            <span className="result-metric__value">
              {result.Td_CatBoost_MPa.toFixed(2)} MPa
            </span>
          </div>
          <div className="result-metric">
            <span className="result-metric__label">Model R²</span>
            <span className="result-metric__value">{r2.toFixed(4)}</span>
          </div>
          <div className="result-metric">
            <span className="result-metric__label">Model RMSE</span>
            <span className="result-metric__value">±{rmse} MPa</span>
          </div>
          <div className="result-metric">
            <span className="result-metric__label">log₁₊(rate)</span>
            <span className="result-metric__value">
              {result.log1p_loading_rate.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      <div className="result-card__footer">
        <FiInfo size={14} />
        <span>
          Stacking ensemble: 0.9125×LightGBM + 0.0875×CatBoost.
          For research use. Validate against laboratory measurements.
        </span>
      </div>
    </motion.div>
  );
}

export default function PredictPage() {
  const { getToken } = useAuth();
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);

  const {
    register, handleSubmit,
    formState: { errors }, reset
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const token    = await getToken();
      const response = await axios.post(
        `${API_URL}/api/predict`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data.result);
      toast.success("Prediction completed!");
    } catch (err) {
      const msg = err.response?.data?.error || "Prediction failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predict-page">
      <Navbar />
      <div className="predict-page__container">
        {/* Header */}
        <motion.div
          className="predict-page__header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="predict-page__title">
            <FiZap size={28} color="var(--primary-400)" />
            <div>
              <h1>Tensile Strength Predictor</h1>
              <p>
                Stacking ensemble model — R²=0.985, RMSE=4.92 MPa
              </p>
            </div>
          </div>
        </motion.div>

        <div className="predict-page__body">
          {/* Form */}
          <motion.div
            className="predict-form-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="form-card__title">Input Parameters</h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Numeric fields */}
              {FIELD_CONFIG.map((field) => (
                <div key={field.name} className="form-group">
                  <label className="form-label">
                    {field.label}
                    <span className="form-unit">{field.unit}</span>
                    <button
                      type="button"
                      className="form-tooltip-btn"
                      onMouseEnter={() => setShowTooltip(field.name)}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <FiInfo size={12} />
                    </button>
                    {showTooltip === field.name && (
                      <div className="form-tooltip">{field.tooltip}</div>
                    )}
                  </label>
                  <input
                    type="number"
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    className={`form-input ${errors[field.name] ? "form-input--error" : ""}`}
                    {...register(field.name, { valueAsNumber: true })}
                  />
                  <span className="form-hint">{field.hint}</span>
                  {errors[field.name] && (
                    <span className="form-error">
                      <FiAlertTriangle size={12} />
                      {errors[field.name].message}
                    </span>
                  )}
                </div>
              ))}

              {/* Test method */}
              <div className="form-group">
                <label className="form-label">Test Method</label>
                <select
                  className="form-input form-select"
                  {...register("is_Direct", { valueAsNumber: true })}
                >
                  <option value={0}>Indirect (Brazilian Disc)</option>
                  <option value={1}>Direct (Spall Test)</option>
                </select>
              </div>

              {/* Optional fields */}
              <div className="form-group">
                <label className="form-label">Rock Type (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Granite, Sandstone, Marble"
                  className="form-input"
                  {...register("rock_type")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  placeholder="Any additional notes about this sample..."
                  className="form-input form-textarea"
                  rows={3}
                  {...register("notes")}
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => { reset(); setResult(null); }}
                >
                  <FiRefreshCw size={16} /> Reset
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <FiZap size={18} />
                      Predict T<sub>d</sub>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Result panel */}
          <div className="predict-result-panel">
            <AnimatePresence mode="wait">
              {result ? (
                <ResultCard key="result" result={result} />
              ) : (
                <motion.div
                  key="placeholder"
                  className="predict-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="placeholder__icon">⛰</div>
                  <h3>Ready to predict</h3>
                  <p>
                    Fill in the rock properties on the left and click
                    "Predict Tₐ" to get the dynamic tensile strength.
                  </p>
                  <div className="placeholder__model-info">
                    <div className="placeholder__stat">
                      <span>Model</span>
                      <strong>Stacking Ensemble</strong>
                    </div>
                    <div className="placeholder__stat">
                      <span>Test R²</span>
                      <strong>0.9848</strong>
                    </div>
                    <div className="placeholder__stat">
                      <span>Test RMSE</span>
                      <strong>4.921 MPa</strong>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}