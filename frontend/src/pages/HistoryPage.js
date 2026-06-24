// frontend/src/pages/HistoryPage.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock, FiTrash2, FiSearch,
  FiRefreshCw, FiDownload
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./HistoryPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function HistoryRow({ record, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const inputs  = record.inputs  || {};
  const outputs = record.outputs || {};
  const td      = outputs.Td_MPa;
  const dif     = outputs.DIF;

  const severity =
    td > 100 ? "extreme" :
    td > 40  ? "high"    :
    td > 15  ? "moderate": "low";

  const COLORS = {
    extreme: "#ef4444", high: "#f59e0b",
    moderate: "#3b82f6", low: "#10b981"
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(record.id); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div
      className="history-row"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div
        className="history-row__summary"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="history-row__indicator"
          style={{ background: COLORS[severity] }}
        />
        <div className="history-row__td">
          <span style={{ color: COLORS[severity], fontWeight: 700, fontSize: "1.2rem" }}>
            {td?.toFixed(2)}
          </span>
          <span className="history-row__unit"> MPa</span>
        </div>
        <div className="history-row__rock">
          {inputs.rock_type || "—"}
        </div>
        <div className="history-row__dif">
          DIF: {dif?.toFixed(3) || "—"}
        </div>
        <div className="history-row__time">
          {record.timestamp
            ? format(new Date(record.timestamp), "MMM d, yyyy HH:mm")
            : "—"}
        </div>
        <div className="history-row__method">
          {inputs.is_Direct === 1 ? "Direct" : "Indirect"}
        </div>
        <button
          className="history-row__delete"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleting}
          title="Delete record"
        >
          {deleting ? <span className="spinner" /> : <FiTrash2 size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="history-row__detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="detail-grid">
              <div className="detail-section">
                <h4>Inputs</h4>
                <table className="detail-table">
                  <tbody>
                    <tr><td>Density</td><td>{inputs.density_kg_m3} kg/m³</td></tr>
                    <tr><td>Diameter</td><td>{inputs.diameter_mm} mm</td></tr>
                    <tr><td>Young's Modulus</td><td>{inputs.youngs_modulus_GPa} GPa</td></tr>
                    <tr><td>Static T₀</td><td>{inputs.static_TS_MPa} MPa</td></tr>
                    <tr><td>Loading Rate</td><td>{inputs.loading_rate_GPa_s} GPa/s</td></tr>
                    <tr><td>Test Method</td>
                        <td>{inputs.is_Direct === 1 ? "Direct" : "Indirect"}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="detail-section">
                <h4>Outputs</h4>
                <table className="detail-table">
                  <tbody>
                    <tr><td>Td (Ensemble)</td>
                        <td style={{ color: COLORS[severity], fontWeight: 700 }}>
                          {outputs.Td_MPa?.toFixed(3)} MPa
                        </td>
                    </tr>
                    <tr><td>Td (LightGBM)</td><td>{outputs.Td_LightGBM_MPa?.toFixed(3)} MPa</td></tr>
                    <tr><td>Td (CatBoost)</td><td>{outputs.Td_CatBoost_MPa?.toFixed(3)} MPa</td></tr>
                    <tr><td>DIF</td><td>{outputs.DIF?.toFixed(4)}</td></tr>
                    <tr><td>95% CI Lower</td><td>{outputs.CI_lower_95?.toFixed(2)} MPa</td></tr>
                    <tr><td>95% CI Upper</td><td>{outputs.CI_upper_95?.toFixed(2)} MPa</td></tr>
                    <tr><td>Model R²</td><td>{outputs.model_R2}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            {inputs.notes && (
              <div className="detail-notes">
                <strong>Notes:</strong> {inputs.notes}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistoryPage() {
  const { getToken }                    = useAuth();
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search,  setSearch]            = useState("");
  const [sortBy,  setSortBy]            = useState("newest");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await axios.get(
        `${API_URL}/api/history?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data.records || []);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchHistory();

    // Refetch whenever the tab regains focus/visibility. Covers the very
    // common case of: make a prediction on another tab/page, switch back
    // to History, and expect it to already be up to date.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchHistory();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", fetchHistory);

    // Refetch immediately when a prediction is saved elsewhere in the app
    // without needing a full page reload. Dispatch this from your Predict
    // page right after a successful POST to /api/predict, e.g.:
    //   window.dispatchEvent(new CustomEvent("predictionSaved"));
    window.addEventListener("predictionSaved", fetchHistory);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", fetchHistory);
      window.removeEventListener("predictionSaved", fetchHistory);
    };
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(
        `${API_URL}/api/history/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(r => r.filter(x => x.id !== id));
      toast.success("Record deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Timestamp","RockType","Density","Diameter","YoungsMod",
       "StaticTS","LoadingRate","IsDirect","Td_MPa","DIF","CI_lower","CI_upper"],
      ...records.map(r => [
        r.timestamp,
        r.inputs.rock_type     || "",
        r.inputs.density_kg_m3,
        r.inputs.diameter_mm,
        r.inputs.youngs_modulus_GPa,
        r.inputs.static_TS_MPa,
        r.inputs.loading_rate_GPa_s,
        r.inputs.is_Direct,
        r.outputs.Td_MPa,
        r.outputs.DIF,
        r.outputs.CI_lower_95,
        r.outputs.CI_upper_95
      ])
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `rockburst_predictions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  // Filter + sort
  const filtered = records
    .filter(r =>
      !search ||
      (r.inputs.rock_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.inputs.notes     || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") return -1;
      if (sortBy === "oldest") return  1;
      if (sortBy === "highest")
        return (b.outputs.Td_MPa || 0) - (a.outputs.Td_MPa || 0);
      return 0;
    });

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-page__container">
        {/* Header */}
        <motion.div
          className="history-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="history-header__left">
            <FiClock size={24} color="var(--primary-400)" />
            <div>
              <h1>Prediction History</h1>
              <p>{records.length} predictions saved</p>
            </div>
          </div>
          <div className="history-header__actions">
            <button
              className="btn btn--ghost"
              onClick={fetchHistory}
              disabled={loading}
            >
              <FiRefreshCw size={16} /> Refresh
            </button>
            <button
              className="btn btn--ghost"
              onClick={exportCSV}
              disabled={!records.length}
            >
              <FiDownload size={16} /> Export CSV
            </button>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="history-controls">
          <div className="history-search">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Search by rock type or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="history-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Td</option>
          </select>
        </div>

        {/* Table */}
        <div className="history-table">
          <div className="history-table__head">
            <span>Td (MPa)</span>
            <span>Rock Type</span>
            <span>DIF</span>
            <span>Date</span>
            <span>Method</span>
            <span />
          </div>

          {loading ? (
            <div className="history-loading">
              <span className="spinner" />
              Loading history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty__icon">📊</div>
              <h3>No predictions yet</h3>
              <p>Make your first prediction to see results here</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map(r => (
                <HistoryRow
                  key={r.id}
                  record={r}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}