// frontend/src/pages/SignupPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  FiUser, FiMail, FiLock, FiEye,
  FiEyeOff, FiArrowRight, FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

const schema = yup.object({
  displayName: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .required("Full name is required"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/,    "Include at least one uppercase letter")
    .matches(/[0-9]/,    "Include at least one number")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

// Password strength checker
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: "",          color: "" },
    { label: "Very weak", color: "#ef4444" },
    { label: "Weak",      color: "#f97316" },
    { label: "Fair",      color: "#f59e0b" },
    { label: "Strong",    color: "#22c55e" },
    { label: "Very strong", color: "#10b981" },
  ];
  return { score, ...map[score] };
}

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate                    = useNavigate();
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);
  const [authError,   setAuthError]   = useState("");
  const [password,    setPassword]    = useState("");

  const strength = getPasswordStrength(password);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({ resolver: yupResolver(schema) });

  // Watch password for strength indicator
  const watchedPassword = watch("password", "");
  React.useEffect(() => setPassword(watchedPassword), [watchedPassword]);

  const friendlyError = (code) => {
    const map = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email":        "Invalid email address.",
      "auth/weak-password":        "Password is too weak.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] || "Sign-up failed. Please try again.";
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setAuthError("");
    try {
      await signup(data.email, data.password, data.displayName);
      toast.success("Account created! Welcome to RockburstAI 🎉");
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
      toast.success("Welcome to RockburstAI!");
      navigate("/dashboard");
    } catch (err) {
      setAuthError(friendlyError(err.code));
    } finally {
      setGoogleLoad(false);
    }
  };

  const passwordRequirements = [
    { label: "At least 8 characters",   met: password.length >= 8      },
    { label: "One uppercase letter",     met: /[A-Z]/.test(password)    },
    { label: "One number",               met: /[0-9]/.test(password)    },
  ];

  return (
    <div className="auth-page">
      {/* Left panel */}
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
              Join the Future of<br />
              <span className="auth-left__title-grad">Rock Mechanics</span>
            </h1>

            <p className="auth-left__subtitle">
              Create your free account and get instant access to our
              stacking ML ensemble for rate-dependent tensile strength prediction.
            </p>

            {/* Benefits list */}
            <div className="auth-benefits">
              {[
                "Unlimited predictions",
                "Full prediction history",
                "CSV export",
                "Research-grade accuracy (R²=0.985)",
                "Dynamic Increase Factor (DIF) computed automatically",
              ].map((b, i) => (
                <motion.div
                  key={i}
                  className="auth-benefit"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <FiCheckCircle size={16} color="#10b981" />
                  <span>{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Rock types chip list */}
          <motion.div
            className="auth-chips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[
              "Granite","Sandstone","Marble",
              "Norite","Orthogneiss","+ more"
            ].map((r, i) => (
              <span key={i} className="auth-chip">{r}</span>
            ))}
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
            <h2>Create your account</h2>
            <p>Free forever - no credit card required</p>
          </div>

          {/* Google */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogle}
            disabled={googleLoad || loading}
          >
            {googleLoad ? <span className="spinner" /> : <FcGoogle size={20} />}
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or create with email</span>
          </div>

          {/* Error */}
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
            {/* Name */}
            <div className="auth-form-group">
              <label className="auth-label">
                <FiUser size={14} /> Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Jane Smith"
                autoComplete="name"
                className={`auth-input ${errors.displayName ? "auth-input--error" : ""}`}
                {...register("displayName")}
              />
              {errors.displayName && (
                <span className="auth-field-error">
                  {errors.displayName.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-label">
                <FiMail size={14} /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
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
              <label className="auth-label">
                <FiLock size={14} /> Password
              </label>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

              {/* Strength bar */}
              {password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="password-strength__segment"
                        style={{
                          background: i <= strength.score
                            ? strength.color
                            : "var(--gray-700)"
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="password-strength__label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}

              {/* Requirements */}
              {password && (
                <div className="password-reqs">
                  {passwordRequirements.map((req, i) => (
                    <div
                      key={i}
                      className={`password-req ${req.met ? "password-req--met" : ""}`}
                    >
                      <FiCheckCircle size={11} />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <span className="auth-field-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm password */}
            <div className="auth-form-group">
              <label className="auth-label">
                <FiLock size={14} /> Confirm Password
              </label>
              <div className="auth-input-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`auth-input ${errors.confirmPassword ? "auth-input--error" : ""}`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirm(p => !p)}
                  tabIndex={-1}
                >
                  {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="auth-field-error">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Terms */}
            <p className="auth-terms">
              By creating an account you agree to use this tool
              for research purposes and accept responsibility
              for validating predictions against laboratory data.
            </p>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn--primary btn--full auth-submit-btn"
              disabled={loading || googleLoad}
            >
              {loading ? (
                <><span className="spinner" /> Creating account...</>
              ) : (
                <>Create Free Account <FiArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}