// frontend/src/pages/LoginPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowRight, FiAlertCircle
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

const schema = yup.object({
  email:    yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Min 6 characters").required("Password is required"),
});

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate                   = useNavigate();
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [authError,   setAuthError]   = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: yupResolver(schema) });

  // Friendly Firebase error messages
  const friendlyError = (code) => {
    const map = {
      "auth/user-not-found":      "No account found with this email.",
      "auth/wrong-password":      "Incorrect password. Please try again.",
      "auth/too-many-requests":   "Too many attempts. Try again later.",
      "auth/user-disabled":       "This account has been disabled.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] || "Sign-in failed. Please try again.";
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError("");
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      setAuthError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoad(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      navigate("/dashboard");
    } catch (err) {
      setAuthError(friendlyError(err.code));
    } finally {
      setGoogleLoad(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-page__left">
        <div className="auth-left__content">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Link to="/" className="auth-logo">
              <span className="auth-logo__icon">⛰</span>
              <span className="auth-logo__text">RockburstAI</span>
            </Link>

            <h1 className="auth-left__title">
              Predict Rock<br />
              <span className="auth-left__title-grad">Tensile Strength</span>
            </h1>

            <p className="auth-left__subtitle">
              AI-powered predictions for dynamic tensile strength —
              supporting rockburst hazard assessment worldwide.
            </p>

            {/* Stats */}
            <div className="auth-left__stats">
              {[
                { val: "R²=0.985",  lbl: "Model Accuracy" },
                { val: "196",       lbl: "Training Samples" },
                { val: "11",        lbl: "Rock Types" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="auth-stat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <span className="auth-stat__val">{s.val}</span>
                  <span className="auth-stat__lbl">{s.lbl}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Floating card preview */}
          <motion.div
            className="auth-preview-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="preview-card__row">
              <span>Density</span>
              <span>2660 kg/m³</span>
            </div>
            <div className="preview-card__row">
              <span>Loading Rate</span>
              <span>239.6 GPa/s</span>
            </div>
            <div className="preview-card__divider" />
            <div className="preview-card__result">
              <span>T<sub>d</sub></span>
              <motion.strong
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                19.2 MPa
              </motion.strong>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-page__right">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-form-card__header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {/* Google button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogle}
            disabled={googleLoad || loading}
          >
            {googleLoad ? (
              <span className="spinner" />
            ) : (
              <FcGoogle size={20} />
            )}
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          {/* Error banner */}
          {authError && (
            <motion.div
              className="auth-error-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiAlertCircle size={16} />
              {authError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-label">
                <FiMail size={14} /> Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`auth-input ${errors.email ? "auth-input--error" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <span className="auth-field-error">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label">
                  <FiLock size={14} /> Password
                </label>
                <Link to="/forgot-password" className="auth-forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="auth-field-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn--primary btn--full auth-submit-btn"
              disabled={loading || googleLoad}
            >
              {loading ? (
                <><span className="spinner" /> Signing in...</>
              ) : (
                <>Sign In <FiArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/signup">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}