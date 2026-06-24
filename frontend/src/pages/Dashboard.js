// frontend/src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiZap, FiClock, FiTrendingUp,
  FiAward, FiArrowRight, FiActivity
} from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(2)}</strong>
        </p>
      ))}
    </div>
  );
}

// Stat card component
function StatCard({ icon, title, value, subtitle, color, delay }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ "--accent-color": color }}
    >
      <div className="stat-card__icon" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-card__content">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__title">{title}</div>
        {subtitle && (
          <div className="stat-card__subtitle">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, profile, getToken } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const res   = await axios.get(
        `${API_URL}/api/history?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data.records || []);
    } catch {
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Computed stats ────────────────────────────────────────────────
  const totalPredictions = records.length;

  const avgTd = totalPredictions > 0
    ? records.reduce((s, r) => s + (r.outputs?.Td_MPa || 0), 0)
      / totalPredictions
    : 0;

  const maxTd = totalPredictions > 0
    ? Math.max(...records.map(r => r.outputs?.Td_MPa || 0))
    : 0;

  const highRiskCount = records.filter(
    r => (r.outputs?.Td_MPa || 0) > 40
  ).length;

  // ── Chart data ────────────────────────────────────────────────────
  // Last 20 predictions timeline
  const timelineData = [...records]
    .slice(0, 20)
    .reverse()
    .map((r, i) => ({
      name:      i + 1,
      td:        r.outputs?.Td_MPa       || 0,
      dif:       r.outputs?.DIF          || 0,
      rockType:  r.inputs?.rock_type     || "Unknown",
      timestamp: r.timestamp
    }));

  // Rock type frequency
  const rockTypeCounts = records.reduce((acc, r) => {
    const rt = r.inputs?.rock_type || "Unknown";
    acc[rt] = (acc[rt] || 0) + 1;
    return acc;
  }, {});

  const rockTypeData = Object.entries(rockTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Loading rate vs Td scatter
  const scatterData = records.slice(0, 30).map(r => ({
    rate: r.inputs?.loading_rate_GPa_s || 0,
    td:   r.outputs?.Td_MPa            || 0,
  }));

  // ── Welcome greeting ──────────────────────────────────────────────
  const hour       = new Date().getHours();
  const greeting   =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
               "Good evening";

  const displayName =
    profile?.displayName || user?.displayName || "Researcher";

  // ── Model performance reference ───────────────────────────────────
  const MODEL_STATS = [
    { label: "Test R²",   value: "0.9848" },
    { label: "RMSE",      value: "4.92 MPa" },
    { label: "MAPE",      value: "11.63%" },
    { label: "Algorithm", value: "Stacking" },
  ];

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">

        {/* ── Header ── */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="dashboard-header__greeting">
              {greeting}, {displayName.split(" ")[0]} 👋
            </h1>
            <p className="dashboard-header__sub">
              {totalPredictions === 0
                ? "Make your first prediction to get started"
                : `You have ${totalPredictions} prediction${totalPredictions !== 1 ? "s" : ""} recorded`}
            </p>
          </div>
          <Link to="/predict" className="btn btn--primary">
            <FiZap size={18} /> New Prediction
          </Link>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="dashboard-stats">
          <StatCard
            icon={<FiActivity size={22} />}
            title="Total Predictions"
            value={totalPredictions}
            subtitle="All time"
            color="#2563eb"
            delay={0.1}
          />
          <StatCard
            icon={<FiTrendingUp size={22} />}
            title="Average Td"
            value={avgTd > 0 ? `${avgTd.toFixed(1)} MPa` : "—"}
            subtitle="Dynamic tensile strength"
            color="#10b981"
            delay={0.15}
          />
          <StatCard
            icon={<FiAward size={22} />}
            title="Maximum Td"
            value={maxTd > 0 ? `${maxTd.toFixed(1)} MPa` : "—"}
            subtitle="Highest recorded"
            color="#f59e0b"
            delay={0.2}
          />
          <StatCard
            icon={<FiZap size={22} />}
            title="High Risk Samples"
            value={highRiskCount}
            subtitle="Td > 40 MPa"
            color="#ef4444"
            delay={0.25}
          />
        </div>

        {/* ── Quick action cards ── */}
        {totalPredictions === 0 && (
          <motion.div
            className="dashboard-quickstart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="section-title">Get Started</h2>
            <div className="quickstart-grid">
              {[
                {
                  icon:  "⛏",
                  title: "Make a Prediction",
                  desc:  "Enter rock properties and get instant Td prediction",
                  to:    "/predict",
                  color: "#2563eb"
                },
                {
                  icon:  "📊",
                  title: "View History",
                  desc:  "Track all your past predictions in one place",
                  to:    "/history",
                  color: "#10b981"
                },
                {
                  icon:  "👤",
                  title: "Complete Profile",
                  desc:  "Add your organization and research details",
                  to:    "/profile",
                  color: "#f59e0b"
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to={card.to} className="quickstart-card">
                    <div
                      className="quickstart-card__icon"
                      style={{ background: `${card.color}18` }}
                    >
                      {card.icon}
                    </div>
                    <h3 style={{ color: card.color }}>{card.title}</h3>
                    <p>{card.desc}</p>
                    <div className="quickstart-card__arrow">
                      <FiArrowRight size={16} color={card.color} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Charts (only when data exists) ── */}
        {totalPredictions > 0 && (
          <>
            {/* Timeline chart */}
            <motion.div
              className="dashboard-chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="chart-card__header">
                <h2 className="section-title">
                  <FiActivity size={20} /> Prediction Timeline
                </h2>
                <span className="chart-card__badge">
                  Last {Math.min(20, totalPredictions)} predictions
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={timelineData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#4b5563"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{
                      value: "Prediction #",
                      position: "insideBottom",
                      fill: "#4b5563",
                      fontSize: 11
                    }}
                  />
                  <YAxis
                    stroke="#4b5563"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{
                      value: "Td (MPa)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4b5563",
                      fontSize: 11
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="td"
                    name="Td"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#60a5fa" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Rock type bar chart */}
            {rockTypeData.length > 0 && (
              <motion.div
                className="dashboard-chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="chart-card__header">
                  <h2 className="section-title">
                    <FiAward size={20} /> Predictions by Rock Type
                  </h2>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={rockTypeData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#4b5563"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Count"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Recent predictions table */}
            <motion.div
              className="dashboard-recent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="chart-card__header">
                <h2 className="section-title">
                  <FiClock size={20} /> Recent Predictions
                </h2>
                <Link to="/history" className="btn btn--ghost">
                  View All <FiArrowRight size={14} />
                </Link>
              </div>

              <div className="recent-table">
                <div className="recent-table__head">
                  <span>T<sub>d</sub> (MPa)</span>
                  <span>Rock Type</span>
                  <span>Loading Rate</span>
                  <span>DIF</span>
                  <span>Date</span>
                  <span>Risk</span>
                </div>
                {records.slice(0, 8).map((r, i) => {
                  const td  = r.outputs?.Td_MPa || 0;
                  const sev =
                    td > 100 ? { label: "Extreme", color: "#ef4444" } :
                    td > 40  ? { label: "High",    color: "#f59e0b" } :
                    td > 15  ? { label: "Moderate", color: "#3b82f6" } :
                               { label: "Low",     color: "#10b981" };
                  return (
                    <motion.div
                      key={r.id || i}
                      className="recent-table__row"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <span
                        className="recent-td"
                        style={{ color: sev.color }}
                      >
                        {td.toFixed(2)}
                      </span>
                      <span className="recent-rock">
                        {r.inputs?.rock_type || "—"}
                      </span>
                      <span className="recent-rate">
                        {r.inputs?.loading_rate_GPa_s?.toFixed(1) || "—"} GPa/s
                      </span>
                      <span className="recent-dif">
                        {r.outputs?.DIF?.toFixed(3) || "—"}
                      </span>
                      <span className="recent-date">
                        {r.timestamp
                          ? format(new Date(r.timestamp), "MMM d, HH:mm")
                          : "—"}
                      </span>
                      <span
                        className="recent-risk"
                        style={{
                          background: `${sev.color}18`,
                          color:      sev.color,
                          border:     `1px solid ${sev.color}40`
                        }}
                      >
                        {sev.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* ── Model info panel ── */}
        <motion.div
          className="dashboard-model-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="section-title">
            🤖 Model Information
          </h2>
          <div className="model-info-grid">
            {MODEL_STATS.map((s, i) => (
              <div key={i} className="model-info-item">
                <span className="model-info-item__label">{s.label}</span>
                <span className="model-info-item__value">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="model-info-desc">
            <strong>Architecture:</strong> Stacking ensemble — 0.9125×LightGBM
            + 0.0875×CatBoost (Combo_alpha0.5). Trained on 196 SHPB/Brazilian
            test records from 11 rock types. SMOGN augmentation (ratio=1.0).
            Based on Tie et al. (2023) Rock Mech. Rock Eng. 56:6119-6125.
          </div>
        </motion.div>

      </div>
    </div>
  );
}