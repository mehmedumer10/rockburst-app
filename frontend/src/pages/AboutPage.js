// frontend/src/pages/AboutPage.js
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiDatabase, FiCpu, FiTrendingUp,
  FiShield, FiArrowRight, FiBook
} from "react-icons/fi";
import "./AboutPage.css";

const PIPELINE_STEPS = [
  {
    num:   "01",
    title: "Data Preparation",
    icon:  <FiDatabase size={20} />,
    desc:  "196 records from 10 publications, 11 rock types. log1p transformation reduces target skewness from 4.39 → 0.11. RobustScaler with leakage-free 5-fold CV.",
    color: "#2563eb"
  },
  {
    num:   "02",
    title: "SMOGN Augmentation",
    icon:  <FiCpu size={20} />,
    desc:  "SMOTE for regression handles imbalanced Td distribution. Optimal ratio=1.0 selected by 5-fold CV on real data only. Applied inside training folds — never to validation.",
    color: "#7c3aed"
  },
  {
    num:   "03",
    title: "Base Learner Screening",
    icon:  <FiTrendingUp size={20} />,
    desc:  "10 models screened (8 ML + 2 DL) on real data. CatBoost best MAPE=9.12%. LightGBM lowest RMSE=6.39 MPa. Error correlation guides ensemble diversity.",
    color: "#059669"
  },
  {
    num:   "04",
    title: "Hyperparameter Tuning",
    icon:  <FiShield size={20} />,
    desc:  "4 optimizers: Random Search, Cuckoo Search, Harris Hawks, Jaya. Jaya wins 6/10 models. TabNet+Jaya achieves RMSE=6.97 MPa in 3-fold CV.",
    color: "#d97706"
  },
  {
    num:   "05",
    title: "Stacking Ensemble",
    icon:  <FiCpu size={20} />,
    desc:  "Combo_alpha0.5: 0.5×LightGBM_full + 0.5×(0.825×LGB+0.175×CAT). Effective weights: 0.9125×LightGBM + 0.0875×CatBoost. RMSE=4.921 MPa, R²=0.9848.",
    color: "#dc2626"
  },
  {
    num:   "06",
    title: "Validation",
    icon:  <FiShield size={20} />,
    desc:  "5-fold×10 repeats stratified CV: R²=0.919. LOLO (Leave-One-Lithology-Out): RMSE=14.8 MPa — reveals the model interpolates within known rock types.",
    color: "#0891b2"
  },
];

const MODEL_METRICS = [
  { label: "Test R²",         value: "0.9848", sub: "On held-out 30% test set" },
  { label: "Test RMSE",       value: "4.92 MPa", sub: "Root mean squared error" },
  { label: "Test MAPE",       value: "11.63%",  sub: "Mean absolute % error" },
  { label: "CV R² (k-fold)",  value: "0.919",   sub: "5-fold × 10 repeats" },
  { label: "Training Samples", value: "196",     sub: "10 publications, 11 rock types" },
  { label: "Augmented to",    value: "218",      sub: "After SMOGN (ratio=1.0)" },
];

