// frontend/src/pages/LandingPage.js
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  FiZap, FiShield, FiTrendingUp,
  FiDatabase, FiAward, FiArrowRight
} from "react-icons/fi";
import "./LandingPage.css";

const STATS = [
  { value: "R²=0.985",  label: "Model Accuracy",         icon: <FiTrendingUp /> },
  { value: "196",        label: "Training Samples",        icon: <FiDatabase />   },
  { value: "11",         label: "Rock Types Supported",   icon: <FiAward />      },
  { value: "±4.92 MPa", label: "RMSE Precision",          icon: <FiZap />        },
];

const FEATURES = [
  {
    icon:  <FiZap size={28} />,
    title: "Real-Time Prediction",
    desc:  "Get instant tensile strength predictions powered by our stacking ML ensemble (LightGBM + CatBoost)."
  },
  {
    icon:  <FiShield size={28} />,
    title: "Scientifically Validated",
    desc:  "Based on Tie et al. (2023) dataset. 5-fold × 10 repeated CV with SMOGN augmentation."
  },
  {
    icon:  <FiTrendingUp size={28} />,
    title: "Dynamic Increase Factor",
    desc:  "Automatically computes DIF = Td/T₀ — critical for rockburst hazard assessment."
  },
  {
    icon:  <FiDatabase size={28} />,
    title: "Prediction History",
    desc:  "All predictions stored securely in your account. Track, compare, and export results."
  },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__logo">
            <span className="landing__logo-icon">⛰</span>
            <span className="landing__logo-text">RockburstAI</span>
          </div>
          <div className="landing__nav-links">
            <Link to="/about">About</Link>
            <Link to="/login"  className="btn btn--ghost">Sign In</Link>
            <Link to="/signup" className="btn btn--primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <motion.section
        ref={heroRef}
        className="landing__hero"
        style={{ opacity: heroOpacity, y: heroY }}
      >
        {/* Animated background particles */}
        <div className="hero__particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="hero__particle"
              animate={{
                y:       [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat:   Infinity,
                delay:    i * 0.3,
                ease:     "easeInOut"
              }}
              style={{
                left: `${5 + (i * 5)}%`,
                top:  `${10 + (i % 5) * 18}%`,
              }}
            />
          ))}
        </div>

        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero__badge">
            <FiZap size={14} />
            <span>AI-Powered Rock Mechanics Analysis</span>
          </div>

          <h1 className="hero__title">
            Predict Rock
            <span className="hero__title-gradient"> Tensile Strength</span>
            <br />Under Dynamic Loading
          </h1>

          <p className="hero__subtitle">
            Advanced stacking ensemble model for rate-dependent tensile strength
            prediction supporting rockburst hazard assessment in underground
            mining and tunnelling.
          </p>

          <div className="hero__cta">
            <Link to="/signup" className="btn btn--primary btn--lg">
              Start Predicting Free
              <FiArrowRight size={20} />
            </Link>
            <Link to="/about" className="btn btn--ghost btn--lg">
              Learn the Science
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero__stats">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                className="hero__stat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="hero__stat-icon">{s.icon}</div>
                <div className="hero__stat-value">{s.value}</div>
                <div className="hero__stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rock formation illustration */}
        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="hero__model-card">
            <div className="model-card__header">
              <div className="model-card__dot model-card__dot--red" />
              <div className="model-card__dot model-card__dot--amber" />
              <div className="model-card__dot model-card__dot--green" />
              <span className="model-card__title">Live Prediction</span>
            </div>
            <div className="model-card__body">
              <div className="model-card__row">
                <span className="model-card__label">Density</span>
                <span className="model-card__value">2660 kg/m³</span>
              </div>
              <div className="model-card__row">
                <span className="model-card__label">Loading Rate</span>
                <span className="model-card__value">239.6 GPa/s</span>
              </div>
              <div className="model-card__row">
                <span className="model-card__label">Young's Modulus</span>
                <span className="model-card__value">41.69 GPa</span>
              </div>
              <div className="model-card__divider" />
              <div className="model-card__result">
                <span className="model-card__result-label">
                  Predicted T<sub>d</sub>
                </span>
                <motion.span
                  className="model-card__result-value"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  19.2 MPa
                </motion.span>
              </div>
              <div className="model-card__dif">
                DIF = 2.02 &nbsp;|&nbsp; R² = 0.985
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── FEATURES ── */}
      <section className="landing__features">
        <div className="section__container">
          <motion.div
            className="section__header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section__title">
              Everything you need for<br />
              <span className="text-gradient">rock mechanics analysis</span>
            </h2>
            <p className="section__subtitle">
              Built on peer-reviewed research with production-grade ML engineering
            </p>
          </motion.div>

          <div className="features__grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="feature__card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <div className="feature__icon">{f.icon}</div>
                <h3 className="feature__title">{f.title}</h3>
                <p className="feature__desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="landing__cta-banner">
        <motion.div
          className="cta-banner__inner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Ready to predict rock strength?</h2>
          <p>Join researchers worldwide using AI for rock mechanics</p>
          <Link to="/signup" className="btn btn--primary btn--lg">
            Create Free Account
            <FiArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing__footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="landing__logo-icon">⛰</span>
            <span>RockburstAI</span>
          </div>
          <p className="footer__text">
            Based on Tie et al. (2023) Rock Mech. Rock Eng. 56:6119-6125
          </p>
          <div className="footer__links">
            <Link to="/about">About</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <p className="footer__copy">
            © {new Date().getFullYear()} RockburstAI For GeoExplore
          </p>
        </div>
      </footer>
    </div>
  );
}