const ROCK_TYPES = [
  { name: "Barre Granite",        n: 46, range: "8.8 – 45.1" },
  { name: "Yunnan Sandstone",     n: 32, range: "6.8 – 10.1" },
  { name: "Ya'an Marble",         n: 20, range: "4.5 – 27.6" },
  { name: "Longyou Sandstone",    n: 19, range: "0.4 – 5.3"  },
  { name: "Fangshan Marble (ZZ)", n: 16, range: "9.5 – 46.8" },
  { name: "Kunming Sandstone",    n: 13, range: "10.2 – 20.8" },
  { name: "Xiaojihan Sandstone",  n: 12, range: "5.3 – 36.5" },
  { name: "Fangshan Marble (Yao)", n: 10, range: "9.9 – 44.0" },
  { name: "Gombak Norite",        n: 10, range: "89.2 – 302.0" },
  { name: "Laurentian Granite",   n: 9,  range: "12.8 – 18.0" },
  { name: "Orthogneiss",          n: 9,  range: "14.8 – 25.7" },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Nav */}
      <nav className="about-nav">
        <div className="about-nav__inner">
          <Link to="/" className="about-logo">
            <span>⛰</span>
            <span>RockburstAI</span>
          </Link>
          <div className="about-nav__links">
            <Link to="/login"  className="btn btn--ghost">Sign In</Link>
            <Link to="/signup" className="btn btn--primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="about-hero">
        <motion.div
          className="about-hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="about-badge">
            <FiBook size={13} />
            Scientific Background
          </div>
          <h1>
            The Science Behind<br />
            <span className="text-gradient">RockburstAI</span>
          </h1>
          <p>
            A peer-reviewed stacking ML ensemble for predicting
            rate-dependent rock tensile strength — built on 196
            experimental records from 10 published studies.
          </p>
          <div className="about-hero__ref">
            <span>📄 Based on:</span>
            <span>
              Tie et al. (2023) Rock Mech. Rock Eng. 56:6119-6125
            </span>
          </div>
        </motion.div>
      </section>

      {/* Why it matters */}
      <section className="about-section">
        <div className="about-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="about-section__title">Why Rate-Dependent Strength?</h2>
            <div className="about-why-grid">
              <div className="about-why-card">
                <h3>🏔 Rockburst Mechanism</h3>
                <p>
                  In deep mining and tunnelling, rocks experience rapid
                  dynamic loading during blasting and seismic events.
                  The dynamic tensile strength T<sub>d</sub> can be 2–10×
                  the quasi-static strength T₀, making accurate prediction
                  critical for hazard assessment.
                </p>
              </div>
              <div className="about-why-card">
                <h3>📈 Dynamic Increase Factor</h3>
                <p>
                  The DIF = T<sub>d</sub>/T₀ quantifies how much stronger
                  rock becomes under dynamic loading. Our model predicts
                  both T<sub>d</sub> and DIF simultaneously, enabling
                  direct input into rockburst risk calculations.
                </p>
              </div>
              <div className="about-why-card">
                <h3>🧪 SHPB & Brazilian Tests</h3>
                <p>
                  Dataset covers both Split Hopkinson Pressure Bar
                  (Direct — 9.2% of records) and Brazilian disc tests
                  (Indirect — 90.8%). The 178:18 imbalance is partially
                  addressed via SMOGN augmentation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ML Pipeline */}
      <section className="about-section about-section--dark">
        <div className="about-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="about-section__title">ML Pipeline</h2>
            <p className="about-section__sub">
              6-step reproducible pipeline with strict anti-leakage design
            </p>
          </motion.div>

          <div className="pipeline-grid">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="pipeline-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{ "--step-color": step.color }}
              >
                <div className="pipeline-card__num"
                  style={{ color: step.color }}>
                  {step.num}
                </div>
                <div className="pipeline-card__icon"
                  style={{ color: step.color, background: `${step.color}18` }}>
                  {step.icon}
                </div>
                <h3 className="pipeline-card__title">{step.title}</h3>
                <p className="pipeline-card__desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Model performance */}
      <section className="about-section">
        <div className="about-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="about-section__title">Model Performance</h2>
          </motion.div>

          <div className="metrics-grid">
            {MODEL_METRICS.map((m, i) => (
              <motion.div
                key={i}
                className="metric-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="metric-card__value">{m.value}</div>
                <div className="metric-card__label">{m.label}</div>
                <div className="metric-card__sub">{m.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Limitations box */}
          <motion.div
            className="limitations-box"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h3>⚠ Honest Limitations</h3>
            <ul>
              <li>
                <strong>LOLO R²=−4.37:</strong> The model fails on completely
                unseen lithologies — it interpolates within the 11 training
                rock types but does not generalize to new geological formations.
              </li>
              <li>
                <strong>Direct test imbalance:</strong> Only 18/196 records
                used Direct (SHPB) method. SMOGN partially addresses this
                but Direct-method predictions have higher uncertainty.
              </li>
              <li>
                <strong>Gombak Norite outlier:</strong> T<sub>d</sub> up to
                302 MPa — physically real, retained in dataset but dominates
                tail predictions.
              </li>
              <li>
                <strong>Research tool only:</strong> Always validate against
                laboratory measurements before engineering decisions.
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Dataset */}
      <section className="about-section about-section--dark">
        <div className="about-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="about-section__title">Training Dataset</h2>
            <p className="about-section__sub">
              196 records from 10 publications | 11 rock-source groups
            </p>
          </motion.div>

          <div className="dataset-table">
            <div className="dataset-table__head">
              <span>Rock Type</span>
              <span>n</span>
              <span>T<sub>d</sub> Range (MPa)</span>
            </div>
            {ROCK_TYPES.map((r, i) => (
              <motion.div
                key={i}
                className="dataset-table__row"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <span>{r.name}</span>
                <span className="dataset-n">{r.n}</span>
                <span className="dataset-range">{r.range}</span>
              </motion.div>
            ))}
          </div>

          {/* Input features */}
          <motion.div
            className="features-box"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h3>Input Features (6)</h3>
            <div className="features-list">
              {[
                { sym: "ρ",      name: "Density",             unit: "kg/m³",  note: "Rock density" },
                { sym: "D",      name: "Diameter",             unit: "mm",     note: "Specimen diameter" },
                { sym: "E",      name: "Young's Modulus",      unit: "GPa",    note: "Elastic stiffness" },
                { sym: "T₀",     name: "Static Strength",      unit: "MPa",    note: "Quasi-static tensile strength" },
                { sym: "log(ṡ)", name: "log1p(Loading Rate)",  unit: "–",      note: "log1p-transformed stress rate" },
                { sym: "M",      name: "Test Method",          unit: "0/1",    note: "0=Indirect, 1=Direct" },
              ].map((f, i) => (
                <div key={i} className="feature-item">
                  <span className="feature-sym">{f.sym}</span>
                  <div>
                    <div className="feature-name">{f.name}</div>
                    <div className="feature-note">{f.note} [{f.unit}]</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Ready to predict?</h2>
          <p>
            Create a free account and start predicting dynamic tensile
            strength in seconds.
          </p>
          <Link to="/signup" className="btn btn--primary btn--lg">
            Get Started Free
            <FiArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-container">
          <p>
            © {new Date().getFullYear()} RockburstAI —
            Research tool based on Tie et al. (2023)
            Rock Mech. Rock Eng. 56:6119-6125
          </p>
          <div className="about-footer__links">
            <Link to="/">Home</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}